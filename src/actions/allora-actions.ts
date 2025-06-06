/**
 * @description
 * This file contains server actions for interacting with the Allora Network.
 * It's responsible for fetching inference data (predictions) using the Allora SDK v2
 * and then processing and storing this data into the application's database.
 *
 * @dependencies
 * - "next/server": For the "use server" directive.
 * - "@alloralabs/allora-sdk/v2": The official SDK for interacting with the Allora Network.
 * - "@/actions/db/predictions-actions": Server action to store predictions in the database.
 * - "@/db/schema": Specifically `predictionTypeEnum` for prediction types.
 * - "@/types": For the `ActionState` type.
 *
 * @module allora-actions
 */
"use server"

import {
  AlloraAPIClient,
  ChainSlug,
  PriceInferenceToken,
  PriceInferenceTimeframe,
  type AlloraInference,
} from "@alloralabs/allora-sdk"
import {
  createPredictionAction,
} from "@/actions/db/predictions-actions"
import { predictionTypeEnum, type InsertPrediction } from "@/db/schema"
import type { ActionState } from "@/types"
import { db } from "@/db/db"
import { predictionsTable } from "@/db/schema"
import { and, eq } from "drizzle-orm"

interface AlloraFetchConfig {
  timeframe: PriceInferenceTimeframe
  type: (typeof predictionTypeEnum.enumValues)[number] // '5-min' | '8-hour'
  durationMs: number
}

const topicsToFetch: AlloraFetchConfig[] = [
  {
    timeframe: PriceInferenceTimeframe.FIVE_MIN,
    type: "5-min",
    durationMs: 5 * 60 * 1000, // 5 minutes in milliseconds
  },
  {
    timeframe: PriceInferenceTimeframe.EIGHT_HOURS,
    type: "8-hour",
    durationMs: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  },
]

// Helper function to normalize prediction values
function normalizePredictionValue(value: string | number): string {
  // The API returns values that need to be normalized to actual BTC price
  // Example: "103677.444932" is the normalized value we want
  const strValue = value.toString()

  // Check if the value is already normalized in the inference data
  if (strValue.includes('.')) {
    return parseFloat(strValue).toFixed(2)
  }

  // If not normalized, convert from raw format
  // Move decimal point to get actual BTC price
  const normalizedValue = parseFloat(strValue) / 100000000
  return normalizedValue.toFixed(2)
}

/**
 * @function fetchAndStoreAlloraPredictionsAction
 * @description Fetches the latest Bitcoin predictions from the Allora Network for
 * predefined timeframes (5-minute and 8-hour), transforms the data, and
 * stores it in the database via `createPredictionAction`. This action is typically
 * intended to be called by a cron job.
 *
 * @returns {Promise<ActionState<void>>} An ActionState object. `isSuccess` will be true
 * if all predictions were fetched and stored successfully, false otherwise. The message
 * will provide details on the outcome.
 *
 * @notes
 * - Requires `ALLORA_API_KEY` and `ALLORA_CHAIN_SLUG` environment variables to be set.
 *   `ALLORA_CHAIN_SLUG` should be 'testnet' or 'mainnet'.
 * - Uses `getPriceInference` method from the Allora SDK v2.
 */
export async function fetchAndStoreAlloraPredictionsAction(): Promise<
  ActionState<void>
