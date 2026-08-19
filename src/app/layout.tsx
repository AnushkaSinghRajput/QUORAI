import type { Metadata } from "next";
import { JetBrains_Mono, Outfit, Sora } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { CosmicBackground } from "@/components/layout/CosmicBackground";
import { BRAND } from "@/lib/constants";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "optional",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} · ${BRAND.tagline.replace(/\.$/, "")}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
  },
  keywords: [
    "QUORAI",
    "AI web research",
    "deep research",
    "citations",
    "multi-source search",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `${BRAND.name} · ${BRAND.tagline}`,
    description: BRAND.description,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${sora.variable} ${jetbrains.variable} dark h-full antialiased`}
    >
      <body className="min-h-full font-sans text-ink">
        <AppProviders>
          <CosmicBackground />
          <div className="relative z-10 min-h-screen">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
