import { useState } from "react";
import { Award, Lock, CheckCircle2, X, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ACHIEVEMENTS,
  getAchievementProgress,
  type Achievement,
  type Level,
} from "@/lib/achievements";

interface AchievementsModalProps {
  unlockedAchievements: string[];
  stats: {
    currentStreak: number;
    bestStreak: number;
    totalCompletions: number;
    totalPerfectDays: number;
    amCompletions: number;
    noonCompletions: number;
    pmCompletions: number;
    level: Level;
  };
  children: React.ReactNode;
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  streak: { label: "Streaks", color: "text-orange-500" },
  completion: { label: "Completions", color: "text-emerald-500" },
  perfect_day: { label: "Perfect Days", color: "text-yellow-500" },
  time_category: { label: "Time of Day", color: "text-blue-500" },
  level: { label: "Levels", color: "text-purple-500" },
};

export function AchievementsModal({ unlockedAchievements, stats, children }: AchievementsModalProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  // Group achievements by type
  const groupedAchievements = ACHIEVEMENTS.reduce((acc, achievement) => {
    const type = achievement.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const filteredTypes = filter ? [filter] : Object.keys(groupedAchievements);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Award className="h-6 w-6 text-primary" />
              All Achievements
            </DialogTitle>
            <Badge variant="secondary" className="text-sm">
              {unlockedAchievements.length} / {ACHIEVEMENTS.length} Unlocked
            </Badge>
          </div>
        </DialogHeader>

        {/* Filter tabs */}
        <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
          <Button
            variant={filter === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter(null)}
            className="text-xs whitespace-nowrap"
          >
            All
          </Button>
          {Object.keys(categoryLabels).map((type) => (
            <Button
              key={type}
              variant={filter === type ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter(type)}
              className={cn("text-xs whitespace-nowrap", filter === type && categoryLabels[type].color)}
            >
              {categoryLabels[type]?.label || type}
            </Button>
          ))}
        </div>

        {/* Achievements list */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
          {filteredTypes.map((type) => {
            const achievements = groupedAchievements[type];
            if (!achievements) return null;

            return (
              <div key={type}>
                <h3 className={cn("text-sm font-semibold uppercase tracking-wider mb-3", categoryLabels[type]?.color || "text-muted-foreground")}>
                  {categoryLabels[type]?.label || type}
                </h3>
                <div className="space-y-2">
                  {achievements.map((achievement) => {
                    const isUnlocked = unlockedAchievements.includes(achievement.key);
                    const progressData = getAchievementProgress(achievement, stats);

                    return (
                      <div
                        key={achievement.key}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-all",
                          isUnlocked
                            ? "bg-primary/5 border-primary/20"
                            : "bg-muted/30 border-transparent hover:bg-muted/40"
                        )}
                      >
                        <div className={cn(
                          "text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl",
                          isUnlocked ? "bg-primary/10" : "bg-muted/50 grayscale opacity-50"
                        )}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("font-semibold", isUnlocked ? "text-foreground" : "text-muted-foreground")}>
                              {achievement.name}
                            </span>
                            {isUnlocked && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                          {!isUnlocked && (
                            <div className="flex items-center gap-3">
                              <Progress value={progressData.progress} className="h-1.5 flex-1" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {progressData.progressLabel}
                              </span>
                            </div>
                          )}
                        </div>
                        {isUnlocked ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                            Unlocked
                          </Badge>
                        ) : (
                          <div className="text-right">
                            <div className="text-sm font-medium text-muted-foreground">
                              {progressData.remaining} left
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
