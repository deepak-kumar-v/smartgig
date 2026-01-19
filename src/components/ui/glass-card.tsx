import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "heavy" | "hoverable";
    active?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, variant = "default", active = false, children, ...props }, ref) => {
        const variants = {
            default: "glass-panel rounded-2xl",
            heavy: "glass-panel-heavy rounded-3xl",
            hoverable: "glass-panel glass-card-hover rounded-2xl cursor-pointer",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    variants[variant],
                    active && "border-indigo-500/50 shadow-indigo-500/20 bg-white/10",
                    "relative overflow-hidden",
                    className
                )}
                {...props}
            >
                {/* Shine Effect Layer */}
                {variant === "hoverable" && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10 pointer-events-none" />
                )}
                <div className="relative z-0">
                    {children}
                </div>
            </div>
        );
    }
);
GlassCard.displayName = "GlassCard";
