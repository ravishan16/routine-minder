import { z } from "zod";

// Time categories for routines
export const TimeCategory = z.enum(["AM", "NOON", "PM", "ALL"]);
export type TimeCategory = z.infer<typeof TimeCategory>;

// Routine schema
export const RoutineSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  timeCategories: z.array(TimeCategory).min(1, "Select at least one time"),
  isActive: z.boolean(),
  sortOrder: z.number(),
  notificationEnabled: z.boolean(),
  notificationTime: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export type Routine = z.infer<typeof RoutineSchema>;

// Routine with completion status for daily view
export const DailyRoutineSchema = RoutineSchema.extend({
  completions: z.array(
    z.object({
      timeCategory: TimeCategory,
      completed: z.boolean(),
    })
  ),
});

export type DailyRoutine = z.infer<typeof DailyRoutineSchema>;

// Completion record
export const CompletionSchema = z.object({
  id: z.string(),
  routineId: z.string(),
  date: z.string(),
  timeCategory: TimeCategory,
  completed: z.boolean(),
  completedAt: z.string().optional(),
});

export type Completion = z.infer<typeof CompletionSchema>;

// Settings
export const SettingsSchema = z.object({
  notificationsEnabled: z.boolean(),
  amNotificationTime: z.string(),
  noonNotificationTime: z.string(),
  pmNotificationTime: z.string(),
});

export type Settings = z.infer<typeof SettingsSchema>;

// Dashboard stats
export const DashboardSchema = z.object({
  completionRate: z.number(),
  totalCompleted: z.number(),
  totalExpected: z.number(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  routineCount: z.number(),
});

export type Dashboard = z.infer<typeof DashboardSchema>;

// Routine stats for dashboard
export const RoutineStatsSchema = z.object({
  routineId: z.string(),
  routineName: z.string(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  completionRate: z.number(),
  achievedMilestones: z.array(z.number()),
});

export type RoutineStats = z.infer<typeof RoutineStatsSchema>;

// Milestones
export const MILESTONES = [7, 21, 30, 50, 100, 365] as const;
export type Milestone = (typeof MILESTONES)[number];

// Helper functions for milestones
export function getNextMilestone(currentStreak: number): Milestone | null {
  for (const m of MILESTONES) {
    if (currentStreak < m) return m;
  }
  return null;
}

export function getAchievedMilestones(currentStreak: number): Milestone[] {
  return MILESTONES.filter((m) => currentStreak >= m);
}

// Create routine input
export const CreateRoutineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  timeCategories: z.array(TimeCategory).min(1, "Select at least one time"),
  notificationEnabled: z.boolean().optional(),
  notificationTime: z.string().optional(),
});

export type CreateRoutineInput = z.infer<typeof CreateRoutineSchema>;

// Toggle completion input
export const ToggleCompletionSchema = z.object({
  routineId: z.string(),
  date: z.string(),
  timeCategory: TimeCategory,
});

export type ToggleCompletionInput = z.infer<typeof ToggleCompletionSchema>;
