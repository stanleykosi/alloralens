/**
 * @description
 * This client component (`"use client"`) is responsible for displaying a single
 * Bitcoin price prediction from the Allora network. It presents the predicted value,
 * associated confidence interval, and the timestamp of when the prediction was generated.
 * The component is designed to be visually appealing, fitting the modern aesthetic
 * of the AlloraLens application, and includes subtle animations using Framer Motion.
 *
 * Key features:
 * - Displays prediction title (e.g., "5-Minute Prediction").
 * - Shows the predicted Bitcoin price, formatted as currency.
 * - Presents the confidence interval as a range (lower to upper bound).
 * - Indicates the time the prediction was generated.
 * - Handles cases where prediction data or confidence intervals might be unavailable.
 * - Uses Framer Motion for a subtle hover effect.
 * - Styled with Tailwind CSS and Shadcn UI's Card component.
 *
 * @dependencies
 * - "react": For component creation.
 * - "framer-motion": For animations.
 * - "@/components/ui/card": Shadcn Card components for consistent UI structure.
 * - "@/db/schema": For the `SelectPrediction` type definition.
 * - "lucide-react": For icons.
 *
 * @props
 * @interface PredictionCardProps
 * @property {string} title - The title for the prediction card (e.g., "5-Minute Prediction").
 * @property {SelectPrediction | null} prediction - The prediction data object, or null if no data is available.
 * @property {string} [className] - Optional additional CSS classes for styling the card.
 *
 * @notes
 * - Currency formatting uses `Intl.NumberFormat`.
 * - Date formatting uses `toLocaleString`.
 * - Confidence intervals are displayed if both lower and upper bounds are valid numbers.
 */
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { SelectPrediction } from "@/db/schema"
import { DollarSign, Activity, Clock, AlertTriangle } from "lucide-react"

interface PredictionCardProps {
  title: string
  prediction: SelectPrediction | null
  className?: string
}

export default function PredictionCard({
  title,
  prediction,
  className,
}: PredictionCardProps) {
  // Helper to format currency values
  const formatCurrency = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "N/A"
    const numValue = Number(value)
    if (isNaN(numValue)) return "Invalid Value"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue)
  }

  // Helper to format timestamp
  const formatTimestamp = (timestamp: Date | string | null) => {
    if (!timestamp) return "N/A"
    try {
      return new Date(timestamp).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        // second: "2-digit", // Hiding seconds for a cleaner look
        hour12: true,
      })
    } catch (e) {
      return "Invalid Date"
    }
  }

  const cardVariants = {
    hover: {
      scale: 1.02,
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
  }

  return (
    <motion.div whileHover="hover" variants={cardVariants} className={className}>
      <Card
        className={`
          bg-allora-card-light dark:bg-allora-card-dark 
          border-allora-border-light dark:border-allora-border-dark 
          shadow-lg rounded-xl p-6 h-full flex flex-col
          text-allora-foreground-light dark:text-allora-foreground-dark
        `}
      >
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-xl lg:text-2xl font-semibold">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex-grow space-y-4">
          {!prediction ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No prediction data available.
              </p>
              <p className="text-xs text-muted-foreground">
                Awaiting first prediction from the network...
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4 mr-2 shrink-0" />
                  <span>Predicted Price (BTC/USD)</span>
                </div>
                <p className="text-3xl lg:text-4xl font-bold font-mono text-allora-primary-light dark:text-allora-primary-dark">
                  {formatCurrency(prediction.predicted_value)}
                </p>
              </div>

              <div>
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <Activity className="w-4 h-4 mr-2 shrink-0" />
                  <span>Confidence Interval</span>
                </div>
                <p className="text-md font-mono">
                  {prediction.confidence_interval_lower &&
                  prediction.confidence_interval_upper &&
                  !isNaN(Number(prediction.confidence_interval_lower)) &&
                  !isNaN(Number(prediction.confidence_interval_upper))
                    ? `${formatCurrency(prediction.confidence_interval_lower)} - ${formatCurrency(prediction.confidence_interval_upper)}`
                    : "Not available"}
                </p>
              </div>

              <div>
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <Clock className="w-4 h-4 mr-2 shrink-0" />
                  <span>Prediction Generated At</span>
                </div>
                <p className="text-sm">
                  {formatTimestamp(prediction.created_at)}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}