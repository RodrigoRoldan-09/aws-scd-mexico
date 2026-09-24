import { cn } from "@/lib/utils";

const variants = {
  // Variantes oficiales SBG (§6.3)
  fuchsia: "border border-[#C143BC] text-[#C143BC] bg-[#C143BC]/10",
  purple: "border border-[#613BB8] text-[#613BB8] bg-[#613BB8]/10",
  orange: "border border-[#D85A30] text-[#D85A30] bg-[#D85A30]/10",
  badge: "border border-[#C143BC] text-[#C143BC] bg-[#1a1040]",
  "solid-purple": "border border-[#613BB8] bg-[#613BB8] text-[#E6E4DA]",
  // Mapeos para compatibilidad con código existente
  beginner: "border border-[#7B3FA6] text-[#7B3FA6] bg-[#7B3FA6]/10",
  intermediate: "border border-[#613BB8] text-[#613BB8] bg-[#613BB8]/10",
  advanced: "border border-[#D85A30] text-[#D85A30] bg-[#D85A30]/10",
  cloud: "border border-[#378ADD] text-[#378ADD] bg-[#378ADD]/10",
  ai: "border border-[#C143BC] text-[#C143BC] bg-[#C143BC]/10",
  devops: "border border-[#3DD6D0] text-[#3DD6D0] bg-[#3DD6D0]/10",
  soft: "border border-[#7B3FA6] text-[#7B3FA6] bg-[#7B3FA6]/10",
};

interface BadgeProps {
  variant: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
