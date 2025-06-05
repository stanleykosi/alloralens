/**
 * @description
 * This client component provides a button for users to toggle between light and dark themes.
 * It uses the `useTheme` hook from `next-themes` to access and modify the current theme.
 *
 * Key features:
 * - Allows users to switch between 'light' and 'dark' modes.
 * - Displays an appropriate icon (Sun for light, Moon for dark) based on the current theme.
 * - Uses the Shadcn `Button` component for consistent UI.
 *
 * @dependencies
 * - "next-themes": Specifically the `useTheme` hook.
 * - "lucide-react": For Sun and Moon icons.
 * - "@/components/ui/button": The Shadcn Button component.
 * - "react": For component creation and state management (`useEffect`, `useState`).
 *
 * @notes
 * - This component needs to be rendered within a `ThemeProvider` context to function correctly.
 * - It handles mounted state to avoid hydration mismatches between server and client rendering
 *   of the theme, which is a common pattern when working with `next-themes`.
 */
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // useEffect only runs on the client, so we can safely show the UI
  // after this runs, preventing hydration mismatch.
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render a placeholder or null on the server/initial client render
    // to avoid hydration mismatch. A button of the same size can prevent layout shift.
    return <Button variant="outline" size="icon" disabled className="h-9 w-9" />
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={
        theme === "light" ? "Switch to dark mode" : "Switch to light mode"
      }
    >
      {theme === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}