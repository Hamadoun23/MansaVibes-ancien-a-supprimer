import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mansa Vibes — Atelier",
    short_name: "Mansa Vibes",
    description: "Clients, mesures, commandes et caisse de l'atelier — à la voix.",
    lang: "fr",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0b0a",
    theme_color: "#0b0b0a",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Assistant vocal", url: "/today?assistant=1", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Nouvelle commande", url: "/orders/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
