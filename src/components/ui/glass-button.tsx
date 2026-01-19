import { cn } from "@/lib/utils";
import React from "react";
import { Loader2 } from "lucide-react";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "outline";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95";

        const variants = {
            primary: "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] border-0",
            secondary: "glass-panel hover:bg-white/10 text-white border-white/20",
            outline: "border border-white/30 text-white hover:bg-white/10 hover:border-white/50",
            ghost: "hover:bg-white/5 text-white/80 hover:text-white",
        };

        const sizes = {
            sm: "h-8 px-4 text-xs",
            md: "h-11 px-8 text-sm",
            lg: "h-14 px-10 text-base",
            icon: "h-10 w-10",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
GlassButton.displayName = "GlassButton";
