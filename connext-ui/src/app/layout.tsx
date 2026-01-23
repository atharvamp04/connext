import { ThemeProvider } from "@/contexts/theme-context"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          </ThemeProvider>
      </body>
    </html>
  )
}
