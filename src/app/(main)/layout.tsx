/**
 * @description
 * This server component defines the main layout for the primary content area
 * of the AlloraLens application (routes grouped under `(main)`).
 * It includes the `PageHeader` component, providing a consistent header
 * across these pages.
 *
 * Key features:
 * - Wraps content with the `PageHeader`.
 * - Ensures a consistent structural layout for the main application views.
 *
 * @dependencies
 * - "@/components/shared/page-header": The application's main header component.
 * - "react": For `ReactNode` type.
 *
 * @notes
 * - This layout applies to all routes within the `(main)` route group.
 * - The `max-w-7xl mx-auto` class on the main content area ensures content is
 *   centered and has a maximum width, aligning with common design patterns.
 * - `px-4 sm:px-6 lg:px-8` provides responsive padding.
 * - `py-8` gives vertical spacing for the content area.
 */
"use server"

import * as React from "react"
import { PageHeader } from "@/components/shared/page-header"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-allora-bg-start-light to-allora-bg-end-light dark:from-allora-bg-start-dark dark:to-allora-bg-end-dark">
      <PageHeader />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}