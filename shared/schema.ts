import { z } from "zod";

// Time categories for routines
export const TimeCategory = {
  AM: "AM",
  NOON: "NOON", 
  PM: "PM",
  ALL: "ALL"
} as const;

export type TimeCategoryType = typeof TimeCategory[keyof typeof TimeCategory];

// Milestone definitions
export const MILESTONES = [7, 21, 30, 50, 100, 365] as const;
export type Milestone = typeof MILESTONES[number];

// Routine schema
export const routineSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  timeCategories: z.array(z.enum(["AM", "NOON", "PM", "ALL"])).min(1, "Select at least one time"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  notificationEnabled: z.boolean().default(false),
  notificationTime: z.string().optional(),
});

export const insertRoutineSchema = routineSchema.omit({ id: true });

export type Routine = z.infer<typeof routineSchema>;
export type InsertRoutine = z.infer<typeof insertRoutineSchema>;

// Completion schema
export const completionSchema = z.object({
  id: z.string(),
  routineId: z.string(),
  date: z.string(),
  timeCategory: z.enum(["AM", "NOON", "PM", "ALL"]),
  completed: z.boolean().default(false),
});

export const insertCompletionSchema = completionSchema.omit({ id: true });

export type Completion = z.infer<typeof completionSchema>;
export type InsertCompletion = z.infer<typeof insertCompletionSchema>;

// Settings schema
export const settingsSchema = z.object({
  id: z.string(),
  notificationsEnabled: z.boolean().default(false),
  amNotificationTime: z.string().default("08:00"),
  noonNotificationTime: z.string().default("12:00"),
  pmNotificationTime: z.string().default("20:00"),
});

export const insertSettingsSchema = settingsSchema.omit({ id: true });
export const updateSettingsSchema = insertSettingsSchema.partial();

export type Settings = z.infer<typeof settingsSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;

// Dashboard stats type
export type DashboardStats = {
  currentStreak: number;
  longestStreak: number;
  completedCount: number;
  totalTasks: number;
  completionRate: number;
  periodLabel: string;
};

// Routine stats with streak and milestones
export type RoutineStats = {
  routineId: string;
  routineName: string;
  currentStreak: number;
  longestStreak: number;
  nextMilestone: Milestone | null;
  achievedMilestones: Milestone[];
  completionRate: number;
};

// Routine with completion status for daily view
export type RoutineWithStatus = Routine & {
  completions: { [timeCategory: string]: boolean };
};
