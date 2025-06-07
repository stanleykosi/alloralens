/**
 * @description
 * API Route Handler for a QStash Task to periodically:
 * 1. Find "mature" predictions (those whose end time has passed but accuracy is not yet calculated).
 * 2. Fetch the actual historical Bitcoin price from CoinGecko for each mature prediction's end time.
 * 3. Calculate the prediction's accuracy.
 * 4. Update the prediction record in the database with the actual price and accuracy.
 *
 * This endpoint is designed to be triggered by a scheduled QStash task.
 * It uses the `@upstash/qstash/next` wrapper to verify the request signature
 * before proceeding with the accuracy update workflow.
 *
 * @method POST
 * @path /api/cron/update-accuracy
 *
 * @security
 * - The request is verified by QStash using signature verification.
 * - `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` must be set.
 *
 * @dependencies
 * - "next/server": For `NextResponse`.
 * - "@upstash/qstash/next": For `verifySignature`.
 * - "@/actions/db/predictions-actions": For `getMaturePredictionsForUpdateAction` and `updatePredictionWithAccuracyAction`.
 * - "@/actions/coingecko-actions": For `fetchBtcPriceAtTimestampAction`.
 * - "@/lib/math": For `calculateAccuracy`.
 * - "@/db/schema": For `SelectPrediction` type.
 *
 * @returns
 * - 200 OK: If accuracy updates are processed successfully (or no predictions to update).
 * - 207 Multi-Status: If some predictions were processed successfully but others failed.
 * - 401 Unauthorized: If the QStash signature verification fails.
 * - 500 Internal Server Error: If a critical step like fetching the initial
 *   list of mature predictions fails, or for other unhandled exceptions.
 */

import { NextResponse } from "next/server"
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs"
import {
  getMaturePredictionsForUpdateAction,
  updatePredictionWithAccuracyAction,
} from "@/actions/db/predictions-actions"
import { fetchBtcPriceAtTimestampAction } from "@/actions/coingecko-actions"
import { calculateAccuracy } from "@/lib/math"
import type { SelectPrediction } from "@/db/schema"

async function handler() {
  // Main accuracy update logic
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
        // Ensure prediction_end_timestamp is in UTC
        if (!prediction.prediction_end_timestamp) {
          const errorMsg = `Prediction ID ${prediction.id} is missing prediction_end_timestamp. Skipping.`
          console.warn(`Update accuracy cron: ${errorMsg}`)
          processingErrors.push({ predictionId: prediction.id, error: errorMsg })
          failedCount++
          continue
        }

        // Parse the timestamp string to a UTC Date object
        const endTimestamp = new Date(prediction.prediction_end_timestamp)

        // [NEW] Guardrail: Check if the prediction's end time is still in the future.
        // This prevents calls to CoinGecko for invalid (future) dates, which would
        // result in a 400 Bad Request. This is a defense against the upstream
        // issue where prediction end times are being set incorrectly.
        if (endTimestamp > new Date()) {
          const errorMsg = `Prediction ID ${prediction.id} has a future end_timestamp (${endTimestamp.toISOString()}) and will be skipped. This indicates an issue with prediction creation.`
          console.warn(`Update accuracy cron: ${errorMsg}`)
          processingErrors.push({ predictionId: prediction.id, error: errorMsg })
          failedCount++
          continue
        }

        console.log(`Processing prediction ID ${prediction.id} with end timestamp: ${endTimestamp.toISOString()}`)

        const priceResult = await fetchBtcPriceAtTimestampAction(endTimestamp)
        if (!priceResult.isSuccess) {
          const errorMsg = `Failed to fetch price for prediction ID ${prediction.id} (end time: ${endTimestamp.toISOString()}): ${priceResult.message}`
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

export const POST = verifySignatureAppRouter(handler)