import type { Metadata } from "next";
import { Poppins, League_Spartan } from "next/font/google";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import ThemeProvider from "@/components/ThemeProvider";
import { themeInitScript } from "@/lib/theme-init";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitPulse - Workout Tracker",
  description: "Track your workouts and progress with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeInitScript,
          }}
        />
      </head>
      <body className={`${poppins.variable} ${leagueSpartan.variable}`}>
        <ThemeProvider>
          <ErrorBoundary>
            <SkeletonTheme
              borderRadius="var(--radius-md)"
              duration={1.5}
            >
              {children}
            </SkeletonTheme>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
