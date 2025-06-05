/**
 * @description
 * This client component (`"use client"`) is responsible for displaying accuracy metrics,
 * including Key Performance Indicators (KPIs) for rolling accuracy periods (daily, weekly, monthly)
 * and a trend chart showing daily accuracy over the last 30 days. It uses Nivo for charting.
 *
 * Key features:
 * - Displays KPI cards for 24h, 7d, and 30d average accuracies.
 * - Renders a Nivo line chart for daily accuracy trends.
 * - Dynamically adapts Nivo chart theme based on light/dark mode.
 * - Handles cases where data might be insufficient.
 * - Styled with Tailwind CSS and Shadcn UI components.
 *
 * @dependencies
 * - "react": For component creation and hooks.
 * - "next-themes": For `useTheme` to adapt to light/dark mode.
 * - "@nivo/line": For the `ResponsiveLine` chart component.
 * - "@nivo/core": For Nivo theming and types.
 * - "@/components/ui/card": Shadcn Card components.
 * - "@/actions/db/accuracy-actions": For `AccuracyMetricsData` type.
 * - "lucide-react": For icons.
 *
 * @props
 * @interface AccuracyChartsProps
 * @property {AccuracyMetricsData | null} metrics - The accuracy data (KPIs and trend data).
 *                                                 Null if data fetching failed or is pending.
 * @property {string} [className] - Optional additional CSS classes for styling the main card.
 */
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { ResponsiveLine, type LineSvgProps } from "@nivo/line"
import type { Theme as NivoTheme } from "@nivo/core"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import type { AccuracyMetricsData } from "@/actions/db/accuracy-actions"
import { TrendingUp, CalendarDays, AlertCircle } from "lucide-react"

interface AccuracyChartsProps {
  metrics: AccuracyMetricsData | null
  className?: string
}

// Helper sub-component for displaying individual KPI cards
function KpiCard({
  title,
  value,
  icon: Icon,
  period,
}: {
  title: string
  value: number | null
  icon: React.ElementType
  period: string
}) {
  const formattedValue =
    value !== null && !isNaN(value) ? `${value.toFixed(2)}%` : "N/A"

  return (
    <Card className="bg-background/70 dark:bg-black/30 p-4 shadow-md border-allora-border-light dark:border-allora-border-dark">
      <CardHeader className="p-0 mb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-2xl font-bold font-mono text-allora-primary-light dark:text-allora-primary-dark">
          {formattedValue}
        </div>
        <p className="text-xs text-muted-foreground">{period}</p>
      </CardContent>
    </Card>
  )
}

