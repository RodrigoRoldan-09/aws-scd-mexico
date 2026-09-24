"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
}

interface DropdownMenuProps {
  items: DropdownItem[];
  className?: string;
}

export function DropdownMenu({ items, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-[6px] p-1.5 text-[#73726C] transition-colors hover:bg-[#2A1F5E] hover:text-[#E6E4DA]"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-[12px] border border-[#2C2550] bg-[#1E1838] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-sm transition-colors",
                item.variant === "danger"
                  ? "text-[#E24B4A] hover:bg-[#E24B4A]/10"
                  : "text-[#B4B2A9] hover:bg-[#2A1F5E] hover:text-[#E6E4DA]",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
