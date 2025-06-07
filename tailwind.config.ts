import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

const config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        border: "hsl(var(--border))", // Base for Shadcn
        input: "hsl(var(--input))", // Base for Shadcn
        ring: "hsl(var(--ring))", // Base for Shadcn
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: { // Base for Shadcn
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: { // Base for Shadcn
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: { // Base for Shadcn
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: { // Base for Shadcn
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: { // Base for Shadcn
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom color palette for a modern, data-driven aesthetic
        allora: {
          "bg-start-light": "#E0E7FF", // Light lavender
          "bg-end-light": "#F0F4F8", // Light steel blue
          "bg-start-dark": "#0D1117", // Dark slate blue
          "bg-end-dark": "#1F2937", // Dark grey blue

          "card-light": "rgba(255, 255, 255, 0.6)",
          "card-dark": "rgba(30, 41, 59, 0.6)",

          "border-light": "rgba(224, 231, 255, 0.8)",
          "border-dark": "rgba(55, 65, 81, 0.8)",

          "foreground-light": "#111827",
          "foreground-dark": "#E5E7EB",

          "primary-light": "#3B82F6", // Tailwind blue-500
          "primary-dark": "#2DD4BF", // Tailwind teal-400

          "accent-light": "#EC4899", // Tailwind pink-500
          "accent-dark": "#A78BFA", // Tailwind violet-400
        }
      },
      borderRadius: { // Base for Shadcn
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: { // Base for Shadcn
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: { // Base for Shadcn
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config