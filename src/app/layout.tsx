import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ThemeToaster } from "@/components/theme-toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "All University Updates - Bihar, Haryana, Delhi, UP",
  description: "Latest notices, exam schedules, results & admissions from 125+ universities across Bihar, Haryana, Delhi & UP. Real-time board exam notifications.",
  keywords: ["university", "notices", "Bihar Board", "BSEB", "CBSE", "MDU", "DU", "GU", "exam", "results", "admissions", "scholarship"],
  authors: [{ name: "Naveen Kumar" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "All University Updates - Bihar, Haryana, Delhi, UP",
    description: "125+ universities, 24 education boards, 77 entrance exams — all in one place",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UniUpdates",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('theme');
            if (t === 'light') { document.documentElement.classList.add('light'); }
            else if (t === 'dark' || !t) { document.documentElement.classList.add('dark'); }
            else { document.documentElement.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
          } catch(e) { document.documentElement.classList.add('dark'); }
        ` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="UniUpdates" />
        <meta name="application-name" content="UniUpdates" />
        <meta name="msapplication-TileColor" content="#06b6d4" />
        <link rel="apple-touch-icon" href="/logos/pwa-icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/logos/pwa-icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/logos/pwa-icon-512.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true} disableTransitionOnChange={true}>
          {children}
          <ThemeToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
