import {
  addDays,
  endOfWeek,
  format,
  getISOWeek,
  isAfter,
  isBefore,
  isSameDay,
  startOfWeek,
} from "date-fns";
import type { Completion, Routine } from "./schema";

export type WeekGrade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D" | "F";

export interface WeeklyRoutineStat {
  routineId: string;
  routineName: string;
  routineIcon: string;
  completionRate: number;
  completedTasks: number;
  scheduledTasks: number;
  completedDays: number;
  scheduledDays: number;
}

export interface RoutineSpotlight {
  topPerformer: WeeklyRoutineStat;
  needsAttention: WeeklyRoutineStat | null;
  allPerfect: boolean;
}

export interface WeeklyInsightDay {
  label: string;
  date: string;
  completionRate: number;
  completedTasks: number;
  scheduledTasks: number;
  isFuture: boolean;
  isPerfectDay: boolean;
}

export interface WeeklyInsight {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  weekNumber: number;
  year: number;
  completionRate: number;
  totalCompletedTasks: number;
  totalScheduledTasks: number;
  grade: WeekGrade;
  deltaCompletionRate: number;
  deltaTasks: number;
  deltaPerfectDays: number;
  deltaStreakEnd: number;
  hasLastWeekData: boolean;
  perfectDays: number;
  streakAtEndOfWeek: number;
  consistencyScore: number;
  consistencyLabel: string;
  consistencyActiveDays: number;
  consistencyElapsedDays: number;
  dailyBreakdown: WeeklyInsightDay[];
  highlights: string[];
  routineSpotlight: RoutineSpotlight | null;
  isEmpty: boolean;
}

