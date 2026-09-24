import { cn } from "@/lib/utils";

const variants = {
  beginner: "bg-emerald/15 text-emerald border-emerald/20",
  intermediate: "bg-aws-orange/15 text-aws-orange border-aws-orange/20",
  advanced: "bg-red-500/15 text-red-400 border-red-500/20",
  cloud: "bg-blue-400/15 text-blue-400 border-blue-400/20",
  ai: "bg-purple-400/15 text-purple-400 border-purple-400/20",
  devops: "bg-cyan-400/15 text-cyan-400 border-cyan-400/20",
  soft: "bg-gold/15 text-gold border-gold/20",
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
        "inline-flex items-center rounded-none border px-3 py-1 font-mono text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
