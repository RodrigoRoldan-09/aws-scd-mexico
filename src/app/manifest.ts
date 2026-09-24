import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AWS Student Community Day México 2026",
    short_name: "AWS SCD 2026",
    description: "4 nov · CDMX · Gratis — Charlas, talleres y networking cloud",
    start_url: "/",
    display: "standalone",
    background_color: "#0E0E1A",
    theme_color: "#C143BC",
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
