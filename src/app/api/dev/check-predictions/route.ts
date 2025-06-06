import { NextResponse } from "next/server"
import { db } from "@/db/db"
import { predictionsTable } from "@/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "This endpoint is only available in development." },
      { status: 403 }
    )
  }

  try {
    console.log("Checking predictions in database...")

    // Get the most recent 5 predictions
    const recentPredictions = await db
      .select()
      .from(predictionsTable)
      .orderBy(desc(predictionsTable.created_at))
      .limit(5)

    return NextResponse.json({
      message: "Recent predictions retrieved successfully",
      count: recentPredictions.length,
      predictions: recentPredictions
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error checking predictions:", error)
    return NextResponse.json({
      message: `Error checking predictions: ${error.message}`,
    }, { status: 500 })
  }
} 