> {
  const alloraApiKey = process.env.ALLORA_API_KEY
  const alloraChainSlugEnv = process.env.ALLORA_CHAIN_SLUG?.toLowerCase()

  if (!alloraApiKey) {
    console.error("Allora API key (ALLORA_API_KEY) is not configured.")
    return {
      isSuccess: false,
      message: "Allora API key not configured. Cannot fetch predictions.",
    }
  }

  let alloraChainSlug: ChainSlug
  if (alloraChainSlugEnv === "mainnet") {
    alloraChainSlug = ChainSlug.MAINNET
  } else if (alloraChainSlugEnv === "testnet") {
    alloraChainSlug = ChainSlug.TESTNET
  } else {
    console.warn(
      `Invalid or missing ALLORA_CHAIN_SLUG. Defaulting to TESTNET. Provided: ${alloraChainSlugEnv}`
    )
    alloraChainSlug = ChainSlug.TESTNET // Default to testnet if not specified or invalid
  }

  let client: AlloraAPIClient
  try {
    client = new AlloraAPIClient({
      chainSlug: alloraChainSlug,
      apiKey: alloraApiKey,
    })
  } catch (error) {
    console.error("Failed to initialize AlloraAPIClient:", error)
    return {
      isSuccess: false,
      message: "Failed to initialize Allora SDK client.",
    }
  }

  const results: {
    timeframe: PriceInferenceTimeframe
    success: boolean
    message?: string
  }[] = []

  for (const config of topicsToFetch) {
    try {
      console.log(
        `Fetching BTC price inference for timeframe: ${config.timeframe}`
      )
      const inference: AlloraInference = await client.getPriceInference(
        PriceInferenceToken.BTC,
        config.timeframe
      )

      if (!inference || !inference.inference_data) {
        console.warn(
          `No inference data received for timeframe: ${config.timeframe}`
        )
        results.push({
          timeframe: config.timeframe,
          success: false,
          message: `No inference data for timeframe ${config.timeframe}.`,
        })
        continue
      }

      const inferenceData = inference.inference_data

      // Use UTC dates consistently
      const now = new Date()
      const utcNow = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes(),
          now.getUTCSeconds()
        )
      )

      const predictionEndTimestamp = new Date(utcNow.getTime() + config.durationMs)

      console.log(`Creating prediction with timestamps:`)
      console.log(`- Current time (UTC): ${utcNow.toISOString()}`)
      console.log(`- End time (UTC): ${predictionEndTimestamp.toISOString()}`)

      // Check if we already have this prediction
      const existingPrediction = await db.query.predictionsTable.findFirst({
        where: and(
          eq(predictionsTable.prediction_type, config.type),
          eq(predictionsTable.prediction_end_timestamp, predictionEndTimestamp.toISOString())
        ),
      })

      if (existingPrediction) {
        console.log(
          `Prediction already exists for timeframe ${config.timeframe} and end timestamp ${predictionEndTimestamp.toISOString()}`
        )
        results.push({ timeframe: config.timeframe, success: true })
        continue
      }

      // Normalize the prediction value
      const normalizedPrediction = normalizePredictionValue(inferenceData.network_inference)
      console.log(`Normalized prediction value: ${normalizedPrediction} (original: ${inferenceData.network_inference})`)

      // Extract and normalize confidence intervals
      const ciValues = inferenceData.confidence_interval_values
      const lowerBound = ciValues && ciValues.length > 0
        ? normalizePredictionValue(ciValues[0])
        : null
      const upperBound = ciValues && ciValues.length > 0
        ? normalizePredictionValue(ciValues[ciValues.length - 1])
        : null

      // Create a copy of the inference data with corrected timestamp
      const inferenceDataWithCorrectTimestamp = {
        ...inferenceData,
        timestamp: Math.floor(utcNow.getTime() / 1000) // Convert current UTC time to Unix timestamp
      }

      const insertData: InsertPrediction = {
        prediction_type: config.type,
        predicted_value: normalizedPrediction,
        confidence_interval_lower: lowerBound,
        confidence_interval_upper: upperBound,
        prediction_end_timestamp: predictionEndTimestamp.toISOString(),
        raw_inference_data: inferenceDataWithCorrectTimestamp as any,
        created_at: utcNow.toISOString(),
      }

      const storeResult = await createPredictionAction(insertData)
      if (storeResult.isSuccess) {
        console.log(
          `Successfully stored BTC prediction for timeframe: ${config.timeframe}`
        )
        results.push({ timeframe: config.timeframe, success: true })
      } else {
        console.error(
          `Failed to store BTC prediction for timeframe: ${config.timeframe}. Reason: ${storeResult.message}`
        )
        results.push({
          timeframe: config.timeframe,
          success: false,
          message: `DB store failed for ${config.timeframe}: ${storeResult.message}`,
        })
      }
    } catch (error: any) {
      console.error(
        `Error fetching or processing BTC prediction for timeframe ${config.timeframe}:`,
        error
      )
      results.push({
        timeframe: config.timeframe,
        success: false,
        message: `API fetch/process failed for ${config.timeframe}: ${error.message}`,
      })
    }
  }

  const allSuccessful = results.every((r) => r.success)
  if (allSuccessful && results.length > 0) {
    return {
      isSuccess: true,
      message: "All Allora predictions fetched and stored successfully.",
      data: undefined
    }
  } else if (results.length === 0) {
    return {
      isSuccess: false,
      message: "No Allora timeframes configured or processed.",
    }
  } else {
    const errorMessages = results
      .filter((r) => !r.success)
      .map((r) => r.message)
      .join("; ")
    return {
      isSuccess: false,
      message: `Some predictions failed: ${errorMessages}`,
    }
  }
}