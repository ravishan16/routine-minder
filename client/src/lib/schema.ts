import { z } from "zod";

// Time categories for routines
export const TimeCategory = z.enum(["AM", "NOON", "PM", "ALL"]);
export type TimeCategory = z.infer<typeof TimeCategory>;

// Routine schema (simplified)
export const RoutineSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional().default("✅"),
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

// Note: Gamification types (RoutineStats, achievements, levels) 
// are now in achievements.ts

// Create routine input
export const CreateRoutineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
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
