import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type RoutineCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  testId?: string;
};

export function RoutineCheckbox({ checked, onChange, label, disabled, testId }: RoutineCheckboxProps) {
  return (
    <button
      data-testid={testId}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-4 w-full p-4 rounded-xl transition-all",
        "bg-card border border-card-border",
        "hover-elevate active-elevate-2",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
          checked
            ? "bg-accent border-accent"
            : "border-muted-foreground/40 bg-transparent"
        )}
      >
        {checked && <Check className="w-4 h-4 text-accent-foreground stroke-[3px]" />}
      </div>
      <span
        className={cn(
          "text-base font-medium transition-all text-left",
          checked && "line-through-green text-muted-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
}
