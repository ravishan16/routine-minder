import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Flame, Sun, Moon, Share2, Zap, Award, Calendar, ChevronRight, Trophy,
  TrendingUp, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { dashboardApi, routinesApi } from "@/lib/storage";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { AchievementsModal } from "@/components/achievements-modal";
import {
  getPeriodDays,
  getPeriodLabel,
  getAchievement,
  getAchievementProgress,
  ACHIEVEMENTS,
  type Period,
  type Achievement,
} from "@/lib/achievements";
import {
  calculateGamificationStats,
  calculateRoutineStats,
  type GamificationStats,
  type RoutineStats,
} from "@/lib/stats";
import type { Routine, Completion } from "@/lib/schema";
import html2canvas from "html2canvas";

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>("7d");
  const [isSharing, setIsSharing] = useState(false);
  const statsCardRef = useRef<HTMLDivElement>(null);

  const { data: routines = [] } = useQuery<Routine[]>({
    queryKey: ["routines"],
    queryFn: routinesApi.getAll,
  });

  const { data: completions = [] } = useQuery<Completion[]>({
    queryKey: ["completions-all"],
    queryFn: dashboardApi.getAllCompletions,
  });

  const savedBestStreak = dashboardApi.getBestStreak();
  const periodDays = getPeriodDays(period);

  const stats: GamificationStats | null = routines.length > 0 || completions.length > 0
    ? calculateGamificationStats(routines, completions, periodDays, savedBestStreak)
    : null;

  // Deduplicate routines by ID
  const uniqueRoutineIds = new Set<string>();
  const routineStats: RoutineStats[] = routines
    .filter(r => {
      if (!r.isActive || uniqueRoutineIds.has(r.id)) return false;
      uniqueRoutineIds.add(r.id);
      return true;
    })
    .map(r => calculateRoutineStats(r, completions, periodDays))
    .sort((a, b) => b.completionRate - a.completionRate);

  // Share handlers
  const generateShareImage = async (element: HTMLElement): Promise<Blob | null> => {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
      });
    } catch (error) {
      console.error("Failed to generate image:", error);
      return null;
    }
  };

  const shareImage = async (blob: Blob, filename: string) => {
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My Routine Minder Stats" });
        return true;
      } catch {
        // User cancelled
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Image saved!", description: "Share it from your downloads." });
    return true;
  };

  const handleShareStats = async () => {
    if (!statsCardRef.current || isSharing) return;
    setIsSharing(true);
    const blob = await generateShareImage(statsCardRef.current);
    if (blob) {
      const dateStr = new Date().toISOString().split("T")[0];
      await shareImage(blob, `routine-minder-stats-${dateStr}.png`);
    }
    setIsSharing(false);
  };

  if (!stats) {
    return (
      <div className="p-4 pb-24 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-end">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
        <div className="glass-card p-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-7xl">📊</div>
          <div>
            <h2 className="text-2xl font-bold">No Data Yet</h2>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Start completing routines to see your progress and unlock achievements!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get unlocked and next achievements
  const unlockedAchievementDetails = stats.unlockedAchievements
    .map(key => getAchievement(key))
    .filter(Boolean) as Achievement[];

  const lockedAchievements = ACHIEVEMENTS
    .filter(a => !stats.unlockedAchievements.includes(a.key))
    .slice(0, 3);

  return (
    <div className="p-4 pb-24 space-y-5 max-w-3xl mx-auto">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-muted/40 rounded-lg">
          {(["7d", "30d", "1y", "ytd"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="h-8 px-3 text-xs font-medium"
            >
              {getPeriodLabel(p)}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Stats Overview Card */}
      <div ref={statsCardRef} className="glass-card p-5 space-y-5">
        {/* Level & XP */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Level {stats.level.level}</p>
            <h2 className="text-2xl font-bold text-primary">{stats.level.name}</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.totalXP.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">XP</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Level {stats.level.level + 1}</span>
            <span className="font-medium text-primary">{stats.nextLevelProgress}%</span>
          </div>
          <Progress value={stats.nextLevelProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">{stats.xpToNextLevel} XP remaining</p>
        </div>

        {stats.streakMultiplier.label && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
            <Zap className="h-3.5 w-3.5" />
            {stats.streakMultiplier.label} — {stats.streakMultiplier.multiplier}x XP
          </div>
        )}

        {/* Key Stats Grid */}
        <div className="grid grid-cols-4 gap-3 pt-3 border-t border-border/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-xl font-bold">{stats.currentStreak}</div>
            <p className="text-[10px] text-muted-foreground uppercase">Streak</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold">{stats.completionRate}%</div>
            <p className="text-[10px] text-muted-foreground uppercase">Rate</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold">{stats.totalCompletions}</div>
            <p className="text-[10px] text-muted-foreground uppercase">Tasks</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-xl font-bold">{stats.bestStreak}</div>
            <p className="text-[10px] text-muted-foreground uppercase">Best</p>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Activity</h3>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-0.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-muted/40" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400/40" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            </div>
            <span>More</span>
          </div>
        </div>
        <ActivityHeatmap completions={completions} days={365} />
      </div>

      {/* Achievements Section */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Achievements</h3>
          </div>
          <AchievementsModal unlockedAchievements={stats.unlockedAchievements} stats={stats}>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              {stats.unlockedAchievements.length}/{ACHIEVEMENTS.length}
              <ChevronRight className="h-3 w-3" />
            </Button>
          </AchievementsModal>
        </div>

        {/* Unlocked achievements */}
        {unlockedAchievementDetails.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {unlockedAchievementDetails.slice(-6).map((achievement) => (
              <div
                key={achievement.key}
                className="flex-shrink-0 flex flex-col items-center p-3 w-20 rounded-lg bg-primary/5 border border-primary/10"
              >
                <div className="text-2xl mb-1">{achievement.icon}</div>
                <div className="text-[10px] font-medium text-center leading-tight line-clamp-2">{achievement.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Next to unlock */}
        {lockedAchievements.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border/30">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Next to unlock</p>
            {lockedAchievements.map((achievement) => {
              const progressData = getAchievementProgress(achievement, stats);
              return (
                <div key={achievement.key} className="flex items-center gap-3">
                  <div className="text-lg grayscale opacity-40">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium truncate">{achievement.name}</span>
                      <span className="text-[10px] text-muted-foreground">{progressData.remaining} left</span>
                    </div>
                    <Progress value={progressData.progress} className="h-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Time of Day Stats */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Time of Day</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.amCompletions}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Morning</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.noonCompletions}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Noon</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.pmCompletions}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Evening</p>
          </div>
        </div>
      </div>

      {/* Routine Performance */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Routine Performance</h3>
        <div className="space-y-3">
          {routineStats.map((routine) => (
            <div
              key={routine.routineId}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
            >
              <div className="text-2xl flex-shrink-0">{routine.routineIcon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-medium text-sm truncate">{routine.routineName}</span>
                  <span className="font-bold text-primary">{routine.completionRate}%</span>
                </div>
                <Progress value={routine.completionRate} className="h-1.5" />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    🔥 {routine.currentStreak} day streak
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {routine.totalCompletions} total
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleShareStats}
          disabled={isSharing}
        >
          <Share2 className="w-4 h-4" />
          {isSharing ? "Generating..." : "Share Stats"}
        </Button>
      </div>
    </div>
  );
}
