import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Dashboard, RoutineStats } from "@/lib/schema";

type ShareDashboardProps = {
  stats: Dashboard;
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
${stats.totalCompleted} of ${stats.totalExpected} tasks completed

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

  const formatMilestone = (m: number): string => {
    if (m === 365) return "1 Year";
    if (m === 30) return "1 Month";
    if (m === 7) return "1 Week";
    return `${m} Days`;
  };

  const shareText = `${routineStats.routineName} Streak:
Current: ${routineStats.currentStreak} days
Best: ${routineStats.longestStreak} days
Completion Rate: ${routineStats.completionRate}%
${routineStats.achievedMilestones.length > 0 ? `Milestones: ${routineStats.achievedMilestones.map(formatMilestone).join(", ")}` : ""}

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
