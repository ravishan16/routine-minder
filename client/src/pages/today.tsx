import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sunrise, Sun, Moon, Clock, Plus, CheckCircle2, CheckCheck } from "lucide-react";
import { DateNavigator } from "@/components/date-navigator";
import { ProgressBar } from "@/components/progress-bar";
import { RoutineCheckbox } from "@/components/routine-checkbox";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { routinesApi, completionsApi } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { DailyRoutine } from "@/lib/schema";

const categoryOrder = ["AM", "NOON", "PM", "ALL"];
const categoryConfig: Record<string, { icon: typeof Sunrise; label: string }> = {
  AM: { icon: Sunrise, label: "MORNING" },
  NOON: { icon: Sun, label: "NOON" },
  PM: { icon: Moon, label: "EVENING" },
  ALL: { icon: Clock, label: "ALL DAY" },
};

export default function TodayPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const dateStr = formatDate(selectedDate);

  const { data: routines, isLoading } = useQuery({
    queryKey: ["routines", "daily", dateStr],
    queryFn: () => routinesApi.getDaily(dateStr),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ routineId, timeCategory }: { routineId: string; timeCategory: string }) => {
      return completionsApi.toggle({
        routineId,
        date: dateStr,
        timeCategory,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines", "daily", dateStr] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["completions-all"] });
    },
  });

  // Mark all incomplete tasks as complete
  const handleMarkAllComplete = async () => {
    if (!routines || isMarkingAll) return;
    
    setIsMarkingAll(true);
    try {
      const incompleteTasks: { routineId: string; timeCategory: string }[] = [];
      
      routines.forEach((routine) => {
        routine.timeCategories.forEach((category) => {
          if (!routine.completedCategories.includes(category)) {
            incompleteTasks.push({ routineId: routine.id, timeCategory: category });
          }
        });
      });

      // Complete all tasks sequentially
      for (const task of incompleteTasks) {
        await completionsApi.toggle({
          routineId: task.routineId,
          date: dateStr,
          timeCategory: task.timeCategory,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["routines", "daily", dateStr] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["completions-all"] });
      
      toast({ title: "All tasks completed! 🎉" });
    } catch {
      toast({ title: "Failed to complete tasks", variant: "destructive" });
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Group routines by time category with their completion status
  const groupedRoutines: Record<string, { routine: DailyRoutine; isCompleted: boolean }[]> = {};
  routines?.forEach((routine) => {
    routine.timeCategories.forEach((category) => {
      if (!groupedRoutines[category]) groupedRoutines[category] = [];
      groupedRoutines[category].push({
        routine,
        isCompleted: routine.completedCategories.includes(category),
      });
    });
  });

  // Count total tasks (routine × category pairs) and completed ones
  const totalTasks = routines?.reduce((sum, r) => sum + r.timeCategories.length, 0) || 0;
  const completedTasks = routines?.reduce((sum, r) => sum + r.completedCategories.length, 0) || 0;
  const allComplete = totalTasks > 0 && completedTasks === totalTasks;
  const hasIncompleteTasks = totalTasks > 0 && completedTasks < totalTasks;

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <DateNavigator
          date={selectedDate}
          onDateChange={setSelectedDate}
        />
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Progress with Mark All Complete */}
      {totalTasks > 0 && (
        <div className="space-y-2">
          <ProgressBar value={completedTasks} max={totalTasks} showLabel />
          {hasIncompleteTasks && (
            <button
              onClick={handleMarkAllComplete}
              disabled={isMarkingAll}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mx-auto"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {isMarkingAll ? "Completing..." : "Mark all complete"}
            </button>
          )}
        </div>
      )}

      {/* All Complete Message */}
      {allComplete && (
        <div className="text-center py-6 px-4 rounded-xl bg-accent/10 border border-accent/20">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-accent" />
          <p className="font-semibold text-accent">All done for today!</p>
          <p className="text-sm text-muted-foreground">Great job keeping up with your routines</p>
        </div>
      )}

      {/* Routines by Category */}
      {categoryOrder.map((category) => {
        const categoryItems = groupedRoutines[category];
        if (!categoryItems?.length) return null;

        const config = categoryConfig[category];
        const Icon = config.icon;
        const completedInCategory = categoryItems.filter((item) => item.isCompleted).length;

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {completedInCategory}/{categoryItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {categoryItems.map(({ routine, isCompleted }) => (
                <RoutineCheckbox
                  key={`${routine.id}-${category}`}
                  label={routine.name}
                  icon={routine.icon}
                  notificationTime={routine.notificationEnabled && routine.notificationTime ? routine.notificationTime : undefined}
                  checked={isCompleted}
                  onChange={() =>
                    toggleMutation.mutate({
                      routineId: routine.id,
                      timeCategory: category,
                    })
                  }
                  disabled={toggleMutation.isPending}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {(!routines || routines.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No routines yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Add some routines to start tracking your habits
          </p>
          <Link href="/routines">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Routine
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
