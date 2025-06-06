/**
 * @description
 * This server component renders a skeleton loader for the `PredictionsDisplay` section.
 * It provides a placeholder UI that mimics the layout of two prediction cards
 * side-by-side, which is the typical arrangement while data is being fetched.
 * This component is used as a fallback in React Suspense boundaries.
 *
 * Key features:
 * - Renders two instances of `PredictionCardSkeleton` to represent the 5-minute and 8-hour predictions.
 * - Uses a grid layout consistent with `PredictionsDisplay` for proper alignment.
 * - Applies Tailwind CSS for styling, including `animate-pulse` for the skeleton effect.
 * - Each `PredictionCardSkeleton` is given a specific title to better reflect the eventual content.
 *
 * @dependencies
 * - "@/app/(main)/_components/prediction-card-skeleton": The skeleton component for an individual prediction card.
 * - "react": For component creation.
 *
 * @notes
 * - This component is intended for server-side rendering within a Suspense fallback.
 * - The styling (colors, borders, shadow) is consistent with other card components in the application.
 */
"use server"

import * as React from "react"
import { PredictionCardSkeleton } from "@/app/(main)/_components/prediction-card-skeleton"

interface PredictionsDisplaySkeletonProps {
  className?: string
}

export async function PredictionsDisplaySkeleton({
  className,
}: PredictionsDisplaySkeletonProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 ${className}`}
    >
      <PredictionCardSkeleton title="5-Minute Prediction" />
      <PredictionCardSkeleton title="8-Hour Prediction" />
    </div>
  )
}