/**
 * @description
 * This file defines the Drizzle ORM schema for the 'predictions' table,
 * including an enum for prediction types and necessary indexes.
 * It stores data related to Bitcoin price predictions sourced from the Allora Network
 * and their subsequent accuracy analysis against actual market prices.
 */

import {
  pgTable,
  uuid,
  pgEnum,
  numeric,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core"
import { relations, desc } from "drizzle-orm"

/**
 * @enum predictionTypeEnum
 * @description
 * Defines the possible types/topics for predictions.
 * - '5-min': A prediction for the Bitcoin price in the next 5 minutes.
 * - '8-hour': A prediction for the Bitcoin price in the next 8 hours.
 */
export const predictionTypeEnum = pgEnum("prediction_type", ["5-min", "8-hour"])

/**
 * @table predictionsTable
 * @description
 * Stores prediction data fetched from the Allora Network and related accuracy metrics.
 *
 * @property {string} id - Unique identifier for the prediction record (UUID).
 * @property {'5-min' | '8-hour'} prediction_type - The type of prediction.
 * @property {string} predicted_value - The network's combined prediction value (numeric string).
 * @property {string | null} confidence_interval_upper - The upper bound of the confidence interval (numeric string).
 * @property {string | null} confidence_interval_lower - The lower bound of the confidence interval (numeric string).
 * @property {Date} prediction_end_timestamp - The timestamp for which the prediction is valid.
 * @property {string | null} actual_price - The actual price at prediction_end_timestamp, filled in later (numeric string).
 * @property {string | null} accuracy - The calculated accuracy percentage (numeric string, precision 5, scale 2).
 * @property {object | null} raw_inference_data - The full raw JSON response from Allora for detailed analysis.
 * @property {Date} created_at - Timestamp when the record was created.
 * @property {Date} updated_at - Timestamp when the record was last updated.
 */
export const predictionsTable = pgTable(
  "predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prediction_type: predictionTypeEnum("prediction_type").notNull(),
    predicted_value: numeric("predicted_value").notNull(), // Stored as string, converted by Drizzle
    confidence_interval_upper: numeric("confidence_interval_upper"),
    confidence_interval_lower: numeric("confidence_interval_lower"),
    prediction_end_timestamp: timestamp("prediction_end_timestamp", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    actual_price: numeric("actual_price"),
    accuracy: numeric("accuracy", { precision: 5, scale: 2 }),
    raw_inference_data: jsonb("raw_inference_data"),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      // Index to quickly fetch the latest predictions of each type.
      predictionTypeCreatedAtIdx: index("prediction_type_created_at_idx").on(
        table.prediction_type,
        desc(table.created_at)
      ),
      // Index to find mature predictions needing accuracy calculation.
      predictionEndTimestampIdx: index("prediction_end_timestamp_idx").on(
        table.prediction_end_timestamp
      ),
    }
  }
)

// Relations for predictionsTable (if any, define here)
// Example:
// export const predictionsRelations = relations(predictionsTable, ({ one, many }) => ({
//   // Define relations here
// }));

/**
 * @type InsertPrediction
 * @description Defines the shape of data for inserting a new prediction.
 */
export type InsertPrediction = typeof predictionsTable.$inferInsert

/**
 * @type SelectPrediction
 * @description Defines the shape of data for a selected prediction record.
 */
export type SelectPrediction = typeof predictionsTable.$inferSelect