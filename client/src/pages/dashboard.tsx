import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, CheckCircle2, Target, TrendingUp, Calendar, Sun, Moon, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { ShareDashboardButton, ShareRoutineButton } from "@/components/share-card";
import { MilestoneBadge, getAchievedMilestones, getNextMilestone } from "@/components/milestone-badge";
import { ProgressBar } from "@/components/progress-bar";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { DashboardStats, RoutineStats } from "@shared/schema";

const timeRanges = [
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "1y", label: "1 Year" },
  { id: "ytd", label: "Year to Date" },
  { id: "all", label: "All Time" },
];

export default function DashboardPage() {
  const [selectedRange, setSelectedRange] = useState("7d");
  const { theme, toggleTheme } = useTheme();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard", selectedRange],
  });

  const { data: routineStats, isLoading: routineStatsLoading } = useQuery<RoutineStats[]>({
    queryKey: ["/api/dashboard/routines", selectedRange],
  });

  const getMotivationalMessage = (rate: number) => {
    if (rate >= 90) return "Outstanding! You're crushing it!";
    if (rate >= 70) return "Great work! Keep the momentum going!";
    if (rate >= 50) return "You're building momentum!";
    if (rate >= 25) return "Every day is a fresh start!";
    return "Start small, dream big!";
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            {stats && <ShareDashboardButton stats={stats} />}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {timeRanges.map((range) => (
            <Button
              key={range.id}
              variant={selectedRange === range.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange(range.id)}
              className="whitespace-nowrap flex-shrink-0"
              data-testid={`button-range-${range.id}`}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-6">
        {statsLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Flame}
                iconColor="text-orange-500"
                iconBgColor="bg-orange-100 dark:bg-orange-900/30"
                value={stats.currentStreak}
                label="Current Streak"
              />
              <StatCard
                icon={Trophy}
                iconColor="text-amber-500"
                iconBgColor="bg-amber-100 dark:bg-amber-900/30"
                value={stats.longestStreak}
                label="Longest Streak"
              />
              <StatCard
                icon={CheckCircle2}
                iconColor="text-accent"
                iconBgColor="bg-accent/10"
                value={stats.completedCount}
                label="Completed"
              />
              <StatCard
                icon={Target}
                iconColor="text-primary"
                iconBgColor="bg-primary/10"
                value={stats.totalTasks}
                label="Total Tasks"
              />
            </div>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-accent" />
                <span className="font-semibold">Completion Rate</span>
              </div>
              <div className="flex items-end justify-between mb-3">
                <span className="text-4xl font-bold">{stats.completionRate}%</span>
                <span className="text-sm text-muted-foreground">
                  {stats.completedCount} of {stats.totalTasks} tasks
                </span>
              </div>
              <ProgressBar
                value={stats.completedCount}
                max={stats.totalTasks}
                showLabel={false}
                size="lg"
              />
              <p className="text-sm text-muted-foreground mt-3">
                {getMotivationalMessage(stats.completionRate)}
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-semibold">Period Summary</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.periodLabel}: You've completed <strong>{stats.completedCount}</strong> out of{" "}
                <strong>{stats.totalTasks}</strong> routine tasks.
              </p>
            </Card>
          </>
        ) : null}

        {routineStatsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : routineStats && routineStats.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold mb-3">Routine Streaks</h2>
            <div className="space-y-3">
              {routineStats.map((rs) => {
                const nextMilestone = getNextMilestone(rs.currentStreak);
                const achievedMilestones = getAchievedMilestones(rs.currentStreak);

                return (
                  <Card key={rs.routineId} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{rs.routineName}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            {rs.currentStreak} day{rs.currentStreak !== 1 ? "s" : ""}
                          </span>
                          <span>Best: {rs.longestStreak}</span>
                        </div>
                      </div>
                      <ShareRoutineButton routineStats={rs} />
                    </div>
                    
                    {achievedMilestones.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {achievedMilestones.map((m) => (
                          <MilestoneBadge key={m} milestone={m} size="sm" />
                        ))}
                      </div>
                    )}
                    
                    {nextMilestone && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Next milestone</span>
                          <span>{nextMilestone - rs.currentStreak} days to go</span>
                        </div>
                        <div className="mt-1.5">
                          <ProgressBar
                            value={rs.currentStreak}
                            max={nextMilestone}
                            showLabel={false}
                            size="sm"
                          />
                        </div>
                        <div className="mt-1.5">
                          <MilestoneBadge milestone={nextMilestone} achieved={false} size="sm" />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
