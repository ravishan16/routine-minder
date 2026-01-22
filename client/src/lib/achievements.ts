/**
 * Routine Minder - Achievements & Gamification Definitions
 * XP Constants, Level Definitions, and Achievement Metadata
 */

// ==================== XP SYSTEM ====================

/** XP earned per verified completion */
export const XP_PER_COMPLETION = 10;

/** Streak multiplier tiers */
export const STREAK_MULTIPLIERS = [
  { minDays: 30, multiplier: 2.0, label: "🔥 On Fire!" },
  { minDays: 14, multiplier: 1.5, label: "💪 Streak Bonus" },
  { minDays: 7, multiplier: 1.25, label: "⭐ Week Warrior" },
] as const;

/**
 * Gets the current XP multiplier based on streak length.
 * @param streak Current day streak
 */
export function getStreakMultiplier(streak: number): { multiplier: number; label: string | null } {
  for (const tier of STREAK_MULTIPLIERS) {
    if (streak >= tier.minDays) {
      return { multiplier: tier.multiplier, label: tier.label };
    }
  }
  return { multiplier: 1.0, label: null };
}

/**
 * Calculates XP for a single completion with streak bonus.
 * @param streak Current day streak
 */
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

// Export lowercase alias for compatibility
export const levels = LEVELS;

/**
 * Determines the user's level based on total XP.
 * @param xp Total accumulated XP
 */
export function getLevelFromXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

/**
 * Calculates progress toward the next level.
 * @param xp Total accumulated XP
 */
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

/** List of all available achievements in the system */
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

/**
 * Finds an achievement by its unique key.
 */
export function getAchievement(key: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.key === key);
}

// Streak milestones for per-routine display
const STREAK_MILESTONES = [7, 21, 30, 50, 100, 365];

/**
 * Calculates progress to the next streak milestone.
 */
export function getNextStreakMilestone(currentStreak: number): { target: number; remaining: number; progress: number } | null {
  const nextTarget = STREAK_MILESTONES.find(m => m > currentStreak);
  if (!nextTarget) return null; // Already past all milestones

  // Find previous milestone (or 0)
  const prevMilestoneIndex = STREAK_MILESTONES.findIndex(m => m === nextTarget) - 1;
  const prevMilestone = prevMilestoneIndex >= 0 ? STREAK_MILESTONES[prevMilestoneIndex] : 0;

  const remaining = nextTarget - currentStreak;
  const progressInSegment = currentStreak - prevMilestone;
  const segmentSize = nextTarget - prevMilestone;
  const progress = Math.round((progressInSegment / segmentSize) * 100);

  return { target: nextTarget, remaining, progress };
}

export interface AchievementProgress {
  achievement: Achievement;
  current: number;
  target: number;
  progress: number; // 0-100
  remaining: number;
  progressLabel: string;
}

/**
 * Calculates progress for a locked achievement.
 */
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

// ==================== PERIOD HELPERS ====================

export type Period = "7d" | "30d" | "1y" | "ytd";

/**
 * Returns the number of days for a given period constant.
 */
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

/**
 * Returns a human-readable label for a period constant.
 */
export function getPeriodLabel(period: Period): string {
  switch (period) {
    case "7d": return "Last 7 Days";
    case "30d": return "Last 30 Days";
    case "1y": return "Last Year";
    case "ytd": return "Year to Date";
  }
}
