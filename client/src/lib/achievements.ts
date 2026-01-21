/**
 * Routine Minder - Achievements & Gamification System
 * XP, Levels, Streaks, and Achievements
 */

import type { Completion, Routine } from "./schema";

// ==================== XP SYSTEM ====================

// XP per completion
export const XP_PER_COMPLETION = 10;

// Streak multipliers
export const STREAK_MULTIPLIERS = [
  { minDays: 30, multiplier: 2.0, label: "🔥 On Fire!" },
  { minDays: 14, multiplier: 1.5, label: "💪 Streak Bonus" },
  { minDays: 7, multiplier: 1.25, label: "⭐ Week Warrior" },
] as const;

// Get current multiplier based on streak
export function getStreakMultiplier(streak: number): { multiplier: number; label: string | null } {
  for (const tier of STREAK_MULTIPLIERS) {
    if (streak >= tier.minDays) {
      return { multiplier: tier.multiplier, label: tier.label };
    }
  }
  return { multiplier: 1.0, label: null };
}

// Calculate XP for a completion
export function calculateCompletionXP(streak: number): number {
  const { multiplier } = getStreakMultiplier(streak);
  return Math.round(XP_PER_COMPLETION * multiplier);
}

// ==================== LEVELS ====================

export const LEVELS = [
  { level: 1, name: "Novice", minXP: 0, icon: "🌱" },
  { level: 2, name: "Apprentice", minXP: 100, icon: "🌿" },
  { level: 3, name: "Practitioner", minXP: 500, icon: "🌳" },
  { level: 4, name: "Expert", minXP: 1500, icon: "⭐" },
  { level: 5, name: "Master", minXP: 5000, icon: "🏆" },
  { level: 6, name: "Legend", minXP: 15000, icon: "👑" },
] as const;

export type Level = (typeof LEVELS)[number];

// Get level from XP
export function getLevelFromXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

// Get next level info
export function getNextLevel(xp: number): { nextLevel: Level | null; xpNeeded: number; progress: number } {
  const currentLevel = getLevelFromXP(xp);
  const currentIndex = LEVELS.findIndex(l => l.level === currentLevel.level);
  
  if (currentIndex >= LEVELS.length - 1) {
    return { nextLevel: null, xpNeeded: 0, progress: 100 };
  }
  
  const nextLevel = LEVELS[currentIndex + 1];
  const xpNeeded = nextLevel.minXP - xp;
  const xpInLevel = xp - currentLevel.minXP;
  const xpForLevel = nextLevel.minXP - currentLevel.minXP;
  const progress = Math.round((xpInLevel / xpForLevel) * 100);
  
  return { nextLevel, xpNeeded, progress };
}

// ==================== ACHIEVEMENTS ====================

export type AchievementType = 
  | "streak" 
  | "completion" 
  | "perfect_day" 
  | "perfect_week" 
  | "time_category" 
  | "consistency"
  | "level";

export interface Achievement {
  key: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  requirement: number;
}

