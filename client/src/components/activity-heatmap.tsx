import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { subDays, eachDayOfInterval, startOfWeek, getMonth, getYear, parseISO } from "date-fns";
import type { Completion } from "@/lib/schema";

interface ActivityHeatmapProps {
    completions: Completion[];
    days?: number;
}

// Format date as YYYY-MM-DD using local timezone
function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format for display
function formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ActivityHeatmap({ completions, days = 365 }: ActivityHeatmapProps) {
    // Generate calendar days, auto-fit to data range
    const calendarData = useMemo(() => {
        const today = new Date();
        let startDate = subDays(today, days);
        let minWeeks = 8; // Always show at least 8 weeks
        let maxWeeks = 52; // Never show more than 1 year

        if (completions.length > 0) {
            // Find earliest and latest completion
            const sortedDates = completions.map(c => c.date).sort();
            const earliestCompletion = sortedDates[0];
            const latestCompletion = sortedDates[sortedDates.length - 1];
            if (earliestCompletion && latestCompletion) {
                const earliestDate = startOfWeek(parseISO(earliestCompletion));
                const latestDate = parseISO(latestCompletion);
                // Calculate number of weeks between earliest and today (or latest)
                const msPerWeek = 7 * 24 * 60 * 60 * 1000;
                let weekCount = Math.ceil((today.getTime() - earliestDate.getTime()) / msPerWeek);
                if (weekCount < minWeeks) weekCount = minWeeks;
                if (weekCount > maxWeeks) weekCount = maxWeeks;
                startDate = subDays(today, weekCount * 7 - 1);
            }
        } else {
            // No completions, show minWeeks
            startDate = subDays(today, minWeeks * 7 - 1);
        }

        // Align to start of week for cleanliness
        const start = startOfWeek(startDate);
        const dates = eachDayOfInterval({
            start: start,
            end: today
        });

        // Group completions by date using the exact date string from completions
        const completionMap = new Map<string, number>();
        completions.forEach(c => {
            const dateKey = c.date;
            completionMap.set(dateKey, (completionMap.get(dateKey) || 0) + 1);
        });

        return dates.map(date => {
            const dateKey = formatLocalDate(date);
            const count = completionMap.get(dateKey) || 0;
            let level = 0;
            if (count > 0) level = 1;
            if (count > 2) level = 2;
            if (count > 4) level = 3;
            if (count > 6) level = 4;
            return {
                date,
                dateKey,
                count,
                level,
                month: getMonth(date),
                year: getYear(date)
            };
        });
    }, [completions, days]);

    // Group into weeks for CSS grid column layout (vertical weeks)
    const weeks = useMemo(() => {
        const weeksArray: typeof calendarData[] = [];
        let currentWeek: typeof calendarData = [];

        calendarData.forEach((day, i) => {
            currentWeek.push(day);
            if ((i + 1) % 7 === 0 || i === calendarData.length - 1) {
                weeksArray.push(currentWeek);
                currentWeek = [];
            }
        });
        return weeksArray;
    }, [calendarData]);

    return (
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
            <div className="min-w-fit flex gap-1">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-rows-7 gap-1">
                        {week.map((day) => (
                            <TooltipProvider key={day.dateKey} delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={cn(
                                                "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-primary/50",
                                                day.level === 0 && "bg-muted/40 dark:bg-muted/20",
                                                day.level === 1 && "bg-emerald-400/40 dark:bg-emerald-500/40",
                                                day.level === 2 && "bg-emerald-500/60 dark:bg-emerald-500/60",
                                                day.level === 3 && "bg-emerald-500/80 dark:bg-emerald-400/80",
                                                day.level === 4 && "bg-emerald-500 dark:bg-emerald-400"
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                        <p className="font-semibold">{formatDisplayDate(day.date)}</p>
                                        <p className="text-muted-foreground">
                                            {day.count} {day.count === 1 ? "routine" : "routines"} completed
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
