/**
 * @description
 * API Route Handler for a Vercel Cron Job to periodically fetch and store
 * Bitcoin price predictions from the Allora Network.
 *
 * This endpoint is designed to be triggered by a scheduled cron job.
 * It ensures that the request is authorized using a secret token
 * before proceeding to call the `fetchAndStoreAlloraPredictionsAction`.
 *
 * @method GET
 * @path /api/cron/update-predictions
 *
 * @security
 * - Expects an `Authorization` header with a Bearer token.
 * - The token is compared against `process.env.CRON_SECRET`.
 *
 * @dependencies
 * - "next/server": For `NextResponse` and `NextRequest`.
 * - "@/actions/allora-actions": For `fetchAndStoreAlloraPredictionsAction`.
 *
 * @returns
 * - 200 OK: If predictions are fetched and stored successfully.
 * - 401 Unauthorized: If the `Authorization` header is missing or malformed.
 * - 403 Forbidden: If the provided cron secret is invalid.
 * - 500 Internal Server Error: If `CRON_SECRET` is not configured on the server,
 *   or if `fetchAndStoreAlloraPredictionsAction` fails.
 */

import { NextResponse, type NextRequest } from "next/server"
import { fetchAndStoreAlloraPredictionsAction } from "@/actions/allora-actions"

export async function GET(request: NextRequest) {
  // 1. Authenticate the request
  const authHeader = request.headers.get("authorization")
  if (!authHeader) {
    console.warn(
      "Update predictions cron: Missing Authorization header."
    )
    return NextResponse.json(
      { message: "Authorization header is required." },
      { status: 401 }
    )
  }

  const token = authHeader.replace("Bearer ", "")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error(
      "Update predictions cron: CRON_SECRET is not set in environment variables."
    )
    return NextResponse.json(
      { message: "Server configuration error: CRON_SECRET is missing." },
      { status: 500 }
    )
  }

  if (token !== cronSecret) {
    console.warn("Update predictions cron: Invalid cron secret.")
    return NextResponse.json(
      { message: "Invalid cron secret." },
      { status: 403 }
    )
  }

  // 2. Call the server action to fetch and store predictions
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