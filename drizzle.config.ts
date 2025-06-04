/**
 * @description
 * This file configures Drizzle Kit, the CLI companion for Drizzle ORM.
 * It specifies the location of the database schema, the output directory
 * for migrations, the SQL dialect, and database connection credentials.
 *
 * @notes
 * - This configuration is used by Drizzle Kit commands like `generate` and `migrate`.
 * - Ensure `SUPABASE_DB_URL` environment variable is correctly set when running Drizzle Kit.
 * - Per project rules, migrations are not to be generated or run by the AI,
 *   but this file is necessary for Drizzle Kit's `studio` and other potential uses.
 */

import { defineConfig } from "drizzle-kit"

// Retrieve the database connection string from environment variables.
const connectionString = process.env.SUPABASE_DB_URL

// Ensure the connection string is available; otherwise, throw an error.
if (!connectionString) {
  throw new Error(
    "SUPABASE_DB_URL is not set for Drizzle Kit. Please check your environment variables."
  )
}

export default defineConfig({
  schema: "./src/db/schema/index.ts", // Path to your main schema file
  out: "./src/db/migrations", // Output directory for migrations
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  verbose: true, // Enable verbose output
  strict: true, // Enable strict mode
})