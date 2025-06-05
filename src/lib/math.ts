/**
 * @description
 * This file contains mathematical utility functions for the AlloraLens application.
 * These functions support various calculations needed across the app, primarily
 * related to accuracy and data analysis.
 *
 * @module math
 */

/**
 * @function calculateAccuracy
 * @description
 * Calculates the prediction accuracy using the formula:
 * `(1 - |(Actual - Predicted) / Actual|) * 100%`.
 * A higher percentage indicates better accuracy.
 *
 * If the actual price is 0:
 * - If the predicted price is also 0, accuracy is considered 100%.
 * - If the predicted price is not 0, accuracy is considered 0% to avoid division by zero
 *   and to represent a significant misprediction when the actual value is zero.
 *
 * @param {number} actualPrice - The actual (true) price of the asset.
 * @param {number} predictedPrice - The price predicted by the network.
 * @returns {number} The accuracy percentage, rounded to two decimal places.
 *
 * @example
 * calculateAccuracy(100, 95); // Returns 95.00
 * calculateAccuracy(100, 105); // Returns 95.00
 * calculateAccuracy(50, 50); // Returns 100.00
 * calculateAccuracy(0, 10); // Returns 0.00
 * calculateAccuracy(0, 0); // Returns 100.00
 */
export function calculateAccuracy(
  actualPrice: number,
  predictedPrice: number
): number {
  if (actualPrice === 0) {
    // If actual price is 0, and predicted is also 0, it's a perfect prediction in this context.
    // If actual is 0 and predicted is non-zero, accuracy is 0% as per spec.
    return predictedPrice === 0 ? 100.0 : 0.0
  }

  const absoluteError = Math.abs(actualPrice - predictedPrice)
  const relativeError = absoluteError / actualPrice
  const accuracy = (1 - relativeError) * 100

  // Ensure accuracy is not negative (e.g., if predicted is wildly off)
  // and cap at 100%.
  const boundedAccuracy = Math.max(0, Math.min(accuracy, 100))

  // Round to two decimal places
  return parseFloat(boundedAccuracy.toFixed(2))
}