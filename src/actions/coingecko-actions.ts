/**
 * @description
 * This file contains server actions for interacting with the CoinGecko API.
 * Specifically, it's used to fetch historical Bitcoin (BTC) prices at given timestamps,
 * which is essential for calculating the accuracy of predictions.
 *
 * @dependencies
 * - "next/server": For the "use server" directive.
 * - "@/lib/constants": For `COINGECKO_API_BASE_URL` and `COINGECKO_BTC_ID`.
 * - "@/types": For the `ActionState` type.
 *
 * @module coingecko-actions
 */
"use server"

import {
  COINGECKO_API_BASE_URL,
  COINGECKO_BTC_ID,
} from "@/lib/constants"
import type { ActionState } from "@/types"

interface CoinGeckoPriceData {
  prices: [number, number][] // Array of [timestamp_ms, price]
  // market_caps and total_volumes are also typically present but not used here
}

interface FetchBtcPriceResult {
  price: number
}

const VS_CURRENCY = "usd" // Standard currency for price comparison
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000 // 1 second

async function fetchWithRetry(url: string, headers: HeadersInit = {}, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, { headers })

    if (response.status === 429) { // Rate limit exceeded
      if (retries > 0) {
        console.log(`Rate limit exceeded. Retrying in ${RETRY_DELAY_MS}ms... (${retries} retries left)`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
        return fetchWithRetry(url, headers, retries - 1)
      }
    }

    return response
  } catch (error) {
    if (retries > 0) {
      console.log(`Fetch failed. Retrying in ${RETRY_DELAY_MS}ms... (${retries} retries left)`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      return fetchWithRetry(url, headers, retries - 1)
    }
    throw error
  }
}

async function getCurrentBtcPrice(headers: HeadersInit = {}): Promise<number> {
  const currentPriceUrl = `${COINGECKO_API_BASE_URL}/simple/price?ids=${COINGECKO_BTC_ID}&vs_currencies=${VS_CURRENCY}`
  
  const response = await fetchWithRetry(currentPriceUrl, headers)
  if (!response.ok) {
    throw new Error(`Failed to fetch current BTC price. Status: ${response.status}`)
  }
  
  const data = await response.json()
  return data[COINGECKO_BTC_ID][VS_CURRENCY]
}

/**
 * @function fetchBtcPriceAtTimestampAction
 * @description Fetches the historical Bitcoin (BTC) price from CoinGecko for a specific
 *   point in time. It requests a small time range around the target timestamp to
 *   find the closest available price point.
 *
 * @param {Date} timestamp - The target Date object for which to fetch the BTC price.
 * @returns {Promise<ActionState<FetchBtcPriceResult>>} An ActionState object.
 *   On success, `data` contains an object with the `price`.
 *   On failure, `message` describes the error.
 *
 * @notes
 * - Uses the CoinGecko API endpoint `/coins/{id}/market_chart/range`.
 * - Requires `COINGECKO_API_KEY` environment variable for authenticated requests
 *   (recommended for better rate limits). Falls back to unauthenticated if not set.
 * - The time range for fetching is +/- 1 minute around the target timestamp.
 */
export async function fetchBtcPriceAtTimestampAction(
  timestamp: Date
): Promise<ActionState<FetchBtcPriceResult>> {
  const targetTimestampMs = timestamp.getTime()
  const now = Date.now()

  const apiKey = process.env.COINGECKO_API_KEY
  const headers: HeadersInit = {
    Accept: "application/json",
  }

  if (apiKey) {
    headers["x-cg-pro-api-key"] = apiKey
  }

  // If the timestamp is in the future or very recent (within last minute), use current price
  if (targetTimestampMs > now - 60000) { // If future or less than 1 minute ago
    try {
      console.log(`Using current price for timestamp ${timestamp.toISOString()}`)
      const currentPrice = await getCurrentBtcPrice(headers)
      
      return {
        isSuccess: true,
        message: "Current BTC price fetched successfully.",
        data: { price: currentPrice }
      }
    } catch (error: any) {
      return {
        isSuccess: false,
        message: `Failed to fetch current BTC price: ${error.message}`
      }
    }
  }

  // For historical prices (more than 1 minute ago), use the market chart endpoint
  const fromTimestampSeconds = Math.floor((targetTimestampMs - 60 * 1000) / 1000) // 1 minute before
  const toTimestampSeconds = Math.floor((targetTimestampMs + 60 * 1000) / 1000) // 1 minute after

  const apiUrl = `${COINGECKO_API_BASE_URL}/coins/${COINGECKO_BTC_ID}/market_chart/range?vs_currency=${VS_CURRENCY}&from=${fromTimestampSeconds}&to=${toTimestampSeconds}`

  try {
    console.log(`Fetching historical BTC price from CoinGecko for timestamp: ${timestamp.toISOString()}`)
    const response = await fetchWithRetry(apiUrl, headers)

    if (!response.ok) {
      // If historical data fetch fails, fall back to current price
      if (response.status === 400) {
        try {
          console.log(`Historical data not available, falling back to current price`)
          const currentPrice = await getCurrentBtcPrice(headers)
          
          return {
            isSuccess: true,
            message: "Fell back to current BTC price as historical data was unavailable.",
            data: { price: currentPrice }
          }
        } catch (fallbackError: any) {
          return {
            isSuccess: false,
            message: `Failed to fetch both historical and current prices: ${fallbackError.message}`
          }
        }
      }

      let errorMessage = `CoinGecko API request failed with status ${response.status}.`
      try {
        const errorData = await response.json()
        errorMessage += ` Error: ${errorData?.error || response.statusText}`
      } catch (e) {
        // Ignore if error response is not JSON
      }
      console.error(errorMessage)
      if (response.status === 429) {
        errorMessage = "CoinGecko API rate limit exceeded. Please try again later."
      }
      return { isSuccess: false, message: errorMessage }
    }

    const data: CoinGeckoPriceData = await response.json()

    if (!data.prices || data.prices.length === 0) {
      const message = `No price data found from CoinGecko for timestamp ${timestamp.toISOString()} in the requested range.`
      console.warn(message)
      return { isSuccess: false, message }
    }

    // Find the price closest to the target timestamp
    let closestPricePoint: [number, number] | null = null
    let smallestDiff = Infinity

    for (const pricePoint of data.prices) {
      const [priceTimestampMs, _price] = pricePoint
      const diff = Math.abs(priceTimestampMs - targetTimestampMs)
      if (diff < smallestDiff) {
        smallestDiff = diff
        closestPricePoint = pricePoint
      }
    }

    if (closestPricePoint) {
      const price = closestPricePoint[1]
      console.log(`Found closest BTC price: ${price} at ${new Date(closestPricePoint[0]).toISOString()}`)
      return {
        isSuccess: true,
        message: "BTC price fetched successfully.",
        data: { price },
      }
    } else {
      // This case should ideally not be reached if data.prices is not empty,
      // but as a fallback.
      const message = `Could not determine closest price from CoinGecko for ${timestamp.toISOString()}.`
      console.warn(message)
      return { isSuccess: false, message }
    }
  } catch (error: any) {
    console.error("Error fetching BTC price from CoinGecko:", error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred while fetching BTC price: ${error.message}`,
    }
  }
}