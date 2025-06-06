import { NextResponse } from "next/server"
import { db } from "@/db/db"
import { predictionsTable } from "@/db/schema"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "This endpoint is only available in development." },
      { status: 403 }
    )
  }

  try {
    console.log("Clearing all predictions from database...")

    await db.delete(predictionsTable)

    return NextResponse.json({
      message: "All predictions cleared successfully"
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error clearing predictions:", error)
    return NextResponse.json({
      message: `Error clearing predictions: ${error.message}`,
    }, { status: 500 })
  }
} 