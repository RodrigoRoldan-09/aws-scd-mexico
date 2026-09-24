import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { SpeakerProfile } from "@/models/speaker-profile";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

const base = SITE_URL;

type Route = {
  es: string;
  en: string;
  priorityEs: number;
  priorityEn: number;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
};

const staticRoutes: Route[] = [
  { es: "",                 en: "/en",                 priorityEs: 1.0,  priorityEn: 0.95, changeFrequency: "weekly"  },
  { es: "/registro",        en: "/en/registro",        priorityEs: 0.95, priorityEn: 0.9,  changeFrequency: "weekly"  },
  { es: "/speakers",        en: "/en/speakers",        priorityEs: 0.85, priorityEn: 0.8,  changeFrequency: "weekly"  },
  { es: "/directorio",      en: "/en/directorio",      priorityEs: 0.8,  priorityEn: 0.75, changeFrequency: "daily"   },
  { es: "/voluntarios",     en: "/en/voluntarios",     priorityEs: 0.75, priorityEn: 0.7,  changeFrequency: "weekly"  },
  { es: "/kiro",            en: "/en/kiro",            priorityEs: 0.8,  priorityEn: 0.75, changeFrequency: "weekly"  },
  { es: "/codigo-conducta", en: "/en/codigo-conducta", priorityEs: 0.5,  priorityEn: 0.45, changeFrequency: "monthly" },
  { es: "/privacidad",      en: "/en/privacidad",      priorityEs: 0.4,  priorityEn: 0.35, changeFrequency: "monthly" },
];

function routeEntries(routes: Route[], now: Date): MetadataRoute.Sitemap {
  return routes.flatMap(({ es, en, priorityEs, priorityEn, changeFrequency }) => [
    {
      url: `${base}${es}`,
      lastModified: now,
      changeFrequency,
      priority: priorityEs,
      alternates: { languages: { es: `${base}${es}`, en: `${base}${en}`, "x-default": `${base}${es}` } },
    },
    {
      url: `${base}${en}`,
      lastModified: now,
      changeFrequency,
      priority: priorityEn,
      alternates: { languages: { es: `${base}${es}`, en: `${base}${en}`, "x-default": `${base}${es}` } },
    },
  ]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  let speakerSlugs: string[] = [];
  try {
    await connectDB();
    const profiles = await SpeakerProfile.find({ isPublic: true }, { slug: 1, updatedAt: 1 }).lean();
    speakerSlugs = profiles.map((p) => p.slug as string).filter(Boolean);
  } catch {
    // Sin base de datos durante el build se omiten los perfiles.
  }

  const speakerEntries: MetadataRoute.Sitemap = speakerSlugs.flatMap((slug) => [
    {
      url: `${base}/speakers/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          es: `${base}/speakers/${slug}`,
          en: `${base}/en/speakers/${slug}`,
          "x-default": `${base}/speakers/${slug}`,
        },
      },
    },
    {
      url: `${base}/en/speakers/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
      alternates: {
        languages: {
          es: `${base}/speakers/${slug}`,
          en: `${base}/en/speakers/${slug}`,
          "x-default": `${base}/speakers/${slug}`,
        },
      },
    },
  ]);

  return [...routeEntries(staticRoutes, now), ...speakerEntries];
}
