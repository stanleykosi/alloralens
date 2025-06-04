import "dotenv/config"
import { db } from "./db"
import { sql } from "drizzle-orm"

async function testConnection() {
  try {
    // Try to execute a simple query
    const result = await db.execute(sql`SELECT 1 as test`)
    console.log("✅ Database connection successful!")
    console.log("Test query result:", result)
  } catch (error) {
    console.error("❌ Database connection failed!")
    console.error("Error:", error)
  } finally {
    // Exit the process
    process.exit()
  }
}

testConnection() 