import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AWS Student Community Day México 2026",
    short_name: "AWS SCD 2026",
    description: "4 nov · CDMX · Gratis — Charlas, talleres y networking cloud",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0F",
    theme_color: "#F2A6F0",
    icons: [
      {
        src: "/images/logos/event-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logos/event-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
