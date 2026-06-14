import { Fraunces, Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

/**
 * FORGE — root layout
 *
 * Three-font system:
 *  - Fraunces  → display/voice (headlines, "this is a tool with a point of view")
 *  - Geist     → UI/body text
 *  - Geist Mono → reserved ONLY for things that are literally code:
 *                  file paths, diffs, identifiers, status labels.
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
  title: "Forge",
  description: "A repository-aware coding agent that traces every file a change will touch before writing a line of code.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  )
}
