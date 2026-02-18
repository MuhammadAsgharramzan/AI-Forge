import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepsProps {
    steps: string[];
    currentStep: number;
    className?: string;
}

export function Steps({ steps, currentStep, className }: StepsProps) {
    return (
        <div className={cn("flex w-full items-center justify-between", className)}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                    <div key={step} className="flex flex-col items-center flex-1">
                        <div className="relative flex items-center justify-center">
                            {/* Line connector */}
                            {index !== 0 && (
                                <div
                                    className={cn(
                                        "absolute right-[50%] top-1/2 h-[2px] w-[200%] -translate-y-1/2 -z-10",
                                        index <= currentStep ? "bg-primary" : "bg-muted"
                                    )}
                                    style={{ right: "50%", width: "100vw", maxWidth: "calc(100% - 2rem)" }} // Hacky connection line
                                />
                            )}

                            <div
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                                    isCompleted
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : isCurrent
                                            ? "border-primary text-primary"
                                            : "border-muted text-muted-foreground"
                                )}
                            >
                                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                            </div>
                        </div>
                        <span
                            className={cn(
                                "mt-2 text-xs font-medium uppercase tracking-wider",
                                isCurrent ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {step}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
