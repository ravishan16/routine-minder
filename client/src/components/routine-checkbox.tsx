import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type RoutineCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon?: string;
  disabled?: boolean;
  testId?: string;
};

export function RoutineCheckbox({ checked, onChange, label, icon, disabled, testId }: RoutineCheckboxProps) {
  return (
    <button
      data-testid={testId}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-4 w-full p-4 rounded-xl transition-all duration-200",
        "bg-card border border-card-border",
        "hover:shadow-sm active:scale-[0.99]",
        checked && "bg-accent/5 border-accent/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
          checked
            ? "bg-accent border-accent scale-110"
            : "border-muted-foreground/30 bg-transparent"
        )}
      >
        <Check className={cn(
          "w-3.5 h-3.5 text-accent-foreground stroke-[3px] transition-all duration-200",
          checked ? "opacity-100 scale-100" : "opacity-0 scale-50"
        )} />
      </div>
      {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
      <span
        className={cn(
          "text-base font-medium transition-all duration-200 text-left",
          checked && "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
}
