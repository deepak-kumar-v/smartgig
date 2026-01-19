import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const GlassTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white placeholder:text-white/30 backdrop-blur-md transition-all duration-300 focus:bg-white/10 focus:border-white/20",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
GlassTextarea.displayName = "GlassTextarea"

export { GlassTextarea }
