import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Moon,
  Share2,
  Sun,
  Download,
} from "lucide-react";
import { addDays, format, isAfter, startOfWeek } from "date-fns";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { dashboardApi, routinesApi } from "@/lib/storage";
import {
  calculateWeeklyInsights,
  getGradeColorClass,
} from "@/lib/insights";
import type { Completion, Routine } from "@/lib/schema";

function formatDelta(value: number, suffix = "") {
  if (value > 0) return { text: `▲ +${value}${suffix}`, cls: "text-emerald-500" };
  if (value < 0) return { text: `▼ ${value}${suffix}`, cls: "text-red-500" };
  return { text: `→ 0${suffix}`, cls: "text-muted-foreground" };
}

function getBarColor(rate: number) {
  if (rate >= 100) return "bg-emerald-500";
  if (rate > 70) return "bg-blue-500";
  if (rate > 40) return "bg-amber-500";
  return "bg-red-500";
}

export default function InsightsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const pageRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { data: routines = [] } = useQuery<Routine[]>({
    queryKey: ["routines"],
    queryFn: routinesApi.getAll,
  });

  const { data: completions = [] } = useQuery<Completion[]>({
    queryKey: ["completions-all"],
    queryFn: dashboardApi.getAllCompletions,
  });

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const canGoNext = isAfter(currentWeekStart, selectedWeekStart);

  const insights = useMemo(
    () => calculateWeeklyInsights(routines, completions, selectedWeekStart),
    [routines, completions, selectedWeekStart],
  );

  const shareRecap = async () => {
    if (!pageRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const canvas = await html2canvas(pageRef.current, {
        backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((value) => resolve(value), "image/png", 1.0);
      });

      if (!blob) {
        toast({ title: "Share failed", description: "Unable to generate image." });
        setIsSharing(false);
        return;
      }

      const file = new File([blob], `routine-minder-insights-${insights.weekStart}.png`, {
        type: "image/png",
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Weekly Routine Insights" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `routine-minder-insights-${insights.weekStart}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Image saved", description: "You can share it from downloads." });
      }
    } catch {
      toast({ title: "Share cancelled", description: "No image was shared." });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-5 max-w-lg mx-auto" ref={pageRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedWeekStart((value) => addDays(value, -7))}
            data-testid="button-prev-week"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <div className="font-semibold">{insights.weekLabel}</div>
            <div className="text-xs text-muted-foreground">Week {insights.weekNumber} of {insights.year}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedWeekStart((value) => addDays(value, 7))}
            disabled={!canGoNext}
            data-testid="button-next-week"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {insights.isEmpty ? (
        <div className="glass-card p-10 text-center space-y-3">
          <Lightbulb className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-xl font-semibold">No data for this week</h2>
          <p className="text-sm text-muted-foreground">Complete routines this week to unlock your recap insights.</p>
        </div>
      ) : (
        <>
          <div className="glass-card p-6 text-center space-y-1">
            <div className={`text-5xl font-bold ${getGradeColorClass(insights.grade)}`}>{insights.grade}</div>
            <p className="text-sm uppercase tracking-wider text-muted-foreground">Weekly Score</p>
            <p className="text-xl font-semibold">{insights.completionRate}% completion rate</p>
            <p className={`text-sm font-medium ${formatDelta(insights.deltaCompletionRate, "%").cls}`}>
              {formatDelta(insights.deltaCompletionRate, "%").text} vs last week
            </p>
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="font-semibold">💡 Highlights</h3>
            <ul className="space-y-1.5 text-sm">
              {insights.highlights.slice(0, 5).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="font-semibold">📅 Daily Breakdown</h3>
            <div className="space-y-2">
              {insights.dailyBreakdown.map((day) => (
                <div key={day.date} className="grid grid-cols-[32px_1fr_40px] gap-2 items-center text-sm">
                  <span className="text-muted-foreground">{day.label}</span>
                  {day.isFuture ? (
                    <div className="h-2.5 rounded-full bg-muted/30" />
                  ) : (
                    <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                      <div className={`h-full ${getBarColor(day.completionRate)}`} style={{ width: `${day.completionRate}%` }} />
                    </div>
                  )}
                  <span className="text-right">{day.isFuture ? "—" : `${day.completionRate}%${day.isPerfectDay ? " ⭐" : ""}`}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 space-y-2">
            <h3 className="font-semibold">📊 vs Last Week</h3>
            {!insights.hasLastWeekData ? (
              <p className="text-sm text-muted-foreground">First week! No comparison yet.</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span>Completion Rate</span><span className={formatDelta(insights.deltaCompletionRate, "%").cls}>{formatDelta(insights.deltaCompletionRate, "%").text}</span></div>
                <div className="flex justify-between"><span>Tasks Done</span><span className={formatDelta(insights.deltaTasks).cls}>{formatDelta(insights.deltaTasks).text}</span></div>
                <div className="flex justify-between"><span>Perfect Days</span><span className={formatDelta(insights.deltaPerfectDays).cls}>{formatDelta(insights.deltaPerfectDays).text}</span></div>
                <div className="flex justify-between"><span>Streak</span><span className={formatDelta(insights.deltaStreakEnd).cls}>{formatDelta(insights.deltaStreakEnd).text}</span></div>
              </div>
            )}
          </div>

          {insights.routineSpotlight && (
            <div className="glass-card p-5 space-y-3">
              <h3 className="font-semibold">🌟 Routine Spotlight</h3>
              {insights.routineSpotlight.allPerfect ? (
                <p className="text-sm">All routines at 100% — incredible week! 🎉</p>
              ) : (
                <>
                  <div className="text-sm">
                    <p className="font-medium">Top Performer</p>
                    <p>{insights.routineSpotlight.topPerformer.routineIcon} {insights.routineSpotlight.topPerformer.routineName} — {insights.routineSpotlight.topPerformer.completionRate}% ({insights.routineSpotlight.topPerformer.completedDays}/{insights.routineSpotlight.topPerformer.scheduledDays})</p>
                  </div>
                  {insights.routineSpotlight.needsAttention && (
                    <div className="text-sm">
                      <p className="font-medium">Needs Attention</p>
                      <p>{insights.routineSpotlight.needsAttention.routineIcon} {insights.routineSpotlight.needsAttention.routineName} — {insights.routineSpotlight.needsAttention.completionRate}% ({insights.routineSpotlight.needsAttention.completedDays}/{insights.routineSpotlight.needsAttention.scheduledDays})</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="glass-card p-5 space-y-2">
            <h3 className="font-semibold">📏 Consistency</h3>
            <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${insights.consistencyScore}%` }} />
            </div>
            <p className="font-medium">{insights.consistencyScore}% — {insights.consistencyLabel}</p>
            <p className="text-sm text-muted-foreground">
              You completed routines on {insights.consistencyActiveDays} out of {insights.consistencyElapsedDays} days this week.
            </p>
          </div>
        </>
      )}

      <Button onClick={shareRecap} className="w-full h-12 text-base" disabled={isSharing}>
        {isSharing ? <Download className="h-4 w-4 mr-2 animate-bounce" /> : <Share2 className="h-4 w-4 mr-2" />}
        Share Weekly Recap
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">{format(new Date(), "EEEE, MMM d, yyyy")}</p>
    </div>
  );
}
