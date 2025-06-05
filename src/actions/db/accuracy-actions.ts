/**
 * @description
 * This file contains server actions related to fetching and calculating
 * accuracy metrics from the `predictions` table. These metrics are used
 * to display Key Performance Indicators (KPIs) and trend charts in the UI.
 *
 * @dependencies
 * - "next/server": For the "use server" directive.
 * - "drizzle-orm": For SQL query building functions like `avg`, `sql`, `and`, `gte`, `lt`, `isNotNull`.
 * - "@/db/db": The Drizzle ORM database instance.
 * - "@/db/schema": Database schema definitions, specifically `predictionsTable`.
 * - "@/types": For the `ActionState` type.
 *
 * @module accuracy-actions
 */
"use server"

import { db } from "@/db/db"
import { predictionsTable } from "@/db/schema"
import type { ActionState } from "@/types"
import { and, gte, lt, isNotNull, avg, sql, desc } from "drizzle-orm"

/**
 * @interface KpiMetrics
 * @description Defines the structure for Key Performance Indicators related to accuracy.
 * @property {number | null} daily - Average accuracy over the last 24 hours. Null if no data.
 * @property {number | null} weekly - Average accuracy over the last 7 days. Null if no data.
 * @property {number | null} monthly - Average accuracy over the last 30 days. Null if no data.
 */
export interface KpiMetrics {
  daily: number | null
  weekly: number | null
  monthly: number | null
}

/**
 * @interface TrendPoint
 * @description Defines a single data point for a trend chart.
 * @property {string} x - The x-coordinate value (e.g., formatted date string).
 * @property {number} y - The y-coordinate value (e.g., average accuracy).
 */
export interface TrendPoint {
  x: string
  y: number
}

/**
 * @interface AccuracyChartData
 * @description Defines the data structure for a Nivo chart series.
 * @property {string} id - The identifier for the data series (e.g., "Daily Accuracy").
 * @property {TrendPoint[]} data - An array of TrendPoint objects for the series.
 */
export interface AccuracyChartData {
  id: string
  data: TrendPoint[]
}

/**
 * @interface AccuracyMetricsData
 * @description Defines the overall data structure returned by `getAccuracyMetricsAction`.
 * @property {KpiMetrics} kpiMetrics - The calculated KPI metrics.
 * @property {AccuracyChartData[]} trendData - Data formatted for Nivo line charts.
 */
export interface AccuracyMetricsData {
  kpiMetrics: KpiMetrics
  trendData: AccuracyChartData[]
}

/**
 * @function getAccuracyMetricsAction
 * @description Fetches and calculates various accuracy metrics:
 *   - Rolling average accuracy for the last 24 hours, 7 days, and 30 days.
 *   - Daily average accuracy trend for the last 30 days.
 * @returns {Promise<ActionState<AccuracyMetricsData>>} An ActionState object containing
 *   the `AccuracyMetricsData` on success, or an error message on failure.
 */
export async function getAccuracyMetricsAction(): Promise<
  ActionState<AccuracyMetricsData>
> {
  try {
    const now = new Date()

    // Define date ranges for KPI calculations
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Helper function to fetch average accuracy for a given period
    const fetchAverageAccuracy = async (
      startDate: Date,
      endDate: Date // Exclusive end date
    ): Promise<number | null> => {
      const result = await db
        .select({
          // Drizzle's avg function returns a string for numeric types, or null
          averageAccuracy: avg(predictionsTable.accuracy),
        })
        .from(predictionsTable)
        .where(
          and(
            isNotNull(predictionsTable.accuracy), // Only consider records where accuracy has been calculated
            gte(predictionsTable.created_at, startDate),
            lt(predictionsTable.created_at, endDate)
          )
        )
        .execute() // Use execute() for custom selections not directly mapping to findFirst/findMany

      const average = result[0]?.averageAccuracy
      // parseFloat(null) results in NaN, so check if average is a valid string first
      if (average && !isNaN(parseFloat(average))) {
        return parseFloat(parseFloat(average).toFixed(2)) // Round to 2 decimal places
      }
      return null
    }

    // Fetch KPI metrics
    const dailyAccuracy = await fetchAverageAccuracy(twentyFourHoursAgo, now)
    const weeklyAccuracy = await fetchAverageAccuracy(sevenDaysAgo, now)
    const monthlyAccuracy = await fetchAverageAccuracy(thirtyDaysAgo, now)

    const kpiMetrics: KpiMetrics = {
      daily: dailyAccuracy,
      weekly: weeklyAccuracy,
      monthly: monthlyAccuracy,
    }

    // Fetch daily trend data for the last 30 days
    // Group by day and calculate average accuracy for each day
    const dailyTrendResult = await db
      .select({
        // Truncate created_at to the day, ensure it's treated as string for consistent key
        day: sql<string>`DATE_TRUNC('day', ${predictionsTable.created_at})`.as(
          "day_bucket"
        ),
        averageAccuracy: avg(predictionsTable.accuracy),
      })
      .from(predictionsTable)
      .where(
        and(
          isNotNull(predictionsTable.accuracy),
          gte(predictionsTable.created_at, thirtyDaysAgo),
          lt(predictionsTable.created_at, now)
        )
      )
      .groupBy(sql`day_bucket`) // Group by the truncated day
      .orderBy(sql`day_bucket ASC`) // Order by day ascending for the chart
      .execute()

    const trendDataPoints: TrendPoint[] = dailyTrendResult
      .map((row) => {
        // Ensure averageAccuracy is valid and parse it
        const avgAcc =
          row.averageAccuracy && !isNaN(parseFloat(row.averageAccuracy))
            ? parseFloat(parseFloat(row.averageAccuracy).toFixed(2))
            : null

        if (row.day && avgAcc !== null) {
          return {
            // Format date string for X-axis, e.g., "Jan 15"
            x: new Date(row.day).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            y: avgAcc,
          }
        }
        return null
      })
      .filter((point): point is TrendPoint => point !== null) // Remove any null entries

    const trendChartData: AccuracyChartData[] = [
      {
        id: "Daily Accuracy", // Nivo series ID
        data: trendDataPoints,
      },
    ]

    return {
      isSuccess: true,
      message: "Accuracy metrics fetched successfully.",
      data: {
        kpiMetrics,
        trendData: trendChartData,
      },
    }
  } catch (error: any) {
    console.error("Error in getAccuracyMetricsAction:", error)
    return {
      isSuccess: false,
      message: `Failed to fetch accuracy metrics: ${error.message}`,
    }
  }
}