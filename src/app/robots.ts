import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/en/",
          "/registro",
          "/en/registro",
          "/speakers",
          "/en/speakers",
          "/voluntarios",
          "/en/voluntarios",
          "/codigo-conducta",
          "/en/codigo-conducta",
          "/privacidad",
          "/en/privacidad",
        ],
        disallow: ["/admin/", "/en/admin/", "/api/", "/_next/", "/*/opengraph-image", "/opengraph-image", "/pasaporte/", "/en/pasaporte/", "/confirmar/", "/en/confirmar/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
