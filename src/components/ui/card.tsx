import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-glass-border bg-glass p-6 backdrop-blur-xl",
        hover &&
          "transition-all duration-300 hover:translate-y-[-2px] hover:border-glass-border-hover hover:shadow-lg hover:shadow-aws-orange/5",
        className
      )}
    >
      {children}
    </div>
  );
}
