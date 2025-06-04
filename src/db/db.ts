/**
 * @description
 * This file initializes and configures the Drizzle ORM client for Supabase (PostgreSQL).
 * It sets up the database connection using the connection string from environment
 * variables and exports the Drizzle instance (`db`) along with the schema.
 *
 * @dependencies
 * - drizzle-orm/postgres-js: The Drizzle ORM adapter for node-postgres.
 * - postgres: The PostgreSQL client for Node.js.
 * - @/db/schema: The application's database schema definitions.
 *
 * @notes
 * - Ensures SUPABASE_DB_URL environment variable is set.
 * - The exported `db` object is used for all database interactions.
 */

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@/db/schema" // Imports all exports from schema/index.ts

// Retrieve the database connection string from environment variables.
const connectionString = process.env.SUPABASE_DB_URL

// Ensure the connection string is available; otherwise, throw an error.
if (!connectionString) {
  throw new Error(
    "SUPABASE_DB_URL is not set. Please check your environment variables."
  )
}

// Initialize the PostgreSQL client.
// Options for the client can be configured here if needed.
// For example, `max` for connection pool size, `idle_timeout`, etc.
const client = postgres(connectionString, { prepare: false })

// Initialize Drizzle ORM with the client and the combined schema.
// The schema object should contain all table definitions.
export const db = drizzle(client, { schema })