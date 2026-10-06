import type { Metadata, Viewport } from "next";
import { InstallPrompt } from "@/components/install-prompt";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Velora",
    template: "%s | Velora",
  },
  description: "Velora is a daily mission game. Finish missions, earn XP and coins, and climb the ranks.",
  applicationName: "Velora",
  appleWebApp: {
    capable: true,
    title: "Velora",
    statusBarStyle: "black",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
