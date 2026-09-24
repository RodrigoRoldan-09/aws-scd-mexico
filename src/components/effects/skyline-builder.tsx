"use client";

import { motion } from "motion/react";

export function SkylineBuilder() {
  return (
    <div className="relative w-full h-[120px] md:h-[180px]" aria-hidden="true">
      <svg
        viewBox="0 0 1440 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-0 w-full h-full"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="skyline-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#232F3E" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#F2A6F0" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#F2A6F0" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <motion.path
          d={`
            M0,180 L0,140
            L60,140 L60,100 L80,100 L80,60 L100,60 L100,100 L120,100 L120,140
            L180,140 L180,90 L200,90 L200,50 L210,30 L220,50 L240,50 L240,90 L260,90 L260,140
            L320,140 L320,110 L340,110 L340,70 L360,70 L360,40 L370,25 L380,40 L380,70 L400,70 L400,110 L420,110 L420,140
            L500,140 L500,120 L520,120 L520,80 L540,80 L540,120 L560,120 L560,140
            L640,140 L640,95 L660,95 L660,55 L680,55 L680,45 L700,45 L700,55 L720,55 L720,95 L740,95 L740,140
            L820,140 L820,100 L840,100 L840,65 L860,65 L860,100 L880,100 L880,140
            L960,140 L960,110 L980,110 L980,75 L1000,75 L1000,50 L1010,35 L1020,50 L1020,75 L1040,75 L1040,110 L1060,110 L1060,140
            L1140,140 L1140,120 L1160,120 L1160,90 L1180,90 L1180,120 L1200,120 L1200,140
            L1280,140 L1280,105 L1300,105 L1300,70 L1320,70 L1320,105 L1340,105 L1340,140
            L1440,140 L1440,180 Z
          `}
          stroke="url(#skyline-grad)"
          strokeWidth="1.5"
          fill="url(#skyline-grad)"
          fillOpacity={0.05}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
