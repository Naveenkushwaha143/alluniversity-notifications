import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ThemeToaster } from "@/components/theme-toaster";
import { seoKeywords, siteConfig } from "@/lib/seo";
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
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  keywords: seoKeywords,
  authors: [{ name: "Naveen Kumar" }],
  creator: "Naveen Kumar",
  publisher: siteConfig.name,
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "education",
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/logos/pwa-icon-512.png",
        width: 512,
        height: 512,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/logos/pwa-icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.shortName,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: ["en-IN", "hi-IN"],
    audience: {
      "@type": "Audience",
      audienceType: "Indian students, college applicants, university students, board exam students",
    },
    about: [
      "University notices",
      "Exam notifications",
      "Board results",
      "Admission updates",
      "Scholarships",
      "Entrance exams",
    ],
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          try {
            var t = localStorage.getItem('theme');
            if (t === 'light') { document.documentElement.classList.add('light'); }
            else if (t === 'dark' || !t) { document.documentElement.classList.add('dark'); }
            else { document.documentElement.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
          } catch(e) { document.documentElement.classList.add('dark'); }
        `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={siteConfig.shortName} />
        <meta name="application-name" content={siteConfig.shortName} />
        <meta name="msapplication-TileColor" content="#06b6d4" />
        <meta name="classification" content="Education, University Notices, Exam Updates, Student Alerts" />
        <meta name="coverage" content="India" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <link rel="apple-touch-icon" href="/logos/pwa-icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/logos/pwa-icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/logos/pwa-icon-512.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
