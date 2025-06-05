/**
 * @description
 * Unit tests for the `calculateAccuracy` function in `src/lib/math.ts`.
 * These tests cover various scenarios to ensure the correctness of the
 * accuracy calculation logic.
 *
 * @module math.test
 */

import { calculateAccuracy } from "@/lib/math"

describe("calculateAccuracy", () => {
  it("should return 100 for a perfect prediction (actual equals predicted)", () => {
    expect(calculateAccuracy(100, 100)).toBe(100.0)
    expect(calculateAccuracy(50000, 50000)).toBe(100.0)
  })

  it("should return 90 for a 10% positive error", () => {
    // Predicted is 10% higher than actual
    expect(calculateAccuracy(100, 110)).toBe(90.0)
  })

  it("should return 90 for a 10% negative error", () => {
    // Predicted is 10% lower than actual
    expect(calculateAccuracy(100, 90)).toBe(90.0)
  })

  it("should calculate accuracy correctly for various valid inputs", () => {
    expect(calculateAccuracy(200, 180)).toBe(90.0) // 10% error
    expect(calculateAccuracy(200, 220)).toBe(90.0) // 10% error
    expect(calculateAccuracy(75, 70)).toBe(93.33) // (1 - 5/75)*100 = 93.333...
    expect(calculateAccuracy(60000, 59000)).toBe(98.33) // (1 - 1000/60000)*100 = 98.333...
  })

  it("should handle zero actual price: return 0 if predicted is non-zero", () => {
    expect(calculateAccuracy(0, 50)).toBe(0.0)
    expect(calculateAccuracy(0, -50)).toBe(0.0)
    expect(calculateAccuracy(0, 0.001)).toBe(0.0)
  })

  it("should handle zero actual price: return 100 if predicted is also zero", () => {
    expect(calculateAccuracy(0, 0)).toBe(100.0)
  })

  it("should cap accuracy at 0 if relative error is greater than 1 (prediction is more than twice the actual or negative when actual is positive)", () => {
    // Predicted price is more than double the actual price
    expect(calculateAccuracy(100, 300)).toBe(0.0) // Error = |100-300|/100 = 2. (1-2)*100 = -100. Capped at 0.
    // Predicted price is negative when actual is positive
    expect(calculateAccuracy(100, -50)).toBe(0.0) // Error = |100 - (-50)|/100 = 1.5. (1-1.5)*100 = -50. Capped at 0.
  })

  it("should handle floating point numbers correctly and round to two decimal places", () => {
    expect(calculateAccuracy(100.5, 100.0)).toBe(99.5) // Error: 0.5/100.5 = 0.004975... => (1-0.004975)*100 = 99.5024...
    expect(calculateAccuracy(33.33, 33.0)).toBe(99.01) // Error: 0.33/33.33 = 0.009900... => (1-0.009900)*100 = 99.0099...
  })

  it("should ensure accuracy is not greater than 100", () => {
    // This case should not happen with the formula (1 - |err|/actual) if |err|/actual is always >= 0
    // However, as a safeguard if logic changes, it's good to test.
    // For example, if a faulty calculation somehow resulted in a negative relative error.
    // The Math.min(accuracy, 100) in the function handles this.
    // To test this specific bound, we'd need to mock internal calculations or use an
    // example where the error is negative, which is not possible with Math.abs.
    // The current formula naturally caps at 100 when error is 0.
    expect(calculateAccuracy(100, 100)).toBe(100.0)
  })
})