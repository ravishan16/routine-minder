import { z } from "zod";

// Time categories for routines
export const TimeCategory = z.enum(["AM", "NOON", "PM", "ALL"]);
export type TimeCategory = z.infer<typeof TimeCategory>;

// Routine schema (simplified)
export const RoutineSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  timeCategories: z.array(TimeCategory).min(1, "Select at least one time"),
  isActive: z.boolean(),
  sortOrder: z.number().optional(),
  notificationEnabled: z.boolean().optional(),
  notificationTime: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export type Routine = z.infer<typeof RoutineSchema>;

// Routine with completion status for daily view
export type DailyRoutine = Routine & {
  completedCategories: string[];
  isFullyCompleted: boolean;
};

// Completion record
export const CompletionSchema = z.object({
  id: z.string(),
  routineId: z.string(),
  date: z.string(),
  timeCategory: z.string(),
  completedAt: z.string().optional(),
});

export type Completion = z.infer<typeof CompletionSchema>;

// Settings (simplified)
export type Settings = {
  notificationsEnabled?: boolean;
  theme?: string;
};

// Dashboard stats
export type Dashboard = {
  totalRoutines: number;
  completedToday: number;
  totalToday: number;
  currentStreak: number;
  bestStreak: number;
  weeklyCompletionRate: number;
};

// Routine stats for dashboard
export type RoutineStats = {
  routineId: string;
  routineName: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  achievedMilestones: number[];
};

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
