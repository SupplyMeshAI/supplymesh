import type { Metadata } from "next"
import { Geist } from "next/font/google"  // ← Change to Geist (not GeistSans)
import "./globals.css"
import { cn } from "@/lib/utils"

// Define the font (Sans version)
const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",  // This creates a CSS var for Tailwind/shadcn to use
  display: "swap",          // Good practice for performance
})

export const metadata: Metadata = {
  title: "SupplyMesh - AI-Powered Manufacturing Sourcing",
  description: "Intelligent matching layer for suppliers and manufacturers",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable  // ← Applies the variable font
        )}
      >
        {children}
      </body>
    </html>
  )
}