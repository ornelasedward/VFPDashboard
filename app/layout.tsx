import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "VFP Trading Strategy Dashboard",
  description: "Advanced trading strategy analytics dashboard tracking performance across multiple timeframes and configurations. Monitor PnL, win rates, and profit factors in real-time.",
  openGraph: {
    title: "VFP Trading Strategy Dashboard",
    description: "Advanced trading strategy analytics dashboard tracking performance across multiple timeframes and configurations. Monitor PnL, win rates, and profit factors in real-time.",
    url: defaultUrl,
    siteName: "VFP Dashboard",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "VFP Trading Strategy Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VFP Trading Strategy Dashboard",
    description: "Advanced trading strategy analytics dashboard tracking performance across multiple timeframes and configurations.",
    images: ["/og-image.svg"],
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning>
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
  );
}
