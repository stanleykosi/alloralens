/**
 * @description
 * This file serves as the entry point for all Drizzle ORM schema definitions
 * in the application. It re-exports all schemas from their respective files
 * within this directory. This organization helps in maintaining a clean
 * import structure for database schema components across the project.
 */

export * from "./predictions-schema"
// Add other schema exports here as they are created, e.g.:
// export * from "./users-schema";