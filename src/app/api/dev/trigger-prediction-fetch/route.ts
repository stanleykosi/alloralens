import { NextResponse } from "next/server"
import { fetchAndStoreAlloraPredictionsAction } from "@/actions/allora-actions"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "This endpoint is only available in development." },
      { status: 403 }
    )
  }

  try {
    console.log("Manual prediction fetch: Job started.")
    const result = await fetchAndStoreAlloraPredictionsAction()

    if (result.isSuccess) {
      console.log("Manual prediction fetch: Job completed successfully.")
      return NextResponse.json(
        { message: "Allora predictions fetched and stored successfully." },
        { status: 200 }
      )
    } else {
      console.error(
        `Manual prediction fetch: Action failed. Message: ${result.message}`
      )
      return NextResponse.json(
        {
          message: `Failed to fetch Allora predictions: ${result.message}`,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error(
      `Manual prediction fetch: An unexpected error occurred: ${error.message}`,
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