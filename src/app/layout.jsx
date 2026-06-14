import { Fraunces, Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/ui/Toast"

/**
 * FORGE — root layout
 *
 * Three-font system:
 *  - Fraunces   → display/voice (headlines, "this is a tool with a point of view")
 *  - Geist      → UI/body text
 *  - Geist Mono → reserved ONLY for things that are literally code:
 *                  file paths, diffs, identifiers, status labels.
 *
 * Body has NO default surface color — marketing/auth pages render on
 * --paper (the default in globals.css body{}), while /app/* routes
 * set data-theme="workshop" via AppShell to flip to the dark surfaces.
 * The old ember "noise-overlay" decorative layer has been removed.
 */

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
})

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500", "600"],
  display: "swap",
})

export const metadata = {
  title: "Forge — Repository-aware coding agent",
  description:
    "Forge reads your codebase as a dependency graph, traces every file a change will touch, and lets you approve each step before anything is written — from your phone or your desk.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Forge",
    description: "Repository-aware coding agent. Plan, traced. Code, reviewed. Branch, yours.",
    type: "website",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className="font-body antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
