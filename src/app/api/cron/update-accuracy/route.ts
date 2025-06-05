/**
 * @description
 * API Route Handler for a Vercel Cron Job to periodically:
 * 1. Find "mature" predictions (those whose end time has passed but accuracy is not yet calculated).
 * 2. Fetch the actual historical Bitcoin price from CoinGecko for each mature prediction's end time.
 * 3. Calculate the prediction's accuracy.
 * 4. Update the prediction record in the database with the actual price and accuracy.
 *
 * This endpoint is designed to be triggered by a scheduled cron job.
 * It ensures that the request is authorized using a secret token
 * before proceeding with the accuracy update workflow.
 *
 * @method GET
 * @path /api/cron/update-accuracy
 *
 * @security
 * - Expects an `Authorization` header with a Bearer token.
 * - The token is compared against `process.env.CRON_SECRET`.
 *
 * @dependencies
 * - "next/server": For `NextResponse` and `NextRequest`.
 * - "@/actions/db/predictions-actions": For `getMaturePredictionsForUpdateAction` and `updatePredictionWithAccuracyAction`.
 * - "@/actions/coingecko-actions": For `fetchBtcPriceAtTimestampAction`.
 * - "@/lib/math": For `calculateAccuracy`.
 * - "@/db/schema": For `SelectPrediction` type.
 *
 * @returns
 * - 200 OK: If accuracy updates are processed successfully (or no predictions to update).
 * - 207 Multi-Status: If some predictions were processed successfully but others failed.
 * - 401 Unauthorized: If the `Authorization` header is missing or malformed.
 * - 403 Forbidden: If the provided cron secret is invalid.
 * - 500 Internal Server Error: If `CRON_SECRET` is not configured, or if a critical
 *   step like fetching the initial list of mature predictions fails, or for other unhandled exceptions.
 */

import { NextResponse, type NextRequest } from "next/server"
import {
  getMaturePredictionsForUpdateAction,
  updatePredictionWithAccuracyAction,
} from "@/actions/db/predictions-actions"
import { fetchBtcPriceAtTimestampAction } from "@/actions/coingecko-actions"
import { calculateAccuracy } from "@/lib/math"
import type { SelectPrediction } from "@/db/schema"

