"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TypingEffectProps { text: string; speed?: number; className?: string; }

export function TypingEffect({ text, speed = 50, className }: TypingEffectProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { setDone(true); clearInterval(interval); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={cn(className)}>
      {displayed}
      <span className={cn("inline-block w-[2px] h-[1em] bg-aws-orange ml-0.5 align-middle", done && "animate-[blink_1s_step-end_infinite]")} aria-hidden="true" />
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </span>
  );
}
