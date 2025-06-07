/**
 * @description
 * This server component serves as the main dashboard page for the AlloraLens application.
 * It displays Bitcoin price predictions and accuracy metrics, leveraging React Suspense
 * for asynchronous data loading and progressive rendering of content sections.
 *
 * Key features:
 * - Orchestrates the display of major data sections: Predictions and Accuracy.
 * - Uses `<Suspense>` boundaries with corresponding skeleton components for each section
 *   to provide a smooth loading experience.
 * - Employs a "Fetcher Component" pattern (`PredictionsSection`, `AccuracySection`)
 *   to encapsulate data fetching logic for different parts of the page.
 * - `PredictionsSection`: Renders the `PredictionsDisplay` component, which handles its own data fetching.
 * - `AccuracySection`: Fetches accuracy metrics using `getAccuracyMetricsAction` and passes
 *   the data to the `AccuracyCharts` client component. Includes basic error display.
 * - Designed to fit within the main application layout provided by `(main)/layout.tsx`.
 *
 * @dependencies
 * - "react": For `Suspense`.
 * - "@/app/(main)/_components/predictions-display": Component to display latest predictions.
 * - "@/app/(main)/_components/predictions-display-skeleton": Skeleton for the predictions display.
 * - "@/app/(main)/_components/accuracy-charts": Client component to display accuracy charts and KPIs.
 * - "@/app/(main)/_components/accuracy-charts-skeleton": Skeleton for the accuracy charts section.
 * - "@/actions/db/accuracy-actions": Server action `getAccuracyMetricsAction` and its return type.
 * - "lucide-react": For icons like `AlertTriangle`.
 *
 * @notes
 * - This page is intended to be the primary view for users interacting with AlloraLens.
 * - The `space-y-8` class provides vertical spacing between the main content sections.
 * - Error handling for `getAccuracyMetricsAction` is done within `AccuracySection`.
 *   `PredictionsDisplay` is expected to handle its internal data fetching errors.
 */
"use server"

import { Suspense } from "react"
import { getAccuracyMetricsAction } from "@/actions/db/accuracy-actions"
import AccuracyCharts from "@/app/(main)/_components/accuracy-charts"
import { AccuracyChartsSkeleton } from "@/app/(main)/_components/accuracy-charts-skeleton"
import { PredictionsDisplay } from "@/app/(main)/_components/predictions-display"
import { PredictionsDisplaySkeleton } from "@/app/(main)/_components/predictions-display-skeleton"
import { AlertTriangle } from "lucide-react"

/**
 * Server component to fetch and render the predictions section.
 * It directly uses PredictionsDisplay, which handles its own data fetching.
 */
async function PredictionsSection() {
  return <PredictionsDisplay />
}

/**
 * Server component to fetch accuracy data and render the AccuracyCharts section.
 * Handles fetching data from `getAccuracyMetricsAction` and passes it to the
 * client component `AccuracyCharts`. Includes error handling for the fetch operation.
 */
async function AccuracySection() {
  const result = await getAccuracyMetricsAction()

  if (!result.isSuccess) {
    // Render a user-friendly error message if fetching accuracy data fails.
    // The AccuracyCharts component also handles null metrics gracefully for UI consistency.
    return (
      <div
        className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md shadow-md"
        role="alert"
      >
        <div className="flex">
          <div className="py-1">
            <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400 mr-3 shrink-0" />
          </div>
          <div>
            <p className="font-bold">Error Fetching Accuracy Data</p>
            <p className="text-sm">{result.message}</p>
          </div>
        </div>
      </div>
    )
  }
  // Pass the fetched data to the client component for rendering charts.
  return <AccuracyCharts metrics={result.data} />
}

/**
 * The main page component for the `/` route within the (main) group.
 * It assembles the different sections of the dashboard using Suspense for
 * individual loading states.
 */
export default async function MainPage() {
  return (
    <div className="space-y-8">
      {/* Main Content Container */}
      <div className="bg-allora-card-light dark:bg-allora-card-dark backdrop-blur-lg border border-allora-border-light dark:border-allora-border-dark rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Predictions Section */}
        <Suspense fallback={<PredictionsDisplaySkeleton />}>
          <PredictionsSection />
        </Suspense>

        {/* Accuracy Metrics Section */}
        <Suspense fallback={<AccuracyChartsSkeleton />}>
          <AccuracySection />
        </Suspense>
      </div>
    </div>
  )
}