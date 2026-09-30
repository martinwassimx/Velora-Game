import type { Metadata, Viewport } from "next";
import "@fontsource/cairo/arabic-400.css";
import "@fontsource/cairo/arabic-700.css";
import "@fontsource/cairo/arabic-800.css";
import "@fontsource/cairo/latin-400.css";
import "@fontsource/cairo/latin-700.css";
import "@fontsource/cairo/latin-800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "مهام مارو جيصه",
    template: "%s | مهام مارو جيصه",
  },
  description: "لعبة المهام اليومية. خلّص المهام، اجمع XP وكوينز، وحافظ على الستريك.",
  icons: { icon: "/maro.jpg", apple: "/maro.jpg" },
};

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#100c08",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
