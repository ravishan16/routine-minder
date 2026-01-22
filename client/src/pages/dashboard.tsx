import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Flame, Trophy, CheckCircle2, Target, Sun, Moon, Share2,
  TrendingUp, Zap, Award, Calendar, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { dashboardApi, routinesApi } from "@/lib/storage";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import {
  getPeriodDays,
  getPeriodLabel,
  getAchievement,
  getAchievementProgress,
  getNextStreakMilestone,
  ACHIEVEMENTS,
  type Period,
  type Achievement,
  type AchievementProgress
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

  // Share overall stats using the Bento Grid Card
  const handleShareStats = async () => {
    if (!statsCardRef.current || isSharing) return;
    setIsSharing(true);

    const blob = await generateShareImage(statsCardRef.current);
    if (blob) {
      await shareImage(blob, `routine-minder-stats-${new Date().toISOString().split("T")[0]}.png`);
    }
    setIsSharing(false);
  };

  // Share specific achievement - Instagram Story Style
  const handleShareAchievement = async (achievement: Achievement) => {
    setIsSharing(true);

    const tempDiv = document.createElement("div");
    Object.assign(tempDiv.style, {
      position: "absolute",
      left: "-9999px",
      width: "1080px",
      height: "1920px", // Instagram Story Aspect Ratio
      padding: "120px 80px",
      background: "linear-gradient(135deg, #FF6B6B 0%, #E0F2FE 100%)", // Coral to soft blue
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#1f2937"
    });

    if (theme === "dark") {
      tempDiv.style.background = "linear-gradient(135deg, #18181b 0%, #27272a 100%)";
      tempDiv.style.color = "#ffffff";
    }

    tempDiv.innerHTML = `
      <div style="
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(20px);
        padding: 80px;
        border-radius: 48px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        text-align: center;
      ">
        <div style="font-size: 180px; margin-bottom: 40px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));">${achievement.icon}</div>
        <div style="
          font-size: 24px; 
          text-transform: uppercase; 
          letter-spacing: 4px; 
          font-weight: 600; 
          margin-bottom: 20px; 
          opacity: 0.8;
        ">Achievement Unlocked</div>
        <div style="
          font-size: 64px; 
          font-weight: 800; 
          margin-bottom: 24px; 
          line-height: 1.1;
          background: linear-gradient(to right, #FF6B6B, #F97316);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent; 
          ${theme === "dark" ? "background: linear-gradient(to right, #fb7185, #a78bfa);" : ""}
        ">${achievement.name}</div>
        <div style="
          font-size: 32px; 
          opacity: 0.9; 
          line-height: 1.5; 
          max-width: 80%;
        ">${achievement.description}</div>
      </div>
      
      <div style="margin-top: auto; display: flex; align-items: center; gap: 24px; opacity: 0.8;">
        <div style="font-size: 48px;">✨</div>
        <div style="font-size: 36px; font-weight: 600;">Routine Minder</div>
      </div>
    `;

    document.body.appendChild(tempDiv);
    const blob = await generateShareImage(tempDiv);
    document.body.removeChild(tempDiv);

    if (blob) {
      await shareImage(blob, `achievement-${achievement.key}.png`);
    }
    setIsSharing(false);
  };

  // Share routine stats - Instagram Story Style
  const handleShareRoutine = async (routine: RoutineStats) => {
    setIsSharing(true);

    const tempDiv = document.createElement("div");
    Object.assign(tempDiv.style, {
      position: "absolute",
      left: "-9999px",
      width: "1080px",
      height: "1920px",
      padding: "120px",
      background: theme === "dark"
        ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
        : "linear-gradient(135deg, #fff1f2 0%, #dbeafe 100%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      fontFamily: "Inter, system-ui, sans-serif",
      color: theme === "dark" ? "#fff" : "#1f2937"
    });

    const cardBg = theme === "dark" ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)";
    const border = theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.5)";

    tempDiv.innerHTML = `
        <div>
          <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 60px;">
             <span style="font-size: 48px;">📊</span>
             <span style="font-size: 36px; font-weight: 600; opacity: 0.7;">Routine Stats</span>
          </div>

          <div style="font-size: 160px; margin-bottom: 40px; text-align: center; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.15));">${routine.routineIcon}</div>
          <h1 style="font-size: 80px; font-weight: 800; text-align: center; margin-bottom: 80px; line-height: 1.1;">${routine.routineName}</h1>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div style="
              background: ${cardBg};
              backdrop-filter: blur(20px);
              padding: 60px 40px;
              border-radius: 40px;
              border: 2px solid ${border};
              text-align: center;
              box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
            ">
              <div style="font-size: 96px; font-weight: 800; color: #f97316; margin-bottom: 16px;">${routine.currentStreak}</div>
              <div style="font-size: 32px; font-weight: 600; opacity: 0.7;">Day Streak</div>
            </div>
            
            <div style="
               background: ${cardBg};
               backdrop-filter: blur(20px);
               padding: 60px 40px;
               border-radius: 40px;
               border: 2px solid ${border};
               text-align: center;
               box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
             ">
               <div style="font-size: 96px; font-weight: 800; color: #22c55e; margin-bottom: 16px;">${routine.completionRate}%</div>
               <div style="font-size: 32px; font-weight: 600; opacity: 0.7;">Consistency</div>
             </div>
          </div>
        </div>
        
        <div style="text-align: center; font-size: 32px; opacity: 0.6; font-weight: 500;">
           Build better habits with Routine Minder
        </div>
      `;

    document.body.appendChild(tempDiv);
    const blob = await generateShareImage(tempDiv);
    document.body.removeChild(tempDiv);

    if (blob) {
      await shareImage(blob, `routine-${routine.routineName.toLowerCase().replace(/\s+/g, "-")}.png`);
    }
    setIsSharing(false);
  };

  // Share Milestone - Instagram Story Style
  const handleShareMilestone = async (progressData: AchievementProgress) => {
    setIsSharing(true);

    const tempDiv = document.createElement("div");
    Object.assign(tempDiv.style, {
      position: "absolute",
      left: "-9999px",
      width: "1080px",
      height: "1920px",
      padding: "120px 80px",
      background: theme === "dark"
        ? "linear-gradient(to bottom, #0f172a, #334155)"
        : "linear-gradient(to bottom, #f0f9ff, #e0f2fe)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      color: theme === "dark" ? "#ffffff" : "#0f172a"
    });

    const cardBg = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)";

    tempDiv.innerHTML = `
        <div style="
          background: ${cardBg};
          backdrop-filter: blur(20px);
          border-radius: 60px;
          padding: 100px 60px;
          width: 100%;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.3);
        ">
           <div style="font-size: 32px; font-weight: 700; text-transform: uppercase; letter-spacing: 4px; opacity: 0.6; margin-bottom: 60px;">Next Milestone</div>
           
           <div style="font-size: 160px; margin-bottom: 40px; filter: grayscale(1) opacity(0.5);">${progressData.achievement.icon}</div>
           
           <div style="font-size: 64px; font-weight: 800; margin-bottom: 24px;">${progressData.achievement.name}</div>
           
           <div style="height: 32px; background: rgba(128,128,128,0.2); border-radius: 16px; margin: 60px 0; overflow: hidden;">
             <div style="height: 100%; width: ${progressData.progress}%; background: #3b82f6; border-radius: 16px;"></div>
           </div>
           
           <div style="font-size: 40px; font-weight: 600; color: #3b82f6; margin-bottom: 20px;">${progressData.remaining} to go</div>
           <div style="font-size: 32px; opacity: 0.7;">Usually unlocked in a few days!</div>
        </div>
        
        <div style="margin-top: 100px; font-size: 36px; font-weight: 600; opacity: 0.8;">Routine Minder</div>
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
        <div className="glass-card p-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-8xl animate-bounce">📊</div>
          <div>
            <h2 className="text-2xl font-bold">No Data Yet</h2>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Start completing routines to see your visual breakdown and unlock achievements!
            </p>
          </div>
        </div>
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
    <div className="p-4 pb-24 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your progress at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
            {(["7d", "30d", "1y", "ytd"] as Period[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPeriod(p)}
                className="h-8 px-3 text-xs"
              >
                {getPeriodLabel(p)}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme} className="h-10 w-10">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-min">

        {/* Main Stats Card - Spans 2 cols on md */}
        <div ref={statsCardRef} className="glass-card md:col-span-2 p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Level {stats.level.level}</span>
                <h2 className="text-3xl font-bold text-primary">{stats.level.name}</h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tracking-tight">{stats.totalXP.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total XP</div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Progress to Level {stats.level.level + 1}</span>
                <span className="text-primary">{stats.nextLevelProgress}%</span>
              </div>
              <Progress value={stats.nextLevelProgress} className="h-2.5 bg-primary/20" />
              <p className="text-xs text-muted-foreground text-right">{stats.xpToNextLevel} XP remaining</p>
            </div>
          </div>

          {stats.streakMultiplier.label && (
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm font-medium w-fit">
              <Zap className="h-4 w-4" />
              {stats.streakMultiplier.label} — {stats.streakMultiplier.multiplier}x Multiplier Active
            </div>
          )}
        </div>

        {/* Current Steak */}
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-3 bg-orange-500/10 rounded-full mb-2">
            <Flame className="h-8 w-8 text-orange-500 text-shadow-sm" />
          </div>
          <div className="text-4xl font-bold tracking-tight">{stats.currentStreak}</div>
          <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
        </div>

        {/* Completion Rate */}
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-2">
          <div className="relative flex items-center justify-center">
            <svg className="h-20 w-20 transform -rotate-90">
              <circle className="text-muted/20" strokeWidth="8" stroke="currentColor" fill="transparent" r="32" cx="40" cy="40" />
              <circle
                className="text-primary transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={200}
                strokeDashoffset={200 - (200 * stats.completionRate / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="32" cx="40" cy="40"
              />
            </svg>
            <span className="absolute text-xl font-bold">{stats.completionRate}%</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
        </div>

        {/* Activity Heatmap - Spans Full Width */}
        <div className="glass-card md:col-span-4 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Activity Log</h3>
          </div>
          <ActivityHeatmap completions={completions} days={365} />
        </div>

        {/* Key Metrics Row */}
        <div className="glass-card md:col-span-2 p-6 flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">{stats.totalCompletions}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Tasks Done</div>
          </div>
          <div className="w-px h-12 bg-border"></div>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">{stats.totalPerfectDays}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Perfect Days</div>
          </div>
          <div className="w-px h-12 bg-border"></div>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">{stats.bestStreak}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Best Streak</div>
          </div>
        </div>

        {/* Time Breakdown */}
        <div className="glass-card md:col-span-2 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sun className="h-4 w-4" /> Time of Day
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 rounded-lg bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
              <span className="text-xs text-muted-foreground mb-1">Morning</span>
              <span className="font-bold text-lg">{stats.amCompletions}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors">
              <span className="text-xs text-muted-foreground mb-1">Noon</span>
              <span className="font-bold text-lg">{stats.noonCompletions}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
              <span className="text-xs text-muted-foreground mb-1">Evening</span>
              <span className="font-bold text-lg">{stats.pmCompletions}</span>
            </div>
          </div>
        </div>

        {/* Achievements - Spans 2 */}
        <div ref={achievementCardRef} className="glass-card md:col-span-2 p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm pb-2 z-10">
            <h3 className="font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Achievements
            </h3>
            <Badge variant="outline">{stats.unlockedAchievements.length} / {ACHIEVEMENTS.length}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {unlockedAchievementDetails.map((achievement) => (
              <button
                key={achievement!.key}
                onClick={() => handleShareAchievement(achievement!)}
                disabled={isSharing}
                className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <div className="text-3xl mb-2 filter drop-shadow-sm">{achievement!.icon}</div>
                <div className="text-xs font-bold text-center line-clamp-1">{achievement!.name}</div>
              </button>
            ))}
            {Array.from({ length: Math.max(0, 6 - unlockedAchievementDetails.length) }).map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/20 border border-dashed border-muted">
                <div className="text-2xl opacity-20 grayscale">🏆</div>
              </div>
            ))}
          </div>

          {listLockedAchievements(lockedAchievements, stats)}
        </div>

        {/* Routine Detail List - Spans 2 */}
        <div className="glass-card md:col-span-2 p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          <h3 className="font-semibold sticky top-0 bg-background/80 backdrop-blur-sm pb-2 z-10">Routine Performance</h3>
          <div className="space-y-3">
            {routineStats.map(routine => (
              <div
                key={routine.routineId}
                className="group relative flex items-center gap-4 p-3 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/50"
              >
                <div className="text-2xl p-2 bg-muted/30 rounded-lg group-hover:scale-110 transition-transform">
                  {routine.routineIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold truncate">{routine.routineName}</span>
                    <span className="font-bold text-primary">{routine.completionRate}%</span>
                  </div>
                  <Progress value={routine.completionRate} className="h-1.5" />
                  <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">🔥 {routine.currentStreak} day streak</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground"
                      onClick={() => handleShareRoutine(routine)}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Share */}
      <div className="flex justify-center pt-8">
        <Button
          variant="outline"
          size="lg"
          className="shadow-sm hover:shadow-md transition-all gap-2"
          onClick={handleShareStats}
          disabled={isSharing}
        >
          <Share2 className="w-4 h-4" />
          {isSharing ? "Generating..." : "Share Dashboard Overview"}
        </Button>
      </div>
    </div>
  );
}

// Helper component for locked achievements needed to be inside or outside. 
function listLockedAchievements(locked: Achievement[], stats: GamificationStats) {
  if (locked.length === 0) return null;

  return (
    <div className="pt-4 border-t border-border/50">
      <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Up Next</p>
      <div className="space-y-3">
        {locked.map((achievement) => {
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
            <div key={achievement.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="text-2xl grayscale opacity-40">{achievement.icon}</div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-muted-foreground">{achievement.name}</span>
                  <span className="text-muted-foreground">{progressData.remaining} left</span>
                </div>
                <Progress value={progressData.progress} className="h-1.5 opacity-70" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