export async function GET(request: NextRequest) {
  // 1. Authenticate the request
  const authHeader = request.headers.get("authorization")
  if (!authHeader) {
    console.warn("Update accuracy cron: Missing Authorization header.")
    return NextResponse.json(
      { message: "Authorization header is required." },
      { status: 401 }
    )
  }

  const token = authHeader.replace("Bearer ", "")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error(
      "Update accuracy cron: CRON_SECRET is not set in environment variables."
    )
    return NextResponse.json(
      { message: "Server configuration error: CRON_SECRET is missing." },
      { status: 500 }
    )
  }

  if (token !== cronSecret) {
    console.warn("Update accuracy cron: Invalid cron secret.")
    return NextResponse.json(
      { message: "Invalid cron secret." },
      { status: 403 }
    )
  }

  // 2. Main accuracy update logic
  try {
    console.log("Update accuracy cron: Job started.")

    // Fetch mature predictions (predictions whose end time has passed but accuracy is null)
    const maturePredictionsResult = await getMaturePredictionsForUpdateAction()
    if (!maturePredictionsResult.isSuccess) {
      console.error(
        `Update accuracy cron: Failed to fetch mature predictions: ${maturePredictionsResult.message}`
      )
      return NextResponse.json(
        {
          message: `Failed to fetch mature predictions: ${maturePredictionsResult.message}`,
        },
        { status: 500 }
      )
    }

    const predictionsToUpdate: SelectPrediction[] = maturePredictionsResult.data
    if (predictionsToUpdate.length === 0) {
      console.log(
        "Update accuracy cron: No mature predictions to update at this time."
      )
      return NextResponse.json(
        { message: "No mature predictions to update." },
        { status: 200 }
      )
    }

    console.log(
      `Update accuracy cron: Found ${predictionsToUpdate.length} mature predictions to process.`
    )

    let updatedCount = 0
    let failedCount = 0
    const processingErrors: { predictionId: string; error: string }[] = []

    for (const prediction of predictionsToUpdate) {
      try {
        // Fetch actual price from CoinGecko for the prediction's end timestamp
        if (!prediction.prediction_end_timestamp) {
            const errorMsg = `Prediction ID ${prediction.id} is missing prediction_end_timestamp. Skipping.`;
            console.warn(`Update accuracy cron: ${errorMsg}`);
            processingErrors.push({ predictionId: prediction.id, error: errorMsg });
            failedCount++;
            continue;
        }

        const priceResult = await fetchBtcPriceAtTimestampAction(
          prediction.prediction_end_timestamp
        )
        if (!priceResult.isSuccess) {
          const errorMsg = `Failed to fetch price for prediction ID ${prediction.id} (end time: ${prediction.prediction_end_timestamp.toISOString()}): ${priceResult.message}`
          console.warn(`Update accuracy cron: ${errorMsg}`)
          processingErrors.push({ predictionId: prediction.id, error: errorMsg })
          failedCount++
          continue // Skip to next prediction
        }
        const actualPrice = priceResult.data.price

        // Parse predicted_value (string from DB) to number
        const predictedValue = parseFloat(prediction.predicted_value)
        if (isNaN(predictedValue)) {
          const errorMsg = `Invalid predicted_value format for prediction ID ${prediction.id}: '${prediction.predicted_value}'. Cannot parse to float.`
          console.warn(`Update accuracy cron: ${errorMsg}`)
          processingErrors.push({ predictionId: prediction.id, error: errorMsg })
          failedCount++
          continue
        }

        // Calculate accuracy
        const accuracy = calculateAccuracy(actualPrice, predictedValue)

        // Update prediction record in the database
        const updateResult = await updatePredictionWithAccuracyAction(
          prediction.id,
          {
            actual_price: actualPrice,
            accuracy: accuracy,
          }
        )

        if (!updateResult.isSuccess) {
          const errorMsg = `Failed to update accuracy for prediction ID ${prediction.id}: ${updateResult.message}`
          console.warn(`Update accuracy cron: ${errorMsg}`)
          processingErrors.push({ predictionId: prediction.id, error: errorMsg })
          failedCount++
        } else {
          console.log(
            `Update accuracy cron: Successfully updated prediction ID ${prediction.id}. Actual: ${actualPrice}, Predicted: ${predictedValue}, Accuracy: ${accuracy}%`
          )
          updatedCount++
        }
      } catch (innerError: any) {
        const errorMsg = `Unexpected error processing prediction ID ${prediction.id}: ${innerError.message}`
        console.error(`Update accuracy cron: ${errorMsg}`, innerError)
        processingErrors.push({ predictionId: prediction.id, error: errorMsg })
        failedCount++
      }
    }

    const summaryMessage = `Accuracy update processing completed. Predictions updated: ${updatedCount}, Predictions failed: ${failedCount}.`
    console.log(`Update accuracy cron: ${summaryMessage}`)

    if (failedCount > 0 && updatedCount > 0) {
      return NextResponse.json(
        { message: summaryMessage, errors: processingErrors },
        { status: 207 } // Multi-Status for partial success
      )
    }
    if (failedCount > 0 && updatedCount === 0) {
        return NextResponse.json(
            { message: summaryMessage, errors: processingErrors },
            { status: 500 } // All failed
        )
    }

    return NextResponse.json({ message: summaryMessage }, { status: 200 })
  } catch (error: any) {
    console.error(
      `Update accuracy cron: An unexpected error occurred in the main job: ${error.message}`,
      error
    )
    return NextResponse.json(
      {
        message: `An unexpected error occurred: ${error.message}`,
      },
      { status: 500 }
    )
  }
}

// Note on Vercel Cron Job configuration:
// This route should be configured in `vercel.json` or through the Vercel dashboard
// to run on a schedule (e.g., every 5 minutes).
// Example `vercel.json` cron configuration:
// {
//   "crons": [
//     {
//       "path": "/api/cron/update-accuracy",
//       "schedule": "*/5 * * * *" // Every 5 minutes
//     }
//   ]
// }
// The CRON_SECRET environment variable must be set in Vercel project settings.