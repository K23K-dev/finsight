import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono, Manrope } from "next/font/google";

import { cn } from "@finsight/ui";
import { ThemeProvider } from "@finsight/ui/theme";
import { Toaster } from "@finsight/ui/toast";

import { env } from "~/env";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://finsight.io.vercel.app"
      : "http://localhost:3000",
  ),
  title: "FinSight",
  description:
    "Connect accounts, review transactions, and understand cash flow from one personal finance workspace.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "FinSight",
    description:
      "Connect accounts, review transactions, and understand cash flow from one personal finance workspace.",
    url: "https://finsight.io.vercel.app",
    siteName: "FinSight",
  },
  twitter: {
    card: "summary",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f0eb" },
    { media: "(prefers-color-scheme: dark)", color: "#070807" },
  ],
};

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-svh font-sans antialiased",
          manrope.variable,
          jetbrainsMono.variable,
          instrumentSerif.variable,
        )}
      >
        <ThemeProvider defaultTheme="dark">
          {props.children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
