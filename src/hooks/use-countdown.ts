"use client";

import { useState, useEffect } from "react";

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isPostEvent: boolean;
  isActive: boolean;
}

export function useCountdown(targetDate: string | null): CountdownResult {
  const [timeLeft, setTimeLeft] = useState<CountdownResult>({
    days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false, isPostEvent: false, isActive: false,
  });

  useEffect(() => {
    if (!targetDate) return;
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        // Pasadas 24 h desde el inicio se considera post-evento.
        const isPostEvent = diff < -86400000;
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isPostEvent, isActive: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isExpired: false, isPostEvent: false, isActive: true,
      });
    };
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}
