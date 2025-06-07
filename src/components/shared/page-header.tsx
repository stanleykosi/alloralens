/**
 * @description
 * This server component renders the main page header for the AlloraLens application.
 * It displays the application title and includes the `ThemeToggle` component for
 * switching between light and dark modes.
 *
 * Key features:
 * - Displays the application title "AlloraLens".
 * - Integrates the `ThemeToggle` component.
 * - Styled with Tailwind CSS for a modern, clean appearance.
 *
 * @dependencies
 * - "@/components/shared/theme-toggle": The component for theme switching.
 *
 * @notes
 * - This component is intended to be used within main page layouts.
 * - As a server component, it does not handle client-side interactions directly
 *   but composes client components like `ThemeToggle` where necessary.
 */
"use server"

import { ThemeToggle } from "@/components/shared/theme-toggle"

export async function PageHeader({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 border-b border-allora-border-light dark:border-allora-border-dark">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-allora-foreground-light dark:text-allora-foreground-dark">
          {title}
        </h1>

        <div className="flex items-center gap-4">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}