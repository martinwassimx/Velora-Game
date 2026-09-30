import type { Metadata, Viewport } from "next";
import "@fontsource/cairo/arabic-400.css";
import "@fontsource/cairo/arabic-700.css";
import "@fontsource/cairo/arabic-800.css";
import "@fontsource/cairo/latin-400.css";
import "@fontsource/cairo/latin-700.css";
import "@fontsource/cairo/latin-800.css";
import { InstallPrompt } from "@/components/install-prompt";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "مهام مارو جيصه",
    template: "%s | مهام مارو جيصه",
  },
  description: "لعبة المهام اليومية. خلّص المهام، اجمع XP وكوينز، وحافظ على الستريك.",
  applicationName: "مارو جيصه",
  appleWebApp: {
    capable: true,
    title: "مارو جيصه",
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
  themeColor: "#100c08",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
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
