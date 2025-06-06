/**
 * @description
 * This server component is responsible for fetching the latest Bitcoin price predictions
 * (both 5-minute and 8-hour) from the database and displaying them using
 * the `PredictionCard` client component. It acts as a data fetcher and orchestrator
 * for the main prediction display section of the homepage.
 *
 * Key features:
 * - Fetches data using `getLatestPredictionsAction`.
 * - Handles successful data retrieval and potential errors during fetching.
 * - Renders two `PredictionCard` components, one for each prediction type.
 * - Arranges prediction cards in a responsive grid.
 *
 * @dependencies
 * - "@/actions/db/predictions-actions": For `getLatestPredictionsAction` to fetch data.
 * - "@/app/(main)/_components/prediction-card": The client component for rendering individual predictions.
 * - "lucide-react": For the AlertTriangle icon used in error messages.
 *
 * @notes
 * - This component is designed to be used within a React Suspense boundary on the page
 *   to handle loading states gracefully.
 * - If `getLatestPredictionsAction` fails, an error message is displayed.
 * - If the action succeeds but a specific prediction type (5-min or 8-hour) is not found,
 *   the `PredictionCard` component itself handles rendering a "No data available" state.
 */
"use server"

import { getLatestPredictionsAction } from "@/actions/db/predictions-actions"
import PredictionCard from "@/app/(main)/_components/prediction-card"
import { AlertTriangle } from "lucide-react"

export async function PredictionsDisplay() {
  console.log("PredictionsDisplay: Starting to fetch predictions...")
  const result = await getLatestPredictionsAction()
  console.log("PredictionsDisplay: Fetch result:", JSON.stringify(result, null, 2))

  if (!result.isSuccess) {
    // Handle the case where the action itself failed (e.g., database connection error)
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
        <div className="flex">
          <div className="py-1">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
          </div>
          <div>
            <p className="font-bold">Error Fetching Predictions</p>
            <p className="text-sm">{result.message}</p>
          </div>
        </div>
      </div>
    )
  }

  const { fiveMin, eightHour } = result.data

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      <PredictionCard
        title="5-Minute Prediction"
        prediction={fiveMin}
        className="w-full"
      />
      <PredictionCard
        title="8-Hour Prediction"
        prediction={eightHour}
        className="w-full"
      />
    </div>
  )
}