import { describe, it, expect } from "vitest";
import { addDays, startOfWeek } from "date-fns";
import type { Completion, Routine } from "./schema";
import {
  calculateConsistencyScore,
  calculateWeeklyInsights,
  generateHighlights,
  getRoutineSpotlight,
  getWeekGrade,
} from "./insights";

const routines: Routine[] = [
  { id: "r1", name: "Meditate", icon: "🧘", timeCategories: ["AM"], isActive: true },
  { id: "r2", name: "Read", icon: "📚", timeCategories: ["PM"], isActive: true },
];

function dateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

describe("insights", () => {
  it("returns expected grades for boundaries", () => {
    expect(getWeekGrade(95)).toBe("A+");
    expect(getWeekGrade(94)).toBe("A");
    expect(getWeekGrade(85)).toBe("A-");
    expect(getWeekGrade(80)).toBe("B+");
    expect(getWeekGrade(39)).toBe("F");
  });

  it("calculates 100% week with A+", () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const completions: Completion[] = [];
    for (let i = 0; i < 7; i++) {
      const date = dateKey(addDays(weekStart, i));
      completions.push({ id: `c-${i}-1`, routineId: "r1", date, timeCategory: "AM" });
      completions.push({ id: `c-${i}-2`, routineId: "r2", date, timeCategory: "PM" });
    }

    const result = calculateWeeklyInsights(routines, completions, weekStart);
    expect(result.completionRate).toBe(100);
    expect(result.grade).toBe("A+");
  });

  it("returns zero-rate week with F for no data", () => {
    const weekStart = startOfWeek(new Date("2026-01-15"), { weekStartsOn: 1 });
    const result = calculateWeeklyInsights(routines, [], weekStart);
    expect(result.completionRate).toBe(0);
    expect(result.grade).toBe("F");
    expect(result.isEmpty).toBe(true);
  });

  it("uses monday as week boundary", () => {
    const thursday = new Date("2026-02-12");
    const result = calculateWeeklyInsights(routines, [], thursday);
    expect(result.weekStart).toBe("2026-02-09");
    expect(result.weekEnd).toBe("2026-02-15");
  });

  it("calculates positive and negative deltas", () => {
    const weekStart = startOfWeek(new Date("2026-02-16"), { weekStartsOn: 1 });
    const lastWeekStart = addDays(weekStart, -7);

    const completions: Completion[] = [
      { id: "lw-1", routineId: "r1", date: dateKey(lastWeekStart), timeCategory: "AM" },
      { id: "tw-1", routineId: "r1", date: dateKey(weekStart), timeCategory: "AM" },
      { id: "tw-2", routineId: "r2", date: dateKey(weekStart), timeCategory: "PM" },
    ];

    const improved = calculateWeeklyInsights(routines, completions, weekStart);
    expect(improved.deltaTasks).toBeGreaterThan(0);

    const declined = calculateWeeklyInsights(routines, [], weekStart);
    expect(declined.deltaTasks).toBeLessThanOrEqual(0);
  });

  it("consistency score counts distinct active days", () => {
    const weekStart = new Date("2026-03-02");
    const weekEnd = addDays(weekStart, 6);
    const completions: Completion[] = [
      { id: "c1", routineId: "r1", date: "2026-03-02", timeCategory: "AM" },
      { id: "c2", routineId: "r2", date: "2026-03-02", timeCategory: "PM" },
      { id: "c3", routineId: "r1", date: "2026-03-03", timeCategory: "AM" },
    ];

    const consistency = calculateConsistencyScore(completions, weekStart, weekEnd);
    expect(consistency.activeDays).toBe(2);
    expect(consistency.elapsedDays).toBe(7);
  });

  it("generateHighlights includes best and worst day insights", () => {
    const highlights = generateHighlights(
      {
        completionRate: 60,
        totalCompletedTasks: 10,
        totalScheduledTasks: 14,
        perfectDays: 1,
        streakAtEndOfWindow: 2,
        elapsedDays: 7,
        dailyBreakdown: [
          { label: "Mon", date: "2026-03-02", completionRate: 100, completedTasks: 2, scheduledTasks: 2, isFuture: false, isPerfectDay: true },
          { label: "Tue", date: "2026-03-03", completionRate: 20, completedTasks: 1, scheduledTasks: 5, isFuture: false, isPerfectDay: false },
          { label: "Wed", date: "2026-03-04", completionRate: 60, completedTasks: 3, scheduledTasks: 5, isFuture: false, isPerfectDay: false },
        ],
      },
      {
        completionRate: 40,
        totalCompletedTasks: 5,
        totalScheduledTasks: 14,
        perfectDays: 0,
        streakAtEndOfWindow: 0,
        elapsedDays: 7,
        dailyBreakdown: [],
      },
    );

    expect(highlights.some((item) => item.includes("Best day"))).toBe(true);
    expect(highlights.some((item) => item.includes("Toughest day"))).toBe(true);
  });

  it("routine spotlight picks top and needs-attention routines", () => {
    const weekStart = new Date("2026-03-02");
    const weekEnd = addDays(weekStart, 6);
    const completions: Completion[] = [
      { id: "c1", routineId: "r1", date: "2026-03-02", timeCategory: "AM" },
      { id: "c2", routineId: "r1", date: "2026-03-03", timeCategory: "AM" },
      { id: "c3", routineId: "r1", date: "2026-03-04", timeCategory: "AM" },
      { id: "c4", routineId: "r1", date: "2026-03-05", timeCategory: "AM" },
    ];

    const spotlight = getRoutineSpotlight(routines, completions, weekStart, weekEnd);
    expect(spotlight?.topPerformer.routineId).toBe("r1");
    expect(spotlight?.needsAttention?.routineId).toBe("r2");
  });
});
