/**
 * @description
 * This server component renders a skeleton loader for the accuracy charts section.
 * It provides a placeholder UI that mimics the structure of KPI cards and a main chart
 * area while the actual accuracy data and charts are being fetched and prepared.
 * This is used as a fallback in Suspense boundaries.
 *
 * Key features:
 * - Mimics the layout of accuracy KPIs and a trend chart.
 * - Uses Tailwind CSS for styling, including `animate-pulse` for the skeleton effect.
 * - Leverages Shadcn `Card` components for consistent card structure.
 *
 * @dependencies
 * - "@/components/ui/card": For `Card`, `CardHeader`, `CardTitle`, `CardContent`.
 * - "react": For component creation.
 *
 * @notes
 * - This component is intended to be used as a `fallback` prop in a `React.Suspense` boundary.
 * - It's a server component as it doesn't require any client-side interactivity.
 */
"use server"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AccuracyChartsSkeletonProps {
  className?: string
}

export async function AccuracyChartsSkeleton({
  className,
}: AccuracyChartsSkeletonProps) {
  return (
    <Card
      className={`
        bg-allora-card-light dark:bg-allora-card-dark 
        border-allora-border-light dark:border-allora-border-dark 
        shadow-lg rounded-xl p-6 animate-pulse ${className}
      `}
    >
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-2xl font-semibold text-allora-foreground-light dark:text-allora-foreground-dark">
          Accuracy Overview
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 space-y-8">
        {/* Placeholder for KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <Card
              key={index}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
            >
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-md w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-md w-3/4"></div>
            </Card>
          ))}
        </div>

        {/* Placeholder for Main Trend Chart */}
        <div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-md w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-lg w-full"></div>
        </div>
      </CardContent>
    </Card>
  )
}