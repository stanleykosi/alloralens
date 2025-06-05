/**
 * @description
 * This file stores constant values used throughout the AlloraLens application.
 * Centralizing these constants helps in managing configurations and Magic Strings.
 *
 * Key constants:
 * - ALLORA_BTC_5_MIN_TOPIC_ID: The Allora network topic ID for 5-minute Bitcoin price predictions. (Less critical if using SDK's getPriceInference)
 * - ALLORA_BTC_8_HOUR_TOPIC_ID: The Allora network topic ID for 8-hour Bitcoin price predictions. (Less critical if using SDK's getPriceInference)
 * - COINGECKO_API_BASE_URL: The base URL for CoinGecko API.
 * - COINGECKO_BTC_ID: The CoinGecko ID for Bitcoin.
 *
 * @notes
 * - The `ALLORA_BTC_..._TOPIC_ID` constants are kept for potential future use with
 *   `getInferenceByTopicID` if more specific topic control is needed.
 *   The new SDK's `getPriceInference` method simplifies fetching for standard BTC predictions.
 */

// TODO: Replace these placeholder IDs with actual Allora topic IDs for Bitcoin if using getInferenceByTopicID.
// These can typically be found in the Allora network documentation or by querying the network.
export const ALLORA_BTC_5_MIN_TOPIC_ID =
  "replace_with_actual_5_min_btc_topic_id" // Example: 1 for a specific BTC 5min topic
export const ALLORA_BTC_8_HOUR_TOPIC_ID =
  "replace_with_actual_8_hour_btc_topic_id" // Example: 2 for a specific BTC 8hr topic

// CoinGecko API constants
export const COINGECKO_API_BASE_URL = "https://api.coingecko.com/api/v3"
export const COINGECKO_BTC_ID = "bitcoin" // Bitcoin identifier on CoinGecko