/**
 * @description
 * This is the root layout for the AlloraLens application. It sets up global styles,
 * fonts, and providers that are common across all pages.
 *
 * Key features:
 * - Applies global CSS and fonts (`GeistSans`, `GeistMono`).
 * - Wraps the application with `ThemeProvider` to enable light/dark mode.
 * - Sets metadata for the application (title, description).
 *
 * @dependencies
 * - "next/font/google": For loading Geist Sans and Geist Mono fonts.
 * - "@/app/globals.css": For global application styles.
 * - "@/components/shared/theme-provider": The theme provider component.
 * - "next": For `Metadata` type.
 *
 * @notes
 * - `suppressHydrationWarning` is added to the `html` tag, which is often
 *   recommended when using `next-themes` to avoid potential hydration warnings
 *   related to theme attributes being set on the client.
 */
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ThemeProvider } from "@/components/shared/theme-provider"

export const metadata: Metadata = {
  title: "AlloraLens",
  description:
    "Bitcoin price predictions and accuracy analysis from the Allora network.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}