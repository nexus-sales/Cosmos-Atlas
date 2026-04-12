import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cosmos Atlas",
    short_name: "CosmosAtlas",
    description: "Planetario interactivo 3D en tiempo real",
    start_url: "/",
    display: "standalone",
    background_color: "#02050a",
    theme_color: "#1e3a8a",
    orientation: "any",
    categories: ["education", "utilities"],
    icons: [
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
