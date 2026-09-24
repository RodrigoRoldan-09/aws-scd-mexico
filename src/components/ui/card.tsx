import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
}

export function Card({ children, className, hover = false, clickable = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-[#2C2550] bg-[#1E1838] p-5 sm:p-6 transition-all duration-300",
        (hover || clickable) && "hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(97,59,184,0.25)]",
        hover && !clickable && "hover:border-[#613BB8]",
        clickable && "cursor-pointer hover:border-[#C143BC]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