// All available achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  { key: "streak_7", type: "streak", name: "Week Warrior", description: "7-day streak", icon: "🔥", requirement: 7 },
  { key: "streak_21", type: "streak", name: "Habit Former", description: "21-day streak", icon: "💪", requirement: 21 },
  { key: "streak_30", type: "streak", name: "Monthly Master", description: "30-day streak", icon: "⭐", requirement: 30 },
  { key: "streak_50", type: "streak", name: "Unstoppable", description: "50-day streak", icon: "🚀", requirement: 50 },
  { key: "streak_100", type: "streak", name: "Century Club", description: "100-day streak", icon: "💯", requirement: 100 },
  { key: "streak_365", type: "streak", name: "Year of Dedication", description: "365-day streak", icon: "👑", requirement: 365 },
  
  // Total completion achievements
  { key: "complete_10", type: "completion", name: "Getting Started", description: "Complete 10 tasks", icon: "✅", requirement: 10 },
  { key: "complete_50", type: "completion", name: "Building Momentum", description: "Complete 50 tasks", icon: "📈", requirement: 50 },
  { key: "complete_100", type: "completion", name: "Centurion", description: "Complete 100 tasks", icon: "💯", requirement: 100 },
  { key: "complete_500", type: "completion", name: "High Achiever", description: "Complete 500 tasks", icon: "🏅", requirement: 500 },
  { key: "complete_1000", type: "completion", name: "Thousand Strong", description: "Complete 1000 tasks", icon: "🎖️", requirement: 1000 },
  
  // Perfect day/week achievements
  { key: "perfect_day_1", type: "perfect_day", name: "Perfect Day", description: "Complete all daily tasks", icon: "🌟", requirement: 1 },
  { key: "perfect_day_7", type: "perfect_day", name: "Perfect Week", description: "7 perfect days", icon: "🌈", requirement: 7 },
  { key: "perfect_day_30", type: "perfect_day", name: "Perfect Month", description: "30 perfect days", icon: "🏆", requirement: 30 },
  
  // Time category achievements
  { key: "am_50", type: "time_category", name: "Early Bird", description: "Complete 50 AM tasks", icon: "🌅", requirement: 50 },
  { key: "noon_50", type: "time_category", name: "Noon Champion", description: "Complete 50 NOON tasks", icon: "☀️", requirement: 50 },
  { key: "pm_50", type: "time_category", name: "Night Owl", description: "Complete 50 PM tasks", icon: "🌙", requirement: 50 },
  
  // Level achievements
  { key: "level_2", type: "level", name: "Rising Star", description: "Reach Level 2", icon: "🌿", requirement: 2 },
  { key: "level_3", type: "level", name: "On the Rise", description: "Reach Level 3", icon: "🌳", requirement: 3 },
  { key: "level_4", type: "level", name: "Expert Status", description: "Reach Level 4", icon: "⭐", requirement: 4 },
  { key: "level_5", type: "level", name: "Master Achiever", description: "Reach Level 5", icon: "🏆", requirement: 5 },
  { key: "level_6", type: "level", name: "Legendary", description: "Reach Level 6", icon: "👑", requirement: 6 },
];

// Get achievement by key
export function getAchievement(key: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.key === key);
}

// Progress toward a locked achievement
export interface AchievementProgress {
  achievement: Achievement;
  current: number;
  target: number;
  progress: number; // 0-100
  remaining: number;
  progressLabel: string;
}

// Calculate progress for locked achievements
export function getAchievementProgress(
  achievement: Achievement,
  stats: {
    currentStreak: number;
    bestStreak: number;
    totalCompletions: number;
    totalPerfectDays: number;
    amCompletions: number;
    noonCompletions: number;
    pmCompletions: number;
    level: { level: number };
  }
): AchievementProgress {
  let current = 0;
  let label = "";
  
  switch (achievement.type) {
    case "streak":
      current = stats.bestStreak;
      label = `${current}/${achievement.requirement} day streak`;
      break;
    case "completion":
      current = stats.totalCompletions;
      label = `${current}/${achievement.requirement} tasks`;
      break;
    case "perfect_day":
      current = stats.totalPerfectDays;
      label = `${current}/${achievement.requirement} perfect days`;
      break;
    case "time_category":
      if (achievement.key === "am_50") current = stats.amCompletions;
      else if (achievement.key === "noon_50") current = stats.noonCompletions;
      else if (achievement.key === "pm_50") current = stats.pmCompletions;
      label = `${current}/${achievement.requirement} tasks`;
      break;
    case "level":
      current = stats.level.level;
      label = `Level ${current}/${achievement.requirement}`;
      break;
    default:
      label = `${current}/${achievement.requirement}`;
  }
  
  const progress = Math.min(100, Math.round((current / achievement.requirement) * 100));
  const remaining = Math.max(0, achievement.requirement - current);
  
  return {
    achievement,
    current,
    target: achievement.requirement,
    progress,
    remaining,
    progressLabel: label,
  };
}

