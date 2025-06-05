/**
 * @description
 * This server component renders a skeleton loader for a `PredictionCard`.
 * It provides a placeholder UI that mimics the structure of a prediction card
 * while its data is being fetched. This is used as a fallback in Suspense boundaries
 * to improve perceived performance and user experience.
 *
 * Key features:
 * - Mimics the layout of a `PredictionCard`.
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

interface PredictionCardSkeletonProps {
  title?: string // Optional title to display on the skeleton
  className?: string
}

export async function PredictionCardSkeleton({
  title = "Loading Prediction...",
  className,
}: PredictionCardSkeletonProps) {
  return (
    <Card
      className={`
        bg-allora-card-light dark:bg-allora-card-dark 
        border-allora-border-light dark:border-allora-border-dark 
        shadow-lg rounded-xl p-6 animate-pulse ${className}
      `}
    >
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl font-semibold text-allora-foreground-light dark:text-allora-foreground-dark">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {/* Placeholder for Predicted Value */}
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-md w-3/4"></div>

        {/* Placeholder for Confidence Interval */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-md w-1/2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-md w-5/6"></div>
        </div>

        {/* Placeholder for Timestamp */}
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-md w-2/3 pt-2"></div>
      </CardContent>
    </Card>
  )
}