import type { Completion, Routine } from "./schema";
import {
    type Level,
    type Achievement,
    ACHIEVEMENTS,
    levels,
    getStreakMultiplier,
    getLevelFromXP,
    getNextLevel,
    getAchievement,
    XP_PER_COMPLETION
} from "./achievements";

// ==================== STATS INTERFACES ====================

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

export interface RoutineStats {
    routineId: string;
    routineName: string;
    routineIcon: string;
    currentStreak: number;
    totalCompletions: number;
    periodCompletions: number;
    completionRate: number;
}

// ==================== CALCULATION LOGIC ====================

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

/**
 * Calculates overall gamification statistics for the user.
 * Includes XP, Levels, Streaks, Period Stats, and Achievements.
 */
export function calculateGamificationStats(
    routines: Routine[],
    completions: Completion[],
    periodDays: number,
    savedBestStreak: number = 0
): GamificationStats {
    // Active routines only
    const activeRoutines = routines.filter(r => r.isActive);

    // Calculate current streak (days with ALL tasks completed)
    let currentStreak = 0;
    const checkDate = new Date();

    for (let i = 0; i < 365; i++) {
        const dateStr = formatDate(checkDate);
        const dayCompletions = completions.filter(c => c.date === dateStr);
        const expectedTasks = activeRoutines.reduce((sum, r) => sum + r.timeCategories.length, 0);

        // Check if all tasks were completed for this day
        const isComplete = expectedTasks > 0 && dayCompletions.length >= expectedTasks;

        if (isComplete) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
            // Today not complete yet, check yesterday for streak start
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // Gap found, streak is broken
            break;
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

    // Perfect days calculation
    let perfectDays = 0;
    const periodDates = Array.from(new Set(periodCompletions.map(c => c.date))).sort().reverse();

    for (const date of periodDates) {
        const dayCompletions = completions.filter(c => c.date === date);
        const expectedTasks = activeRoutines.reduce((sum, r) => sum + r.timeCategories.length, 0);
        if (dayCompletions.length >= expectedTasks && expectedTasks > 0) {
            perfectDays++;
        }
    }

    // Total perfect days (all time)
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

    // Calculate XP
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

    // Find most recent achievement
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

/**
 * Calculates statistics for a specific routine.
 */
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

        // Check if all time categories were completed for this routine on this day
        const completedCategories = dayCompletions.map(c => c.timeCategory);
        const allCompleted = routine.timeCategories.every(cat => completedCategories.includes(cat));

        if (allCompleted) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            if (i === 0) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            break;
        }
    }

    // Completion rate for the period
    const expectedInPeriod = routine.timeCategories.length * periodDays;
    const completionRate = expectedInPeriod > 0
        ? Math.min(100, Math.round((periodCompletions.length / expectedInPeriod) * 100))
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
