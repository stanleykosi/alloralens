import { NextResponse } from "next/server"
import { fetchBtcPriceAtTimestampAction } from "@/actions/coingecko-actions"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "This endpoint is only available in development." },
      { status: 403 }
    )
  }

  try {
    // Create a timestamp for exactly 1 hour ago. This is a guaranteed valid, historical date.
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000)
    console.log(`Testing CoinGecko API with a valid past date: ${oneHourAgo.toISOString()}`)

    const result = await fetchBtcPriceAtTimestampAction(oneHourAgo)

    if (result.isSuccess) {
      console.log("CoinGecko test successful. API responded with:", result.data)
      return NextResponse.json(
        {
          message: "CoinGecko API test successful!",
          testDate: oneHourAgo.toISOString(),
          success: result.isSuccess,
          data: result.data,
        },
        { status: 200 }
      )
    } else {
      console.error("CoinGecko test failed:", result.message)
      return NextResponse.json(
        {
          message: "CoinGecko API test failed.",
          testDate: oneHourAgo.toISOString(),
          success: result.isSuccess,
          error: result.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error(`CoinGecko test: An unexpected error occurred: ${error.message}`, error)
    return NextResponse.json(
      {
        message: `An unexpected error occurred during the test: ${error.message}`,
      },
      { status: 500 }
    )
  }
} 