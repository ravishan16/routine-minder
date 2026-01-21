import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, CheckCircle2, Target, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { ProgressBar } from "@/components/progress-bar";
import { useTheme } from "@/components/theme-provider";
import { dashboardApi, routinesApi } from "@/lib/storage";
import type { Dashboard } from "@/lib/schema";

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();

  const { data: stats, isLoading } = useQuery<Dashboard>({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get(),
  });

  const { data: routines } = useQuery({
    queryKey: ["routines"],
    queryFn: routinesApi.getAll,
  });

  const getMotivationalMessage = (rate: number) => {
    if (rate >= 90) return "Outstanding! You're crushing it!";
    if (rate >= 70) return "Great work! Keep the momentum going!";
    if (rate >= 50) return "You're building momentum!";
    if (rate >= 25) return "Every day is a fresh start!";
    return "Start small, dream big!";
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const completionRate = stats?.totalToday
    ? Math.round((stats.completedToday / stats.totalToday) * 100)
    : 0;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Motivational Message */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <p className="text-lg font-medium text-center">
          {getMotivationalMessage(stats?.weeklyCompletionRate || 0)}
        </p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Flame}
          iconColor="text-orange-500"
          iconBgColor="bg-orange-500/10"
          label="Current Streak"
          value={`${stats?.currentStreak || 0} days`}
        />
        <StatCard
          icon={Trophy}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
          label="Best Streak"
          value={`${stats?.bestStreak || 0} days`}
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          label="Completed Today"
          value={`${stats?.completedToday || 0}/${stats?.totalToday || 0}`}
        />
        <StatCard
          icon={Target}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          label="Total Routines"
          value={`${stats?.totalRoutines || 0}`}
        />
      </div>

      {/* Weekly Progress */}
      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Weekly Progress</h2>
          <span className="text-sm text-muted-foreground">
            {completionRate}%
          </span>
        </div>
        <ProgressBar value={stats?.completedToday || 0} max={stats?.totalToday || 1} showLabel={false} />
        <p className="text-sm text-muted-foreground text-center">
          {stats?.completedToday || 0} of {stats?.totalToday || 0} tasks completed today
        </p>
      </Card>

      {/* Routines Summary */}
      {routines && routines.length > 0 && (
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold">Your Routines</h2>
          <div className="space-y-2">
            {routines.filter(r => r.isActive).map((routine) => (
              <div
                key={routine.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm">{routine.name}</span>
                <div className="flex gap-1">
                  {routine.timeCategories.map((cat) => (
                    <span
                      key={cat}
                      className="text-xs px-2 py-0.5 rounded bg-muted"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
