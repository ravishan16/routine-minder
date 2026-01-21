import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sunrise, Sun, Moon, Clock } from "lucide-react";
import { DateNavigator } from "@/components/date-navigator";
import { ProgressBar } from "@/components/progress-bar";
import { RoutineCheckbox } from "@/components/routine-checkbox";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { routinesApi, completionsApi } from "@/lib/api";
import type { DailyRoutine } from "@/lib/schema";

const categoryOrder = ["AM", "NOON", "PM", "ALL"];
const categoryConfig = {
  AM: { icon: Sunrise, label: "MORNING" },
  NOON: { icon: Sun, label: "NOON" },
  PM: { icon: Moon, label: "EVENING" },
  ALL: { icon: Clock, label: "ALL DAY" },
};

export default function TodayPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { theme, toggleTheme } = useTheme();
  const dateStr = formatDate(selectedDate);

  const { data: routines, isLoading } = useQuery<DailyRoutine[]>({
    queryKey: ["routines", "daily", dateStr],
    queryFn: () => routinesApi.getDaily(dateStr),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ routineId, timeCategory }: { routineId: string; timeCategory: string }) => {
      return completionsApi.toggle({
        routineId,
        date: dateStr,
        timeCategory: timeCategory as "AM" | "NOON" | "PM" | "ALL",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines", "daily", dateStr] });
    },
  });

  // Transform routines data for display
  const getCompletionStatus = (routine: DailyRoutine, category: string) => {
    const completion = routine.completions?.find(c => c.timeCategory === category);
    return completion?.completed || false;
  };

  const groupedRoutines = routines?.reduce((acc, routine) => {
    routine.timeCategories.forEach((category) => {
      if (!acc[category]) acc[category] = [];
      acc[category].push({ routine, category });
    });
    return acc;
  }, {} as Record<string, { routine: DailyRoutine; category: string }[]>) || {};

  const totalTasks = routines?.reduce((sum, r) => sum + r.timeCategories.length, 0) || 0;
  const completedTasks = routines?.reduce((sum, r) => {
    return sum + r.timeCategories.filter(cat => getCompletionStatus(r, cat)).length;
  }, 0) || 0;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 border-b border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="w-10" />
          <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
        </div>
        <div className="px-4 pb-4">
          <ProgressBar value={completedTasks} max={totalTasks} />
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : routines?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No routines yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Add your first routine to start tracking
            </p>
            <Button asChild>
              <a href="/routines">Add Routine</a>
            </Button>
          </div>
        ) : (
          categoryOrder.map((category) => {
            const items = groupedRoutines[category];
            if (!items?.length) return null;

            const config = categoryConfig[category as keyof typeof categoryConfig];
            const Icon = config.icon;

            return (
              <section key={category} className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold tracking-wider">{config.label}</span>
                </div>
                <div className="space-y-2">
                  {items.map(({ routine, category: cat }) => (
                    <RoutineCheckbox
                      key={`${routine.id}-${cat}`}
                      testId={`checkbox-routine-${routine.id}-${cat}`}
                      checked={getCompletionStatus(routine, cat)}
                      onChange={() => {
                        toggleMutation.mutate({
                          routineId: routine.id,
                          timeCategory: cat,
                        });
                      }}
                      label={routine.name}
                      disabled={toggleMutation.isPending}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
