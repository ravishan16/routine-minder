import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Flame, Trophy, CheckCircle2, Target, Sun, Moon, Share2,
  TrendingUp, Zap, Award, Calendar, Download
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
  getAchievementProgress,
  ACHIEVEMENTS,
  type Period,
  type GamificationStats,
  type RoutineStats,
  type Achievement,
  type AchievementProgress
} from "@/lib/achievements";
import type { Routine, Completion } from "@/lib/schema";
import html2canvas from "html2canvas";

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>("7d");
  const [isSharing, setIsSharing] = useState(false);
  
  // Refs for shareable elements
  const statsCardRef = useRef<HTMLDivElement>(null);
  const achievementCardRef = useRef<HTMLDivElement>(null);

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

  // Generate shareable image from element
  const generateShareImage = async (element: HTMLElement): Promise<Blob | null> => {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
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

  // Share image (uses Web Share API if available, otherwise downloads)
  const shareImage = async (blob: Blob, filename: string) => {
    const file = new File([blob], filename, { type: "image/png" });
    
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "My Routine Minder Stats",
        });
        return true;
      } catch {
        // User cancelled or share failed
      }
    }
    
    // Fallback: download image
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Image saved!", description: "Share it from your downloads." });
    return true;
  };

  // Share overall stats
  const handleShareStats = async () => {
    if (!statsCardRef.current || isSharing) return;
    setIsSharing(true);
    
    const blob = await generateShareImage(statsCardRef.current);
    if (blob) {
      await shareImage(blob, `routine-minder-stats-${new Date().toISOString().split("T")[0]}.png`);
    }
    setIsSharing(false);
  };

  // Share specific achievement
  const handleShareAchievement = async (achievement: Achievement) => {
    setIsSharing(true);
    
    // Create a temporary element for this achievement
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.padding = "24px";
    tempDiv.style.background = theme === "dark" ? "#1a1a1a" : "#ffffff";
    tempDiv.style.borderRadius = "16px";
    tempDiv.style.minWidth = "280px";
    tempDiv.style.textAlign = "center";
    tempDiv.style.fontFamily = "system-ui, -apple-system, sans-serif";
    
    tempDiv.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 16px;">${achievement.icon}</div>
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px; color: ${theme === "dark" ? "#fff" : "#000"};">${achievement.name}</div>
      <div style="font-size: 14px; color: ${theme === "dark" ? "#888" : "#666"}; margin-bottom: 16px;">${achievement.description}</div>
      <div style="font-size: 12px; color: ${theme === "dark" ? "#f97316" : "#ea580c"}; font-weight: 500;">🏆 Achievement Unlocked!</div>
      <div style="font-size: 11px; color: ${theme === "dark" ? "#666" : "#999"}; margin-top: 12px;">routine-minder.pages.dev</div>
    `;
    
    document.body.appendChild(tempDiv);
    const blob = await generateShareImage(tempDiv);
    document.body.removeChild(tempDiv);
    
    if (blob) {
      await shareImage(blob, `achievement-${achievement.key}.png`);
    }
    setIsSharing(false);
  };

  // Share routine stats
  const handleShareRoutine = async (routine: RoutineStats) => {
    setIsSharing(true);
    
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.padding = "24px";
    tempDiv.style.background = theme === "dark" ? "#1a1a1a" : "#ffffff";
    tempDiv.style.borderRadius = "16px";
    tempDiv.style.minWidth = "300px";
    tempDiv.style.fontFamily = "system-ui, -apple-system, sans-serif";
    
    tempDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <span style="font-size: 48px;">${routine.routineIcon}</span>
        <div>
          <div style="font-size: 20px; font-weight: bold; color: ${theme === "dark" ? "#fff" : "#000"};">${routine.routineName}</div>
          <div style="font-size: 14px; color: ${theme === "dark" ? "#888" : "#666"};">My Routine Stats</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
        <div style="padding: 16px; background: ${theme === "dark" ? "#2a2a2a" : "#f5f5f5"}; border-radius: 12px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: ${theme === "dark" ? "#f97316" : "#ea580c"};">🔥 ${routine.currentStreak}</div>
          <div style="font-size: 12px; color: ${theme === "dark" ? "#888" : "#666"};">Day Streak</div>
        </div>
        <div style="padding: 16px; background: ${theme === "dark" ? "#2a2a2a" : "#f5f5f5"}; border-radius: 12px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: ${theme === "dark" ? "#22c55e" : "#16a34a"};">${routine.completionRate}%</div>
          <div style="font-size: 12px; color: ${theme === "dark" ? "#888" : "#666"};">Completion</div>
        </div>
      </div>
      <div style="font-size: 11px; color: ${theme === "dark" ? "#666" : "#999"}; text-align: center;">routine-minder.pages.dev</div>
    `;
    
    document.body.appendChild(tempDiv);
    const blob = await generateShareImage(tempDiv);
    document.body.removeChild(tempDiv);
    
    if (blob) {
      await shareImage(blob, `routine-${routine.routineName.toLowerCase().replace(/\s+/g, "-")}.png`);
    }
    setIsSharing(false);
  };

  // Share milestone progress
  const handleShareMilestone = async (progressData: AchievementProgress) => {
    setIsSharing(true);
    
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.padding = "24px";
    tempDiv.style.background = theme === "dark" ? "#1a1a1a" : "#ffffff";
    tempDiv.style.borderRadius = "16px";
    tempDiv.style.minWidth = "300px";
    tempDiv.style.textAlign = "center";
    tempDiv.style.fontFamily = "system-ui, -apple-system, sans-serif";
    
    const progressColor = theme === "dark" ? "#f97316" : "#ea580c";
    const bgColor = theme === "dark" ? "#2a2a2a" : "#f0f0f0";
    
    tempDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 12px; filter: grayscale(0.5); opacity: 0.8;">${progressData.achievement.icon}</div>
      <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px; color: ${theme === "dark" ? "#fff" : "#000"};">${progressData.achievement.name}</div>
      <div style="font-size: 13px; color: ${theme === "dark" ? "#888" : "#666"}; margin-bottom: 16px;">${progressData.achievement.description}</div>
      <div style="background: ${bgColor}; border-radius: 8px; height: 12px; overflow: hidden; margin-bottom: 8px;">
        <div style="background: ${progressColor}; height: 100%; width: ${progressData.progress}%; border-radius: 8px;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: ${theme === "dark" ? "#888" : "#666"};">
        <span>${progressData.progressLabel}</span>
        <span>${progressData.remaining} to go</span>
      </div>
      <div style="font-size: 13px; color: ${progressColor}; font-weight: 500; margin-top: 16px;">🎯 Working toward this milestone!</div>
      <div style="font-size: 11px; color: ${theme === "dark" ? "#666" : "#999"}; margin-top: 12px;">routine-minder.pages.dev</div>
    `;
    
    document.body.appendChild(tempDiv);
    const blob = await generateShareImage(tempDiv);
    document.body.removeChild(tempDiv);
    
    if (blob) {
      await shareImage(blob, `milestone-${progressData.achievement.key}.png`);
    }
    setIsSharing(false);
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

      {/* Level & XP Hero Card - Shareable */}
      <Card ref={statsCardRef} className="p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-background border-primary/20">
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
        {/* Share Stats Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4 w-full" 
          onClick={handleShareStats}
          disabled={isSharing}
        >
          <Share2 className="h-4 w-4 mr-2" />
          {isSharing ? "Generating..." : "Share Stats"}
        </Button>
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
      <Card ref={achievementCardRef} className="p-4 space-y-4">
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
              <button
                key={achievement!.key}
                onClick={() => handleShareAchievement(achievement!)}
                disabled={isSharing}
                className="flex flex-col items-center p-3 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 hover:border-primary/20 transition-colors cursor-pointer"
              >
                <div className="text-2xl mb-1">{achievement!.icon}</div>
                <div className="text-xs font-medium text-center">{achievement!.name}</div>
                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Share2 className="h-2.5 w-2.5" /> Share
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Complete tasks to unlock achievements!
          </p>
        )}

        {/* Next achievements to unlock */}
        {lockedAchievements.length > 0 && stats && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-3">Next milestones:</p>
            <div className="space-y-3">
              {lockedAchievements.map((achievement) => {
                const progressData = getAchievementProgress(achievement, {
                  currentStreak: stats.currentStreak,
                  bestStreak: stats.bestStreak,
                  totalCompletions: stats.totalCompletions,
                  totalPerfectDays: stats.totalPerfectDays,
                  amCompletions: stats.amCompletions,
                  noonCompletions: stats.noonCompletions,
                  pmCompletions: stats.pmCompletions,
                  level: stats.level,
                });
                
                return (
                  <button
                    key={achievement.key}
                    onClick={() => handleShareMilestone(progressData)}
                    disabled={isSharing}
                    className="w-full p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-border transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-xl grayscale opacity-60">{achievement.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground">{achievement.description}</div>
                      </div>
                      <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <Progress value={progressData.progress} className="h-2" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{progressData.progressLabel}</span>
                        <span>{progressData.remaining} to go</span>
                      </div>
                    </div>
                  </button>
                );
              })}
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
              <button
                key={routine.routineId}
                onClick={() => handleShareRoutine(routine)}
                disabled={isSharing}
                className="w-full space-y-2 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{routine.routineIcon}</span>
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {routine.routineName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      🔥 {routine.currentStreak}d
                    </span>
                    <span className="font-medium text-primary">
                      {routine.completionRate}%
                    </span>
                    <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                <Progress value={routine.completionRate} className="h-1.5" />
              </button>
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
            <div className="text-2xl font-bold">{stats.totalPerfectDays}</div>
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
