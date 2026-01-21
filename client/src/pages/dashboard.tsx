import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Flame, Trophy, CheckCircle2, Target, Sun, Moon, Share2,
  TrendingUp, Zap, Award, Calendar, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { dashboardApi, routinesApi } from "@/lib/storage";
import { 
  calculateGamificationStats, 
  calculateRoutineStats,
  getPeriodDays, 
  getPeriodLabel,
  getAchievement,
  ACHIEVEMENTS,
  type Period,
  type GamificationStats,
  type RoutineStats
} from "@/lib/achievements";
import type { Routine, Completion } from "@/lib/schema";

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>("7d");

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
  
  // Calculate gamification stats
  const stats: GamificationStats | null = routines.length > 0 || completions.length > 0
    ? calculateGamificationStats(routines, completions, periodDays, savedBestStreak)
    : null;

  // Calculate per-routine stats
  const routineStats: RoutineStats[] = routines
    .filter(r => r.isActive)
    .map(r => calculateRoutineStats(r, completions, periodDays))
    .sort((a, b) => b.completionRate - a.completionRate);

  const handleShare = async () => {
    const shareText = stats 
      ? `🔥 ${stats.currentStreak} day streak | ${stats.level.icon} Level ${stats.level.level} ${stats.level.name} | ${stats.totalCompletions} tasks completed on Routine Minder!`
      : "Check out Routine Minder - a simple habit tracker!";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Routine Minder Stats",
          text: shareText,
          url: window.location.origin,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Stats copied to clipboard!" });
    }
  };

  if (!stats) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
        <Card className="p-8 text-center space-y-4">
          <div className="text-6xl">📊</div>
          <h2 className="text-xl font-semibold">No Data Yet</h2>
          <p className="text-muted-foreground">
            Start completing routines to see your stats and achievements!
          </p>
        </Card>
      </div>
    );
  }

  // Unlocked achievements (show up to 6)
  const unlockedAchievementDetails = stats.unlockedAchievements
    .map(key => getAchievement(key))
    .filter(Boolean)
    .slice(-6);

  // Next achievements to unlock
  const lockedAchievements = ACHIEVEMENTS
    .filter(a => !stats.unlockedAchievements.includes(a.key))
    .slice(0, 3);

  return (
    <div className="p-4 pb-24 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Stats
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["7d", "30d", "1y", "ytd"] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
            className="whitespace-nowrap"
          >
            {getPeriodLabel(p)}
          </Button>
        ))}
      </div>

      {/* Level & XP Hero Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-background border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{stats.level.icon}</div>
            <div>
              <div className="text-sm text-muted-foreground">Level {stats.level.level}</div>
              <div className="text-2xl font-bold">{stats.level.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{stats.totalXP.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total XP</div>
          </div>
        </div>
        {stats.xpToNextLevel > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next Level</span>
              <span className="font-medium">{stats.xpToNextLevel} XP needed</span>
            </div>
            <Progress value={stats.nextLevelProgress} className="h-2" />
          </div>
        )}
        {stats.streakMultiplier.label && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="font-medium text-yellow-600 dark:text-yellow-400">
              {stats.streakMultiplier.label} — {stats.streakMultiplier.multiplier}x XP
            </span>
          </div>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <span className="text-sm text-muted-foreground">Current Streak</span>
          </div>
          <div className="text-3xl font-bold">{stats.currentStreak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            <span className="text-sm text-muted-foreground">Best Streak</span>
          </div>
          <div className="text-3xl font-bold">{stats.bestStreak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <span className="text-sm text-muted-foreground">{getPeriodLabel(period)}</span>
          </div>
          <div className="text-3xl font-bold">{stats.periodCompletions}</div>
          <div className="text-xs text-muted-foreground">completed</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm text-muted-foreground">Completion Rate</span>
          </div>
          <div className="text-3xl font-bold">{stats.completionRate}%</div>
          <div className="text-xs text-muted-foreground">{getPeriodLabel(period).toLowerCase()}</div>
        </Card>
      </div>

      {/* Completion Rate Visual */}
      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            {getPeriodLabel(period)} Progress
          </h2>
          <span className="text-lg font-bold text-primary">{stats.completionRate}%</span>
        </div>
        <Progress value={stats.completionRate} className="h-3" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{stats.periodCompletions} tasks completed</span>
          <span>{stats.perfectDays} perfect days</span>
        </div>
      </Card>

      {/* Achievements Section */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Award className="h-4 w-4" />
            Achievements
          </h2>
          <Badge variant="secondary">
            {stats.unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </Badge>
        </div>

        {unlockedAchievementDetails.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {unlockedAchievementDetails.map((achievement) => (
              <div
                key={achievement!.key}
                className="flex flex-col items-center p-3 rounded-lg bg-primary/5 border border-primary/10"
              >
                <div className="text-2xl mb-1">{achievement!.icon}</div>
                <div className="text-xs font-medium text-center">{achievement!.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Complete tasks to unlock achievements!
          </p>
        )}

        {/* Next achievements to unlock */}
        {lockedAchievements.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Next to unlock:</p>
            <div className="space-y-2">
              {lockedAchievements.map((achievement) => (
                <div
                  key={achievement.key}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <div className="text-xl opacity-50">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{achievement.name}</div>
                    <div className="text-xs text-muted-foreground">{achievement.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Per-Routine Stats */}
      {routineStats.length > 0 && (
        <Card className="p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Routine Performance
          </h2>
          <div className="space-y-3">
            {routineStats.map((routine) => (
              <div key={routine.routineId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{routine.routineIcon}</span>
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {routine.routineName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      🔥 {routine.currentStreak}d
                    </span>
                    <span className="font-medium text-primary">
                      {routine.completionRate}%
                    </span>
                  </div>
                </div>
                <Progress value={routine.completionRate} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Time Category Breakdown */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Time of Day Breakdown</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-3 rounded-lg bg-amber-500/10">
            <div className="text-lg">🌅</div>
            <div className="text-xl font-bold">{stats.amCompletions}</div>
            <div className="text-xs text-muted-foreground">AM</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10">
            <div className="text-lg">☀️</div>
            <div className="text-xl font-bold">{stats.noonCompletions}</div>
            <div className="text-xs text-muted-foreground">NOON</div>
          </div>
          <div className="p-3 rounded-lg bg-indigo-500/10">
            <div className="text-lg">🌙</div>
            <div className="text-xl font-bold">{stats.pmCompletions}</div>
            <div className="text-xs text-muted-foreground">PM</div>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10">
            <div className="text-lg">🕐</div>
            <div className="text-xl font-bold">{stats.allDayCompletions}</div>
            <div className="text-xs text-muted-foreground">ALL</div>
          </div>
        </div>
      </Card>

      {/* Lifetime Stats */}
      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Lifetime Stats</h2>
        <div className="grid grid-cols-3 gap-4 text-center pt-2">
          <div>
            <div className="text-2xl font-bold">{stats.totalCompletions}</div>
            <div className="text-xs text-muted-foreground">Total Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.perfectDays}</div>
            <div className="text-xs text-muted-foreground">Perfect Days</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.unlockedAchievements.length}</div>
            <div className="text-xs text-muted-foreground">Achievements</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
