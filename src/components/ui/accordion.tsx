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
            className="font-bold text-aws-orange underline underline-offset-2 break-all transition-colors hover:text-aws-orange/70"
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
    <div className={cn("border-t-2 border-hack-block/30", className)}>
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              "group border-b-2 border-hack-block/30 transition-colors duration-300",
              isOpen ? "bg-hack-block/[0.07]" : "hover:bg-hack-block/[0.04]",
            )}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full items-start gap-4 px-3 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="dot-matrix mt-0.5 shrink-0 text-sm text-hack-block/60">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "flex-1 font-display text-lg font-medium lowercase leading-snug tracking-tight transition-colors duration-300 md:text-xl",
                  isOpen ? "text-hack-block" : "text-surface-50 group-hover:text-hack-block",
                )}
              >
                {item.question}
              </span>
              {/* Signo que gira de + a −: más legible que un chevron a la altura
                  de un titular. */}
              <motion.span
                animate={{ rotate: isOpen ? 135 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="mt-0.5 shrink-0 text-2xl leading-none text-hack-block"
                aria-hidden="true"
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className={`pl-11 pr-10 font-mono text-sm leading-relaxed text-surface-300 md:text-base ${item.buttons?.length ? "pb-3" : "pb-6"}`}>
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
                          className="border-2 border-hack-block px-4 py-1.5 font-mono text-sm text-hack-block transition-colors hover:bg-hack-block hover:text-hack-ink"
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
