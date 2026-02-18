import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "accent";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                {
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80":
                        variant === "default",
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80":
                        variant === "secondary",
                    "border-transparent bg-red-500 text-white hover:bg-red-600":
                        variant === "destructive",
                    "text-foreground": variant === "outline",
                    "border-transparent bg-green-500 text-black hover:bg-green-600":
                        variant === "accent",
                },
                className
            )}
            {...props}
        />
    );
}

export { Badge };
