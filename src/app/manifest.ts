import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "مهام مارو جيصه",
    short_name: "مارو جيصه",
    description: "لعبة المهام اليومية. خلّص المهام، اجمع XP وكوينز، وحافظ على الستريك.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#100c08",
    theme_color: "#100c08",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