// ==================== STATS CALCULATION ====================

export interface GamificationStats {
  // XP & Level
  totalXP: number;
  level: Level;
  nextLevelProgress: number;
  xpToNextLevel: number;
  
  // Streaks
  currentStreak: number;
  bestStreak: number;
  streakMultiplier: { multiplier: number; label: string | null };
  
  // Completions
  totalCompletions: number;
  periodCompletions: number;
  completionRate: number;
  perfectDays: number;        // Within selected period
  totalPerfectDays: number;   // All time
  
  // Time category breakdown
  amCompletions: number;
  noonCompletions: number;
  pmCompletions: number;
  allDayCompletions: number;
  
  // Achievements
  unlockedAchievements: string[];
  recentAchievement: Achievement | null;
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Calculate all gamification stats
export function calculateGamificationStats(
  routines: Routine[],
  completions: Completion[],
  periodDays: number,
  savedBestStreak: number = 0
): GamificationStats {
  const today = new Date();
  const todayStr = formatDate(today);
  
  // Active routines only
  const activeRoutines = routines.filter(r => r.isActive);
  
  // Calculate current streak
  let currentStreak = 0;
  const checkDate = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(checkDate);
    const dayCompletions = completions.filter(c => c.date === dateStr);
    if (dayCompletions.length > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i > 0) {
      break;
    } else {
      // Allow skipping today if nothing completed yet
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }
  
  // Best streak (use saved or current, whichever is higher)
  const bestStreak = Math.max(savedBestStreak, currentStreak);
  
  // Period filter
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);
  const periodStartStr = formatDate(periodStart);
  
  const periodCompletions = completions.filter(c => c.date >= periodStartStr);
  const totalCompletions = completions.length;
  
  // Time category breakdown (all time)
  const amCompletions = completions.filter(c => c.timeCategory === "AM").length;
  const noonCompletions = completions.filter(c => c.timeCategory === "NOON").length;
  const pmCompletions = completions.filter(c => c.timeCategory === "PM").length;
  const allDayCompletions = completions.filter(c => c.timeCategory === "ALL").length;
  
  // Perfect days calculation (within selected period only)
  let perfectDays = 0;
  const periodDates = Array.from(new Set(periodCompletions.map(c => c.date))).sort().reverse();
  
  for (const date of periodDates) {
    const dayCompletions = completions.filter(c => c.date === date);
    const expectedTasks = activeRoutines.reduce((sum, r) => sum + r.timeCategories.length, 0);
    if (dayCompletions.length >= expectedTasks && expectedTasks > 0) {
      perfectDays++;
    }
  }
  
  // Total perfect days (all time) for lifetime stats
  let totalPerfectDays = 0;
  const allDates = Array.from(new Set(completions.map(c => c.date))).sort().reverse();
  
  for (const date of allDates) {
    const dayCompletions = completions.filter(c => c.date === date);
    const expectedTasks = activeRoutines.reduce((sum, r) => sum + r.timeCategories.length, 0);
    if (dayCompletions.length >= expectedTasks && expectedTasks > 0) {
      totalPerfectDays++;
    }
  }
  
  // Completion rate for period (capped at 100%)
  const expectedInPeriod = activeRoutines.reduce((sum, r) => sum + r.timeCategories.length, 0) * periodDays;
  const completionRate = expectedInPeriod > 0 
    ? Math.min(100, Math.round((periodCompletions.length / expectedInPeriod) * 100))
    : 0;
  
  // Calculate XP (10 XP per completion, simplified)
  const totalXP = totalCompletions * XP_PER_COMPLETION;
  
  // Level
  const level = getLevelFromXP(totalXP);
  const { xpNeeded, progress: nextLevelProgress } = getNextLevel(totalXP);
  
  // Streak multiplier
  const streakMultiplier = getStreakMultiplier(currentStreak);
  
