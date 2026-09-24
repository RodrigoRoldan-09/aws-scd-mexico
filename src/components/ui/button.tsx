import { cn } from "@/lib/utils";
import { forwardRef } from "react";

// Cajas duras con sombra desplazada, como los botones de Platanus: nada de
// pills ni de glows.
const variantStyles = {
  primary:
    "bg-aws-orange text-surface-900 font-bold shadow-[4px_4px_0_0_var(--color-hack-dim)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-hack-dim)] active:translate-x-0 active:translate-y-0 active:shadow-none",
  secondary:
    "border-2 border-aws-orange text-aws-orange hover:bg-aws-orange hover:text-surface-900",
  ghost: "border-2 border-surface-600 text-surface-100 hover:border-aws-orange hover:text-aws-orange",
  danger:
    "border-2 border-red-500 bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:shadow-[4px_4px_0_0_rgba(239,68,68,0.4)]",
};

// 44px de alto minimo en todos los tamanos: es lo que hay que poder tocar con
// el pulgar. El `sm` medida 36 y en el telefono se fallaba.
const sizeStyles = {
  sm: "min-h-11 px-3.5 py-2 text-xs sm:text-sm",
  md: "min-h-11 px-5 py-3 text-sm sm:px-6 sm:text-base",
  lg: "min-h-12 px-6 py-4 text-base sm:px-8 sm:text-lg",
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
          "inline-flex items-center justify-center whitespace-nowrap text-center font-mono transition-all duration-200",
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
