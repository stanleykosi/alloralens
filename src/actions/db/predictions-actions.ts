/**
 * @description
 * This file contains server actions for interacting with the `predictions` table
 * in the Supabase database. These actions are responsible for creating, reading,
 * and updating prediction records, forming a core part of the data management
 * strategy for AlloraLens.
 *
 * @dependencies
 * - "next/server": For the "use server" directive.
 * - "drizzle-orm": Specifically `eq`, `and`, `lt`, `isNull`, `desc` for query building.
 * - "@/db/db": The Drizzle ORM database instance.
 * - "@/db/schema": Database schema definitions, including `predictionsTable`,
 *   `InsertPrediction`, and `SelectPrediction`.
 * - "@/types": For the `ActionState` type.
 *
 * @module predictions-actions
 */
"use server"

import { db } from "@/db/db"
import {
  predictionsTable,
  type InsertPrediction,
  type SelectPrediction,
  predictionTypeEnum,
} from "@/db/schema"
import type { ActionState } from "@/types"
import { and, desc, eq, isNull, lt } from "drizzle-orm"

/**
 * @function createPredictionAction
 * @description Inserts a new prediction record into the database.
 * @param {InsertPrediction} data - The prediction data to be inserted.
 *   This should conform to the `InsertPrediction` type, which is inferred
 *   from the `predictionsTable` schema.
 * @returns {Promise<ActionState<SelectPrediction>>} An ActionState object containing
 *   the newly created prediction record on success, or an error message on failure.
 *
 * @example
 * const newPredictionData = {
 *   prediction_type: '5-min',
 *   predicted_value: '70000.50',
 *   prediction_end_timestamp: new Date(Date.now() + 5 * 60 * 1000),
 *   // ... other fields
 * };
 * const result = await createPredictionAction(newPredictionData);
 * if (result.isSuccess) {
 *   console.log("Prediction created:", result.data);
 * } else {
 *   console.error("Failed to create prediction:", result.message);
 * }
 */
export async function createPredictionAction(
  data: InsertPrediction
): Promise<ActionState<SelectPrediction>> {
  try {
    // Ensure prediction_end_timestamp is a Date object before insertion if it's not already.
    // Drizzle with pg driver expects Date objects for timestamp columns with mode: "date".
    if (typeof data.prediction_end_timestamp === 'string') {
      data.prediction_end_timestamp = new Date(data.prediction_end_timestamp);
    }

    const [newPrediction] = await db
      .insert(predictionsTable)
      .values(data)
      .returning()

    if (!newPrediction) {
      return {
        isSuccess: false,
        message: "Failed to create prediction: No record returned.",
      }
    }

    return {
      isSuccess: true,
      message: "Prediction created successfully.",
      data: newPrediction,
    }
  } catch (error) {
    console.error("Error creating prediction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred while creating the prediction.",
    }
  }
}

/**
 * @interface LatestPredictionsData
 * @description Defines the structure for returning the latest 5-minute and 8-hour predictions.
 * @property {SelectPrediction | null} fiveMin - The latest 5-minute prediction, or null if none found.
 * @property {SelectPrediction | null} eightHour - The latest 8-hour prediction, or null if none found.
 */
export interface LatestPredictionsData {
  fiveMin: SelectPrediction | null
  eightHour: SelectPrediction | null
}

/**
 * @function getLatestPredictionsAction
 * @description Fetches the single most recent prediction for both '5-min' and '8-hour' types.
 * @returns {Promise<ActionState<LatestPredictionsData>>} An ActionState object
 *   containing the latest 5-minute and 8-hour predictions on success, or an
 *   error message on failure.
 *
 * @example
 * const result = await getLatestPredictionsAction();
 * if (result.isSuccess) {
 *   console.log("Latest 5-min prediction:", result.data.fiveMin);
 *   console.log("Latest 8-hour prediction:", result.data.eightHour);
 * } else {
 *   console.error("Failed to fetch latest predictions:", result.message);
 * }
 */
export async function getLatestPredictionsAction(): Promise<
  ActionState<LatestPredictionsData>
> {
  try {
    const fiveMinPrediction = await db.query.predictionsTable.findFirst({
      where: eq(predictionsTable.prediction_type, predictionTypeEnum.enumValues[0]), // '5-min'
      orderBy: [desc(predictionsTable.created_at)],
    })

    const eightHourPrediction = await db.query.predictionsTable.findFirst({
      where: eq(predictionsTable.prediction_type, predictionTypeEnum.enumValues[1]), // '8-hour'
      orderBy: [desc(predictionsTable.created_at)],
    })

    return {
      isSuccess: true,
      message: "Latest predictions fetched successfully.",
      data: {
        fiveMin: fiveMinPrediction || null,
        eightHour: eightHourPrediction || null,
      },
    }
  } catch (error) {
    console.error("Error fetching latest predictions:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred while fetching latest predictions.",
    }
  }
}