interface WeekAggregate {
  completionRate: number;
  totalCompletedTasks: number;
  totalScheduledTasks: number;
  perfectDays: number;
  streakAtEndOfWindow: number;
  dailyBreakdown: WeeklyInsightDay[];
  elapsedDays: number;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function getActiveRoutines(routines: Routine[]): Routine[] {
  return routines.filter((routine) => routine.isActive);
}

function getWeekWindow(weekStartDate: Date) {
  const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  return { weekStart, weekEnd };
}

function calculateStreakAtDate(
  completions: Completion[],
  routines: Routine[],
  endDate: Date,
): number {
  const activeRoutines = getActiveRoutines(routines);
  const expectedPerDay = activeRoutines.reduce((sum, routine) => sum + routine.timeCategories.length, 0);
  if (expectedPerDay === 0) return 0;

  let streak = 0;
  let cursor = new Date(endDate);

  for (let i = 0; i < 365; i++) {
    const dateKey = toDateKey(cursor);
    const completedToday = completions.filter((completion) => completion.date === dateKey).length;
    if (completedToday >= expectedPerDay) {
      streak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }

    if (i === 0) {
      cursor = addDays(cursor, -1);
      continue;
    }

    break;
  }

  return streak;
}

function aggregateWeek(
  routines: Routine[],
  completions: Completion[],
  weekStart: Date,
  dayLimit = 7,
): WeekAggregate {
  const today = new Date();
  const activeRoutines = getActiveRoutines(routines);
  const expectedPerDay = activeRoutines.reduce((sum, routine) => sum + routine.timeCategories.length, 0);

  const dailyBreakdown: WeeklyInsightDay[] = [];
  let totalCompletedTasks = 0;
  let totalScheduledTasks = 0;
  let perfectDays = 0;
  let elapsedDays = 0;

  for (let index = 0; index < dayLimit; index++) {
    const date = addDays(weekStart, index);
    const dateKey = toDateKey(date);
    const isFuture = isAfter(date, today) && !isSameDay(date, today);

    const completedTasks = completions.filter((completion) => completion.date === dateKey).length;
    const scheduledTasks = isFuture ? 0 : expectedPerDay;

    if (!isFuture) {
      elapsedDays += 1;
      totalCompletedTasks += completedTasks;
      totalScheduledTasks += scheduledTasks;
      if (scheduledTasks > 0 && completedTasks >= scheduledTasks) {
        perfectDays += 1;
      }
    }

    const completionRate = scheduledTasks > 0
      ? Math.min(100, Math.round((completedTasks / scheduledTasks) * 100))
      : 0;

    dailyBreakdown.push({
      label: WEEKDAY_LABELS[index],
      date: dateKey,
      completionRate,
      completedTasks,
      scheduledTasks,
      isFuture,
      isPerfectDay: scheduledTasks > 0 && completedTasks >= scheduledTasks,
    });
  }

  const completionRate = totalScheduledTasks > 0
    ? Math.min(100, Math.round((totalCompletedTasks / totalScheduledTasks) * 100))
    : 0;

  const streakAtEndOfWindow = calculateStreakAtDate(
    completions,
    routines,
    addDays(weekStart, Math.max(0, dayLimit - 1)),
  );

  return {
    completionRate,
    totalCompletedTasks,
    totalScheduledTasks,
    perfectDays,
    streakAtEndOfWindow,
    dailyBreakdown,
    elapsedDays,
  };
}

function getGradeColorBand(completionRate: number): WeekGrade {
  if (completionRate >= 95) return "A+";
  if (completionRate >= 90) return "A";
  if (completionRate >= 85) return "A-";
  if (completionRate >= 80) return "B+";
  if (completionRate >= 75) return "B";
  if (completionRate >= 70) return "B-";
  if (completionRate >= 65) return "C+";
  if (completionRate >= 60) return "C";
  if (completionRate >= 55) return "C-";
  if (completionRate >= 40) return "D";
  return "F";
}

export function getWeekGrade(completionRate: number): WeekGrade {
  return getGradeColorBand(completionRate);
}

export function calculateConsistencyScore(
  completions: Completion[],
  weekStartDate: Date,
  weekEndDate: Date,
): { score: number; label: string; activeDays: number; elapsedDays: number } {
  const today = new Date();
  const elapsedEnd = isBefore(weekEndDate, today) ? weekEndDate : today;
  const elapsedDays = Math.max(1, Math.min(7, Math.floor((elapsedEnd.getTime() - weekStartDate.getTime()) / 86400000) + 1));

  const elapsedDates = new Set<string>();
  for (let i = 0; i < elapsedDays; i++) {
    elapsedDates.add(toDateKey(addDays(weekStartDate, i)));
  }

  const activeDays = new Set(
    completions
      .filter((completion) => elapsedDates.has(completion.date))
      .map((completion) => completion.date),
  ).size;

  const score = Math.round((activeDays / elapsedDays) * 100);

  let label = "Getting Started";
  if (score >= 90) label = "Highly Consistent";
  else if (score >= 70) label = "Consistent";
  else if (score >= 50) label = "Building Up";

  return { score, label, activeDays, elapsedDays };
}

export function getRoutineSpotlight(
  routines: Routine[],
  completions: Completion[],
  weekStartDate: Date,
  weekEndDate: Date,
): RoutineSpotlight | null {
  const activeRoutines = getActiveRoutines(routines);
  if (activeRoutines.length < 2) return null;

  const today = new Date();
  const elapsedEnd = isBefore(weekEndDate, today) ? weekEndDate : today;
  const elapsedDays = Math.max(1, Math.min(7, Math.floor((elapsedEnd.getTime() - weekStartDate.getTime()) / 86400000) + 1));

  const dateSet = new Set<string>();
  for (let i = 0; i < elapsedDays; i++) {
    dateSet.add(toDateKey(addDays(weekStartDate, i)));
  }

  const routineStats: WeeklyRoutineStat[] = activeRoutines.map((routine) => {
    const routineCompletions = completions.filter(
      (completion) => completion.routineId === routine.id && dateSet.has(completion.date),
    );
    const completedDays = new Set(routineCompletions.map((completion) => completion.date)).size;
    const scheduledTasks = routine.timeCategories.length * elapsedDays;
    const completionRate = scheduledTasks > 0
      ? Math.min(100, Math.round((routineCompletions.length / scheduledTasks) * 100))
      : 0;

    return {
      routineId: routine.id,
      routineName: routine.name,
      routineIcon: routine.icon || "✅",
      completionRate,
      completedTasks: routineCompletions.length,
      scheduledTasks,
      completedDays,
      scheduledDays: elapsedDays,
    };
  });

  const sortedByRate = [...routineStats].sort((a, b) => b.completionRate - a.completionRate);
  const topPerformer = sortedByRate[0];
  const worst = [...routineStats].sort((a, b) => a.completionRate - b.completionRate)[0];
  const allPerfect = routineStats.every((stat) => stat.completionRate === 100);

  return {
    topPerformer,
    needsAttention: allPerfect || worst.completionRate >= 70 ? null : worst,
    allPerfect,
  };
}

export function generateHighlights(thisWeek: WeekAggregate, lastWeek: WeekAggregate): string[] {
  const highlights: string[] = [];

  const bestDay = [...thisWeek.dailyBreakdown]
    .filter((day) => !day.isFuture && day.scheduledTasks > 0)
    .sort((a, b) => b.completionRate - a.completionRate)[0];

  if (bestDay) {
    highlights.push(`🏆 Best day: ${bestDay.label} (${bestDay.completionRate}%)`);
  }

  const worstDayCandidates = thisWeek.dailyBreakdown.filter((day) => !day.isFuture && day.scheduledTasks > 0);
  const worstDay = [...worstDayCandidates].sort((a, b) => a.completionRate - b.completionRate)[0];
  if (worstDay && worstDay.completionRate < 50 && worstDayCandidates.length >= 3) {
    highlights.push(`🔧 Toughest day: ${worstDay.label} (${worstDay.completionRate}%)`);
  }

  const taskDelta = thisWeek.totalCompletedTasks - lastWeek.totalCompletedTasks;
  if (taskDelta !== 0) {
    const direction = taskDelta > 0 ? "📈" : "📉";
    const deltaPct = lastWeek.totalCompletedTasks > 0
      ? Math.round((Math.abs(taskDelta) / lastWeek.totalCompletedTasks) * 100)
      : 100;
    highlights.push(`${direction} ${thisWeek.totalCompletedTasks} tasks completed (${taskDelta > 0 ? "+" : "-"}${deltaPct}% vs last week)`);
  }

  if (thisWeek.perfectDays > 0) {
    highlights.push(`⭐ ${thisWeek.perfectDays} perfect day${thisWeek.perfectDays > 1 ? "s" : ""} this week`);
  }

  const rateDelta = thisWeek.completionRate - lastWeek.completionRate;
  if (rateDelta >= 10) {
    highlights.push(`🚀 Completion rate up ${rateDelta}% week over week`);
  } else if (rateDelta <= -10) {
    highlights.push(`🎯 Opportunity: completion rate down ${Math.abs(rateDelta)}% vs last week`);
  }

  return highlights.slice(0, 5);
}

export function calculateWeeklyInsights(
  routines: Routine[],
  completions: Completion[],
  weekStartDate: Date,
): WeeklyInsight {
  const { weekStart, weekEnd } = getWeekWindow(weekStartDate);
  const today = new Date();

  const elapsedDays = isBefore(weekEnd, today)
    ? 7
    : Math.max(1, Math.floor((today.getTime() - weekStart.getTime()) / 86400000) + 1);

  const thisWeek = aggregateWeek(routines, completions, weekStart, Math.min(7, elapsedDays));
  const remainingDays = 7 - thisWeek.dailyBreakdown.length;
  if (remainingDays > 0) {
    for (let i = 0; i < remainingDays; i++) {
      const date = addDays(weekStart, thisWeek.dailyBreakdown.length + i);
      thisWeek.dailyBreakdown.push({
        label: WEEKDAY_LABELS[thisWeek.dailyBreakdown.length + i],
        date: toDateKey(date),
        completionRate: 0,
        completedTasks: 0,
        scheduledTasks: 0,
        isFuture: true,
        isPerfectDay: false,
      });
    }
  }

  const lastWeekStart = addDays(weekStart, -7);
  const lastWeek = aggregateWeek(routines, completions, lastWeekStart, thisWeek.elapsedDays);

  const hasLastWeekData = lastWeek.totalCompletedTasks > 0 || lastWeek.totalScheduledTasks > 0;
  const grade = getWeekGrade(thisWeek.completionRate);
  const consistency = calculateConsistencyScore(completions, weekStart, weekEnd);
  const routineSpotlight = getRoutineSpotlight(routines, completions, weekStart, weekEnd);
  const streakAtEndOfWeek = calculateStreakAtDate(
    completions,
    routines,
    isAfter(weekEnd, today) ? today : weekEnd,
  );
  const lastStreak = calculateStreakAtDate(completions, routines, addDays(lastWeekStart, thisWeek.elapsedDays - 1));

  const highlights = generateHighlights(thisWeek, lastWeek);

  return {
    weekStart: toDateKey(weekStart),
    weekEnd: toDateKey(weekEnd),
    weekLabel: `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`,
    weekNumber: getISOWeek(weekStart),
    year: weekStart.getFullYear(),
    completionRate: thisWeek.completionRate,
    totalCompletedTasks: thisWeek.totalCompletedTasks,
    totalScheduledTasks: thisWeek.totalScheduledTasks,
    grade,
    deltaCompletionRate: thisWeek.completionRate - lastWeek.completionRate,
    deltaTasks: thisWeek.totalCompletedTasks - lastWeek.totalCompletedTasks,
    deltaPerfectDays: thisWeek.perfectDays - lastWeek.perfectDays,
    deltaStreakEnd: streakAtEndOfWeek - lastStreak,
    hasLastWeekData,
    perfectDays: thisWeek.perfectDays,
    streakAtEndOfWeek,
    consistencyScore: consistency.score,
    consistencyLabel: consistency.label,
    consistencyActiveDays: consistency.activeDays,
    consistencyElapsedDays: consistency.elapsedDays,
    dailyBreakdown: thisWeek.dailyBreakdown,
    highlights,
    routineSpotlight,
    isEmpty: thisWeek.totalCompletedTasks === 0,
  };
}

export function getGradeColorClass(grade: WeekGrade): string {
  if (grade.startsWith("A")) return "text-emerald-500";
  if (grade.startsWith("B")) return "text-blue-500";
  if (grade.startsWith("C")) return "text-amber-500";
  return "text-red-500";
}
