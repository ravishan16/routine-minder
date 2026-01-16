import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "default" | "lg";
};

export function ProgressBar({ value, max, className, showLabel = true, size = "default" }: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  const heightClass = {
    sm: "h-1.5",
    default: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Daily Progress</span>
          <span className="text-sm font-semibold">{value}/{max}</span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", heightClass[size])}>
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