export default function AccuracyCharts({
  metrics,
  className,
}: AccuracyChartsProps) {
  const { theme: currentUiTheme } = useTheme() // 'light', 'dark', or 'system'
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Determine effective theme for Nivo (resolving 'system')
  let effectiveTheme: "light" | "dark" = "light" // Default
  if (mounted) {
    if (currentUiTheme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    } else {
      effectiveTheme = currentUiTheme as "light" | "dark"
    }
  }

  // Define Nivo theme based on the application's current theme
  const nivoTheme: NivoTheme = {
    background: "transparent", // Chart is on a card, so card bg applies
    text: {
      fontSize: 12,
      fill: effectiveTheme === "dark" ? "#E0E0E0" : "#222222", // Foreground
      fontFamily: "var(--font-geist-sans)",
    },
    axis: {
      domain: {
        line: {
          stroke: effectiveTheme === "dark" ? "#333333" : "#DDDDDD", // Border
          strokeWidth: 1,
        },
      },
      legend: {
        text: {
          fontSize: 12,
          fill: effectiveTheme === "dark" ? "#E0E0E0" : "#222222", // Foreground
          fontFamily: "var(--font-geist-sans)",
        },
      },
      ticks: {
        line: {
          stroke: effectiveTheme === "dark" ? "#333333" : "#DDDDDD", // Border
          strokeWidth: 1,
        },
        text: {
          fontSize: 11,
          fill: effectiveTheme === "dark" ? "#A0A0A0" : "#555555", // Muted foreground
          fontFamily: "var(--font-geist-mono)",
        },
      },
    },
    grid: {
      line: {
        stroke: effectiveTheme === "dark" ? "#2a2a2a" : "#ECECEC", // Lighter border
        strokeWidth: 0.5,
      },
    },
    legends: {
      text: {
        fontSize: 12,
        fill: effectiveTheme === "dark" ? "#E0E0E0" : "#222222", // Foreground
        fontFamily: "var(--font-geist-sans)",
      },
    },
    tooltip: {
      container: {
        background: effectiveTheme === "dark" ? "#1E1E1E" : "#F7F7F7", // Card background
        color: effectiveTheme === "dark" ? "#E0E0E0" : "#222222", // Foreground
        fontSize: 12,
        fontFamily: "var(--font-geist-sans)",
        borderRadius: "6px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      },
    },
    crosshair: {
      line: {
        stroke: effectiveTheme === "dark" ? "#00A699" : "#008489", // Primary accent
        strokeWidth: 1,
        strokeOpacity: 0.75,
      },
    },
    // Nivo doesn't directly support HSL strings for colors prop array, use hex/rgb.
    // We'll define a single color for the line.
  }

  const lineColors: LineSvgProps["colors"] = [
    effectiveTheme === "dark" ? "#00A699" : "#008489", // Primary accent
  ]

  if (!mounted) {
    // To prevent layout shift and hydration errors, render a simple placeholder or null.
    // The parent Suspense boundary should handle a more detailed skeleton.
    return null
  }

  if (!metrics) {
    return (
      <Card
        className={`
          bg-allora-card-light dark:bg-allora-card-dark 
          border-allora-border-light dark:border-allora-border-dark 
          shadow-lg rounded-xl p-6 ${className}
        `}
      >
        <CardHeader>
          <CardTitle>Accuracy Overview</CardTitle>
          <CardDescription>Loading accuracy data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <AlertCircle className="w-8 h-8 text-muted-foreground animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  const { kpiMetrics, trendData } = metrics
  const hasTrendData =
    trendData && trendData.length > 0 && trendData[0].data.length > 0

  return (
    <Card
      className={`
        bg-allora-card-light dark:bg-allora-card-dark 
        border-allora-border-light dark:border-allora-border-dark 
        shadow-xl rounded-xl p-4 sm:p-6 ${className}
      `}
    >
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-2xl font-semibold text-allora-foreground-light dark:text-allora-foreground-dark">
          Accuracy Overview
        </CardTitle>
        <CardDescription className="text-allora-foreground-light/80 dark:text-allora-foreground-dark/80">
          Performance of Allora Network's Bitcoin price predictions.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            title="24h Accuracy"
            value={kpiMetrics.daily}
            icon={TrendingUp}
            period="Last 24 hours"
          />
          <KpiCard
            title="7d Accuracy"
            value={kpiMetrics.weekly}
            icon={CalendarDays}
            period="Last 7 days"
          />
          <KpiCard
            title="30d Accuracy"
            value={kpiMetrics.monthly}
            icon={CalendarDays}
            period="Last 30 days"
          />
        </div>

        {/* Trend Chart */}
        <div>
          <h3 className="text-lg font-medium mb-1 text-allora-foreground-light dark:text-allora-foreground-dark">
            Daily Accuracy Trend
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Average accuracy over the last 30 days.
          </p>
          {hasTrendData ? (
            <div className="h-[350px] sm:h-[400px] w-full">
              <ResponsiveLine
                data={trendData}
                theme={nivoTheme}
                colors={lineColors}
                margin={{ top: 20, right: 25, bottom: 60, left: 50 }}
                xScale={{ type: "point" }}
                yScale={{
                  type: "linear",
                  min: 0,
                  max: 100,
                  stacked: false,
                  reverse: false,
                }}
                yFormat=" >-.2f" // Format Y-axis values and tooltips
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -30, // Rotate labels for better fit if many points
                  legend: "Date",
                  legendOffset: 50,
                  legendPosition: "middle",
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "Accuracy (%)",
                  legendOffset: -40,
                  legendPosition: "middle",
                  format: " >-.0f", // Format Y-axis tick labels
                }}
                pointSize={6}
                pointColor={{ theme: "background" }} // Make points visible
                pointBorderWidth={2}
                pointBorderColor={{ from: "serieColor" }}
                pointLabelYOffset={-12}
                useMesh={true} // Improves tooltip performance
                enableGridX={false}
                enableGridY={true}
                tooltip={({ point }) => (
                  <div
                    style={{
                      background:
                        effectiveTheme === "dark" ? "#1E1E1E" : "#F7F7F7",
                      padding: "8px 12px",
                      border: `1px solid ${effectiveTheme === "dark" ? "#333333" : "#DDDDDD"}`,
                      borderRadius: "4px",
                      fontFamily: "var(--font-geist-sans)",
                      fontSize: "12px",
                      color: effectiveTheme === "dark" ? "#E0E0E0" : "#222222",
                    }}
                  >
                    <strong>{point.serieId}</strong>
                    <br />
                    Date: {point.data.xFormatted}
                    <br />
                    Accuracy: {Number(point.data.y).toFixed(2)}%
                  </div>
                )}
                legends={[
                  {
                    anchor: "bottom-right",
                    direction: "column",
                    justify: false,
                    translateX: 100, // This might push legend off-screen, adjust if needed or remove
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: "left-to-right",
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: "circle",
                    symbolBorderColor: "rgba(0, 0, 0, .5)",
                    effects: [
                      {
                        on: "hover",
                        style: {
                          itemBackground: "rgba(0, 0, 0, .03)",
                          itemOpacity: 1,
                        },
                      },
                    ],
                    toggleSerie: true, // Allows hiding series by clicking legend (if multiple series)
                  },
                ]}
              />
            </div>
          ) : (
            <div className="h-[350px] sm:h-[400px] w-full flex flex-col items-center justify-center border-2 border-dashed border-allora-border-light dark:border-allora-border-dark rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Not Enough Data
              </p>
              <p className="text-sm text-muted-foreground">
                There isn't enough historical accuracy data to display the
                trend chart yet.
                <br />
                Please check back later as more data is collected.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}