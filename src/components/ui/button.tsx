import { cn } from "@/lib/utils";
import { forwardRef } from "react";

// Cajas duras con sombra desplazada, como los botones de Platanus: nada de
// pills ni de glows.
const variantStyles = {
  primary:
    "bg-[#422B78] text-[#E6E4DA] hover:bg-[#613BB8] active:bg-[#422B78]",
  conversion:
    "bg-[#D85A30] text-[#0E0E1A] font-bold hover:shadow-[0_0_20px_rgba(216,90,48,0.20)] active:opacity-90",
  secondary:
    "bg-[#613BB8] text-[#E6E4DA] hover:bg-[#7B3FA6] active:bg-[#613BB8]",
  "ghost-accent":
    "bg-transparent text-[#C143BC] hover:text-[#E6E4DA] hover:bg-[#1E1838]/50 active:text-[#C143BC]",
  "ghost-default":
    "bg-transparent text-[#73726C] hover:text-[#B4B2A9] hover:bg-[#1E1838]/50 active:text-[#73726C]",
  admin:
    "bg-transparent border border-[#D85A30] text-[#D85A30] hover:bg-[#D85A30] hover:text-[#0E0E1A] active:bg-[#D85A30]/80",
  // Alias de compatibilidad
  ghost:
    "bg-transparent text-[#73726C] hover:text-[#B4B2A9] hover:bg-[#1E1838]/50",
  danger:
    "border border-[#E24B4A] bg-[#E24B4A]/10 text-[#E24B4A] hover:bg-[#E24B4A]/25",
};

// 44px de alto mínimo en todos los tamaños para área de toque táctil (§6.1, §6.2)
const sizeStyles = {
  sm: "min-h-11 px-3.5 py-2 text-xs sm:text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm sm:px-6 sm:text-base",
  lg: "min-h-12 px-6 py-3.5 text-base sm:px-8 sm:text-lg",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-center font-mono rounded-[6px] transition-all duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
