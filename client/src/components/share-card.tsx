import { Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { DashboardStats, RoutineStats } from "@shared/schema";

type ShareDashboardProps = {
  stats: DashboardStats;
};

type ShareRoutineProps = {
  routineStats: RoutineStats;
};

export function ShareDashboardButton({ stats }: ShareDashboardProps) {
  const { toast } = useToast();

  const shareText = `My Routine Minder Stats:
Current Streak: ${stats.currentStreak} days
Longest Streak: ${stats.longestStreak} days
Completion Rate: ${stats.completionRate}%
${stats.completedCount} of ${stats.totalTasks} tasks completed

Keep building those habits!`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Routine Minder Stats",
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    toast({
      title: "Copied to clipboard",
      description: "Share your stats with friends!",
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} data-testid="button-share-dashboard">
      <Share2 className="w-4 h-4 mr-2" />
      Share Stats
    </Button>
  );
}

export function ShareRoutineButton({ routineStats }: ShareRoutineProps) {
  const { toast } = useToast();

  const shareText = `${routineStats.routineName} Streak:
Current: ${routineStats.currentStreak} days
Best: ${routineStats.longestStreak} days
Completion Rate: ${routineStats.completionRate}%
${routineStats.achievedMilestones.length > 0 ? `Milestones: ${routineStats.achievedMilestones.map(m => m === 365 ? "1 Year" : m === 30 ? "1 Month" : m === 7 ? "1 Week" : `${m} Days`).join(", ")}` : ""}

Building habits with Routine Minder!`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${routineStats.routineName} Streak`,
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    toast({
      title: "Copied to clipboard",
      description: "Share your streak with friends!",
    });
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleShare} data-testid={`button-share-routine-${routineStats.routineId}`}>
      <Share2 className="w-4 h-4" />
    </Button>
  );
}
