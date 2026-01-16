import { Sunrise, Sun, Moon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TimeCategoryBadgeProps = {
  category: string;
  size?: "sm" | "default";
  className?: string;
};

const categoryConfig = {
  AM: { icon: Sunrise, label: "AM", bgClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  NOON: { icon: Sun, label: "Noon", bgClass: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
  PM: { icon: Moon, label: "PM", bgClass: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" },
  ALL: { icon: Clock, label: "All", bgClass: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
};

export function TimeCategoryBadge({ category, size = "default", className }: TimeCategoryBadgeProps) {
  const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.ALL;
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 font-medium border-0",
        config.bgClass,
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        className
      )}
    >
      <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {config.label}
    </Badge>
  );
}