  // Check unlocked achievements
  const unlockedAchievements: string[] = [];
  
  // Streak achievements
  ACHIEVEMENTS.filter(a => a.type === "streak").forEach(a => {
    if (bestStreak >= a.requirement) unlockedAchievements.push(a.key);
  });
  
  // Completion achievements
  ACHIEVEMENTS.filter(a => a.type === "completion").forEach(a => {
    if (totalCompletions >= a.requirement) unlockedAchievements.push(a.key);
  });
  
  // Perfect day achievements
  ACHIEVEMENTS.filter(a => a.type === "perfect_day").forEach(a => {
    if (perfectDays >= a.requirement) unlockedAchievements.push(a.key);
  });
  
  // Time category achievements
  if (amCompletions >= 50) unlockedAchievements.push("am_50");
  if (noonCompletions >= 50) unlockedAchievements.push("noon_50");
  if (pmCompletions >= 50) unlockedAchievements.push("pm_50");
  
  // Level achievements
  ACHIEVEMENTS.filter(a => a.type === "level").forEach(a => {
    if (level.level >= a.requirement) unlockedAchievements.push(a.key);
  });
  
  // Find most recent (highest tier) achievement
  const recentAchievement = unlockedAchievements.length > 0
    ? getAchievement(unlockedAchievements[unlockedAchievements.length - 1]) || null
    : null;
  
  return {
    totalXP,
    level,
    nextLevelProgress,
    xpToNextLevel: xpNeeded,
    currentStreak,
    bestStreak,
    streakMultiplier,
    totalCompletions,
    periodCompletions: periodCompletions.length,
    completionRate,
    perfectDays,
    totalPerfectDays,
    amCompletions,
    noonCompletions,
    pmCompletions,
    allDayCompletions,
    unlockedAchievements,
    recentAchievement,
  };
}

// ==================== PER-ROUTINE STATS ====================

export interface RoutineStats {
  routineId: string;
  routineName: string;
  routineIcon: string;
  currentStreak: number;
  totalCompletions: number;
  periodCompletions: number;
  completionRate: number;
}

export function calculateRoutineStats(
  routine: Routine,
  completions: Completion[],
  periodDays: number
): RoutineStats {
  const routineCompletions = completions.filter(c => c.routineId === routine.id);
  
  // Period filter
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);
  const periodStartStr = formatDate(periodStart);
  const periodCompletions = routineCompletions.filter(c => c.date >= periodStartStr);
  
  // Calculate routine-specific streak
  let currentStreak = 0;
  const checkDate = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(checkDate);
    const dayCompletions = routineCompletions.filter(c => c.date === dateStr);
    // Check if all time categories were completed
    const completedCategories = dayCompletions.map(c => c.timeCategory);
    const allCompleted = routine.timeCategories.every(cat => completedCategories.includes(cat));
    
    if (allCompleted) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i > 0) {
      break;
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }
  
  // Completion rate
  const expectedInPeriod = routine.timeCategories.length * periodDays;
  const completionRate = expectedInPeriod > 0 
    ? Math.round((periodCompletions.length / expectedInPeriod) * 100) 
    : 0;
  
  return {
    routineId: routine.id,
    routineName: routine.name,
    routineIcon: routine.icon || "✅",
    currentStreak,
    totalCompletions: routineCompletions.length,
    periodCompletions: periodCompletions.length,
    completionRate,
  };
}

// ==================== PERIOD HELPERS ====================

export type Period = "7d" | "30d" | "1y" | "ytd";

export function getPeriodDays(period: Period): number {
  const now = new Date();
  switch (period) {
    case "7d": return 7;
    case "30d": return 30;
    case "1y": return 365;
    case "ytd": {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
}

export function getPeriodLabel(period: Period): string {
  switch (period) {
    case "7d": return "Last 7 Days";
    case "30d": return "Last 30 Days";
    case "1y": return "Last Year";
    case "ytd": return "Year to Date";
  }
}
