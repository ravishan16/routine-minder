import { Trophy, Flame, Star, Award, Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Milestone } from "@shared/schema";

type MilestoneBadgeProps = {
  milestone: Milestone;
  achieved?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
};

const milestoneConfig: Record<Milestone, { icon: typeof Trophy; label: string; color: string }> = {
  7: { icon: Flame, label: "1 Week", color: "text-orange-500 bg-orange-100 dark:bg-orange-900/30" },
  21: { icon: Star, label: "21 Days", color: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30" },
  30: { icon: Award, label: "1 Month", color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
  50: { icon: Trophy, label: "50 Days", color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
  100: { icon: Crown, label: "100 Days", color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
  365: { icon: Sparkles, label: "1 Year", color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30" },
};

export function MilestoneBadge({ milestone, achieved = true, size = "default", className }: MilestoneBadgeProps) {
  const config = milestoneConfig[milestone];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    default: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  const iconSizes = {
    sm: "w-2.5 h-2.5",
    default: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 font-semibold border-0",
        config.color,
        sizeClasses[size],
        !achieved && "opacity-40",
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </Badge>
  );
}

export function getNextMilestone(currentStreak: number): Milestone | null {
  const milestones: Milestone[] = [7, 21, 30, 50, 100, 365];
  return milestones.find(m => m > currentStreak) || null;
}

export function getAchievedMilestones(currentStreak: number): Milestone[] {
  const milestones: Milestone[] = [7, 21, 30, 50, 100, 365];
  return milestones.filter(m => currentStreak >= m);
}
