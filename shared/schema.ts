import { z } from "zod";

// Time categories for routines
export const TimeCategory = {
  AM: "AM",
  NOON: "NOON", 
  PM: "PM",
  ALL: "ALL"
} as const;

export type TimeCategoryType = typeof TimeCategory[keyof typeof TimeCategory];

// Routine type
export const routineSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  timeCategories: z.array(z.enum(["AM", "NOON", "PM", "ALL"])),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export const insertRoutineSchema = routineSchema.omit({ id: true });

export type Routine = z.infer<typeof routineSchema>;
export type InsertRoutine = z.infer<typeof insertRoutineSchema>;

// Completion type - tracks when routines are marked complete
export const completionSchema = z.object({
  id: z.string(),
  routineId: z.string(),
  date: z.string(), // YYYY-MM-DD format
  timeCategory: z.enum(["AM", "NOON", "PM", "ALL"]),
  completed: z.boolean().default(false),
});

export const insertCompletionSchema = completionSchema.omit({ id: true });

export type Completion = z.infer<typeof completionSchema>;
export type InsertCompletion = z.infer<typeof insertCompletionSchema>;

// Settings type
export const settingsSchema = z.object({
  id: z.string(),
  notificationsEnabled: z.boolean().default(false),
  amNotificationTime: z.string().default("08:00"),
  noonNotificationTime: z.string().default("12:00"),
  pmNotificationTime: z.string().default("20:00"),
});

export const insertSettingsSchema = settingsSchema.omit({ id: true });

export type Settings = z.infer<typeof settingsSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Dashboard stats type
export type DashboardStats = {
  currentStreak: number;
  longestStreak: number;
  completedCount: number;
  totalTasks: number;
  completionRate: number;
};

// Routine with completion status for daily view
export type RoutineWithStatus = Routine & {
  completions: { [timeCategory: string]: boolean };
};
