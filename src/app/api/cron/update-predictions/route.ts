/**
 * @description
 * API Route Handler for a QStash Task to periodically fetch and store
 * Bitcoin price predictions from the Allora Network.
 *
 * This endpoint is designed to be triggered by a scheduled QStash task.
 * It uses the `@upstash/qstash/next` wrapper to verify the request signature
 * before proceeding to call the `fetchAndStoreAlloraPredictionsAction`.
 *
 * @method POST
 * @path /api/cron/update-predictions
 *
 * @security
 * - The request is verified by QStash using signature verification.
 * - `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` must be set.
 *
 * @dependencies
 * - "next/server": For `NextResponse`.
 * - "@upstash/qstash/nextjs": For `verifySignature`.
 * - "@/actions/allora-actions": For `fetchAndStoreAlloraPredictionsAction`.
 *
 * @returns
 * - 200 OK: If predictions are fetched and stored successfully.
 * - 401 Unauthorized: If the QStash signature verification fails.
 * - 500 Internal Server Error: If `fetchAndStoreAlloraPredictionsAction` fails.
 */

import { NextResponse } from "next/server"
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs"
import { fetchAndStoreAlloraPredictionsAction } from "@/actions/allora-actions"

async function handler() {
  // Call the server action to fetch and store predictions
  try {
    console.log("Update predictions cron: Job started.")
    const result = await fetchAndStoreAlloraPredictionsAction()

    if (result.isSuccess) {
      console.log("Update predictions cron: Job completed successfully.")
      return NextResponse.json(
        { message: "Allora predictions updated successfully." },
        { status: 200 }
      )
    } else {
      console.error(
        `Update predictions cron: Action failed. Message: ${result.message}`
      )
      return NextResponse.json(
        {
          message:
            `Failed to update Allora predictions: ${result.message}`,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error(
      `Update predictions cron: An unexpected error occurred: ${error.message}`,
      error
    )
    return NextResponse.json(
      {
        message: `An unexpected error occurred: ${error.message}`,
      },
      { status: 500 }
    )
  }
}

export const POST = verifySignatureAppRouter(handler)

// Note on Vercel Cron Job configuration:
// This route should be configured in `vercel.json` or through the Vercel dashboard
// to run on a schedule (e.g., every 5 minutes).
// Example `vercel.json` cron configuration:
// {
//   "crons": [
//     {
//       "path": "/api/cron/update-predictions",
//       "schedule": "*/5 * * * *" // Every 5 minutes
//     }
//   ]
// }
// The CRON_SECRET environment variable must be set in Vercel project settings.