/**
 * @function getMaturePredictionsForUpdateAction
 * @description Fetches predictions that have passed their `prediction_end_timestamp`
 *   but have not yet had their accuracy calculated (i.e., `accuracy` is NULL).
 *   These are "mature" predictions ready for accuracy assessment.
 * @returns {Promise<ActionState<SelectPrediction[]>>} An ActionState object
 *   containing an array of mature prediction records on success, or an
 *   error message on failure.
 *
 * @example
 * const result = await getMaturePredictionsForUpdateAction();
 * if (result.isSuccess) {
 *   if (result.data.length > 0) {
 *     console.log("Mature predictions to update:", result.data);
 *     // Proceed to fetch actual prices and calculate accuracy for these predictions.
 *   } else {
 *     console.log("No mature predictions to update at this time.");
 *   }
 * } else {
 *   console.error("Failed to fetch mature predictions:", result.message);
 * }
 */
export async function getMaturePredictionsForUpdateAction(): Promise<
  ActionState<SelectPrediction[]>
> {
  try {
    const maturePredictions = await db
      .select()
      .from(predictionsTable)
      .where(
        and(
          lt(predictionsTable.prediction_end_timestamp, new Date()),
          isNull(predictionsTable.accuracy)
        )
      )

    return {
      isSuccess: true,
      message: "Mature predictions fetched successfully.",
      data: maturePredictions,
    }
  } catch (error) {
    console.error("Error fetching mature predictions:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred while fetching mature predictions.",
    }
  }
}

/**
 * @interface UpdatePredictionAccuracyData
 * @description Defines the data structure for updating a prediction's accuracy.
 * @property {number} actual_price - The actual market price at the prediction's end time.
 * @property {number} accuracy - The calculated accuracy percentage.
 */
export interface UpdatePredictionAccuracyData {
  actual_price: number
  accuracy: number
}

/**
 * @function updatePredictionWithAccuracyAction
 * @description Updates a specific prediction record with its actual price and
 *   calculated accuracy.
 * @param {string} id - The UUID of the prediction record to update.
 * @param {UpdatePredictionAccuracyData} data - An object containing the
 *   `actual_price` (as a number) and `accuracy` (as a number).
 *   Drizzle will handle conversion to `numeric` type for the database.
 * @returns {Promise<ActionState<SelectPrediction>>} An ActionState object
 *   containing the updated prediction record on success, or an error message on failure.
 *
 * @example
 * const predictionIdToUpdate = "some-uuid-string";
 * const accuracyData = { actual_price: 70500.00, accuracy: 99.50 };
 * const result = await updatePredictionWithAccuracyAction(predictionIdToUpdate, accuracyData);
 * if (result.isSuccess) {
 *   console.log("Prediction updated with accuracy:", result.data);
 * } else {
 *   console.error("Failed to update prediction accuracy:", result.message);
 * }
 */
export async function updatePredictionWithAccuracyAction(
  id: string,
  data: UpdatePredictionAccuracyData
): Promise<ActionState<SelectPrediction>> {
  try {
    // Convert numbers to strings as Drizzle expects strings for numeric types
    // if not using `numeric` type directly in the `set` object with appropriate precision.
    // However, Drizzle's default behavior for `numeric` columns with `pg` driver
    // usually handles JS `number` to string conversion automatically.
    // For explicit control, especially if issues arise:
    const updateData = {
      actual_price: String(data.actual_price),
      accuracy: String(data.accuracy),
      updated_at: new Date(), // Explicitly set updated_at
    };


    const [updatedPrediction] = await db
      .update(predictionsTable)
      .set(updateData)
      .where(eq(predictionsTable.id, id))
      .returning()

    if (!updatedPrediction) {
      return {
        isSuccess: false,
        message: `Failed to update prediction with ID ${id}: Record not found or no change made.`,
      }
    }

    return {
      isSuccess: true,
      message: "Prediction updated with accuracy successfully.",
      data: updatedPrediction,
    }
  } catch (error)
 {
    console.error(`Error updating prediction with ID ${id}:`, error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred while updating prediction with ID ${id}.`,
    }
  }
}