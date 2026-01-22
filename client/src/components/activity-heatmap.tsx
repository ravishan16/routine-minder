import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format, subDays, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import type { Completion } from "@/lib/schema";

interface ActivityHeatmapProps {
    completions: Completion[];
    days?: number;
}

export function ActivityHeatmap({ completions, days = 365 }: ActivityHeatmapProps) {
    // Generate calendar days
    const calendarData = useMemo(() => {
        const today = new Date();
        const startDate = subDays(today, days);
        // Align to start of week for cleanliness
        const start = startOfWeek(startDate);

        const dates = eachDayOfInterval({
            start: start,
            end: today
        });

        // Group completions by date
        const completionMap = new Map<string, number>();
        completions.forEach(c => {
            const dateKey = c.date;
            completionMap.set(dateKey, (completionMap.get(dateKey) || 0) + 1);
        });

        return dates.map(date => {
            const dateKey = format(date, "yyyy-MM-dd");
            const count = completionMap.get(dateKey) || 0;

            // Determine intensity level (0-4)
            let level = 0;
            if (count > 0) level = 1;
            if (count > 2) level = 2;
            if (count > 4) level = 3;
            if (count > 6) level = 4;

            return {
                date,
                dateKey,
                count,
                level
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
                                                "w-3 h-3 rounded-[2px] transition-colors",
                                                day.level === 0 && "bg-muted/30",
                                                day.level === 1 && "bg-primary/30",
                                                day.level === 2 && "bg-primary/50",
                                                day.level === 3 && "bg-primary/70",
                                                day.level === 4 && "bg-primary"
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                        <p className="font-semibold">{format(day.date, "MMM d, yyyy")}</p>
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
