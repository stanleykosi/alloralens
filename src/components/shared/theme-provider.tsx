/**
 * @description
 * This component provides theme context to the application, enabling light and dark mode
 * functionality using the `next-themes` library. It acts as a client-side wrapper
 * around the `ThemeProvider` from `next-themes`.
 *
 * Key features:
 * - Integrates `next-themes` for theme management.
 * - Allows children components to access and control the current theme.
 *
 * @dependencies
 * - "next-themes": For the core theme provider functionality.
 * - "react": For component creation.
 *
 * @notes
 * - This component must be used at a high level in the application tree, typically
 *   in the root layout, to ensure the theme context is available everywhere.
 * - The `attribute="class"` prop configures `next-themes` to toggle themes by
 *   adding/removing a class (e.g., 'dark') on the HTML element.
 * - `defaultTheme="system"` allows the application to initially respect the user's
 *   system preference.
 * - `enableSystem` enables the system theme preference.
 * - `disableTransitionOnChange` prevents theme transition animations on page load/change.
 */
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}