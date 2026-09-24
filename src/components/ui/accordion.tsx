"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

function renderAnswer(text: string): React.ReactNode[] {
  const lines = text.split(/\n/);
  return lines.flatMap((line, li) => {
    const parts: React.ReactNode[] = line
      .split(/(https?:\/\/[^\s]+)/g)
      .map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={`${li}-${i}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#378ADD] underline underline-offset-2 break-all transition-colors hover:text-[#C143BC]"
          >
            {part}
          </a>
        ) : (
          <React.Fragment key={`${li}-${i}`}>{part}</React.Fragment>
        ),
      );
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
                    <div className="flex flex-wrap gap-2 pb-6 pl-11">
                      {item.buttons.map((btn) => (
                        <a
                          key={btn.url}
                          href={btn.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-[6px] border border-[#613BB8] px-4 py-1.5 font-mono text-sm text-[#E6E4DA] transition-colors hover:bg-[#613BB8] hover:text-[#FFFFFF]"
                        >
                          {btn.label}
                        </a>
                      ))}
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
