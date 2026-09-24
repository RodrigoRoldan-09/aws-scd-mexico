"use client";

import React from "react";
import Image from "next/image";
import { sponsors } from "@/data/sponsors";
import { basePath } from "@/lib/utils";

export function SponsorsBanner() {
  const allSponsors = [
    ...sponsors.filter((s) => s.tier !== "community"),
    ...sponsors.filter((s) => s.tier === "community"),
  ];

  return (
    <section className="bg-surface-900/80 py-6 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl overflow-hidden">
        <div
          className="flex animate-marquee gap-14"
          style={{
            width: "max-content",
            "--marquee-duration": `${allSponsors.length * 2}s`,
          } as React.CSSProperties}
        >
          {[...allSponsors, ...allSponsors].map((s, i) => (
            <div key={`${s.id}-${i}`} className="relative h-16 w-48 shrink-0">
              <Image
                src={`${basePath}${s.logo}`}
                alt={s.name}
                fill
                className="object-contain opacity-55 transition-opacity duration-300 hover:opacity-100"
                sizes="192px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
