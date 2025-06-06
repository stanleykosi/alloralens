/**
 * @description
 * This client component (`"use client"`) is responsible for displaying a single
 * Bitcoin price prediction from the Allora network. It presents the predicted value
 * and the timestamp of when the prediction was generated.
 * The component is designed to be visually appealing, fitting the modern aesthetic
 * of the AlloraLens application, and includes subtle animations using Framer Motion.
 *
 * Key features:
 * - Displays prediction title (e.g., "5-Minute Prediction").
 * - Shows the predicted Bitcoin price, formatted as currency.
 * - Indicates the time the prediction was generated.
 * - Handles cases where prediction data might be unavailable.
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
import { DollarSign, Clock, AlertTriangle } from "lucide-react"

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
  return (
    <motion.div
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`
        bg-gradient-to-br from-allora-card-light to-white dark:from-allora-card-dark dark:to-gray-900
        border border-allora-border-light dark:border-allora-border-dark
        shadow-md rounded-xl p-6 transition-all duration-300 ease-in-out
        hover:shadow-lg hover:border-allora-primary-light dark:hover:border-allora-primary-dark
        ${className}
      `}
    >
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold text-allora-foreground-light dark:text-allora-foreground-dark">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        {prediction ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center text-sm text-allora-foreground-light/80 dark:text-allora-foreground-dark/80">
                <DollarSign className="w-4 h-4 mr-2" />
                <span>Predicted Price (BTC/USD)</span>
              </div>
              <p className="text-4xl font-bold tracking-tight text-allora-primary-light dark:text-allora-primary-dark">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(parseFloat(prediction.predicted_value))}
              </p>
            </div>
            <div>
              <div className="flex items-center text-sm text-allora-foreground-light/80 dark:text-allora-foreground-dark/80">
                <Clock className="w-4 h-4 mr-2" />
                <span>Prediction Generated At</span>
              </div>
              <p className="text-md text-allora-foreground-light dark:text-allora-foreground-dark">
                {new Date(prediction.created_at).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <AlertTriangle className="w-10 h-10 text-allora-foreground-light/50 dark:text-allora-foreground-dark/50 mb-2" />
            <p className="font-semibold text-allora-foreground-light dark:text-allora-foreground-dark">
              No Prediction Data
            </p>
            <p className="text-sm text-allora-foreground-light/80 dark:text-allora-foreground-dark/80">
              Check back soon for the latest predictions.
            </p>
          </div>
        )}
      </CardContent>
    </motion.div>
  )
}