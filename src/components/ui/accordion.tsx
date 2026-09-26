"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

function renderAnswer(text: string): React.ReactNode[] {
  const lines = text.split(/\n/);
  // Match markdown links [text](url) OR raw URLs https?://...
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+)/g;

  return lines.flatMap((line, li) => {
    const parts: React.ReactNode[] = line.split(tokenRegex).map((part, i) => {
      if (!part) return null;

      const mdMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (mdMatch) {
        const [, label, url] = mdMatch;
        const isExternal = url.startsWith("http");
        if (isExternal) {
          return (
            <a
              key={`${li}-${i}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#F2A6F0] underline underline-offset-4 decoration-[#C143BC] transition-colors hover:text-[#FFFFFF]"
            >
              {label}
            </a>
          );
        }
        return (
          <Link
            key={`${li}-${i}`}
            href={url}
            className="font-bold text-[#F2A6F0] underline underline-offset-4 decoration-[#C143BC] transition-colors hover:text-[#FFFFFF]"
          >
            {label}
          </Link>
        );
      }

      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={`${li}-${i}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#F2A6F0] underline underline-offset-4 decoration-[#C143BC] break-all transition-colors hover:text-[#FFFFFF]"
          >
            {part}
          </a>
        );
      }

      return <React.Fragment key={`${li}-${i}`}>{part}</React.Fragment>;
    });

    if (li < lines.length - 1) parts.push(<br key={`br-${li}`} />);
    return parts;
  });
}

interface AccordionButton {
  label: string;
  url: string;
}

interface AccordionItem {
  id: string;
  question: string;
  answer: string;
  buttons?: AccordionButton[];
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={cn("border-t border-[#2C2550]", className)}>
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              "group border-b border-[#2C2550] transition-colors duration-300",
              isOpen ? "bg-[#1E1838]/60" : "hover:bg-[#1E1838]/30",
            )}
          >
            <button
              id={`accordion-btn-${item.id}`}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full items-start gap-4 px-3 py-5 text-left"
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
            >
              <span className="font-mono mt-0.5 shrink-0 text-sm text-[#73726C]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "flex-1 font-mono text-sm font-bold leading-snug transition-colors duration-200 md:text-base",
                  isOpen ? "text-[#C143BC]" : "text-[#E6E4DA] group-hover:text-[#C143BC]",
                )}
              >
                {item.question}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 135 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "mt-0.5 shrink-0 text-2xl leading-none transition-colors duration-200",
                  isOpen ? "text-[#C143BC]" : "text-[#73726C] group-hover:text-[#C143BC]",
                )}
                aria-hidden="true"
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`accordion-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`accordion-btn-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className={`pl-11 pr-10 font-mono text-[13px] leading-[1.7] text-[#B4B2A9] md:text-sm ${item.buttons?.length ? "pb-3" : "pb-6"}`}>
                    {renderAnswer(item.answer)}
                  </p>
                  {item.buttons && item.buttons.length > 0 && (
                    <div className="flex flex-wrap gap-3 pb-6 pl-11">
                      {item.buttons.map((btn) => {
                        const isExternal = btn.url.startsWith("http");
                        const btnClass =
                          "inline-flex min-h-11 items-center justify-center gap-2 border-2 border-[#C143BC] bg-[#1E1838] px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#E6E4DA] shadow-[3px_3px_0_0_var(--color-hack-dim)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[#F2A6F0] hover:bg-[#C143BC] hover:text-[#000000] hover:shadow-[5px_5px_0_0_var(--color-hack-dim)] active:translate-x-0 active:translate-y-0 active:shadow-none";

                        if (isExternal) {
                          return (
                            <a
                              key={btn.url}
                              href={btn.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={btnClass}
                            >
                              {btn.label}
                            </a>
                          );
                        }
                        return (
                          <Link key={btn.url} href={btn.url} className={btnClass}>
                            {btn.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
