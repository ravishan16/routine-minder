import { describe, it, expect } from 'vitest';
import {
    getStreakMultiplier,
    calculateCompletionXP,
    getLevelFromXP,
    getNextLevel,
    getAchievementProgress,
    getPeriodDays,
    LEVELS
} from './achievements';
import { calculateGamificationStats } from './stats';
import type { Routine, Completion } from './schema';

describe('Gamification Logic', () => {
    describe('Streak Multipliers', () => {
        it('should return base multiplier for 0 streak', () => {
            const { multiplier } = getStreakMultiplier(0);
            expect(multiplier).toBe(1.0);
        });

        it('should return base multiplier for low streak', () => {
            const { multiplier } = getStreakMultiplier(6);
            expect(multiplier).toBe(1.0);
        });

        it('should calculate Week Warrior streak', () => {
            const { multiplier, label } = getStreakMultiplier(7);
            expect(multiplier).toBe(1.25);
            expect(label).toBe('⭐ Week Warrior');
        });

        it('should calculate Streak Bonus', () => {
            const { multiplier, label } = getStreakMultiplier(14);
            expect(multiplier).toBe(1.5);
            expect(label).toBe('💪 Streak Bonus');
        });

        it('should calculate On Fire streak', () => {
            const { multiplier, label } = getStreakMultiplier(30);
            expect(multiplier).toBe(2.0);
            expect(label).toBe('🔥 On Fire!');
        });
    });

    describe('XP Calculation', () => {
        it('should calculate basic XP', () => {
            const xp = calculateCompletionXP(0);
            expect(xp).toBe(10);
        });

        it('should calculate streak bonus XP', () => {
            const xp = calculateCompletionXP(30);
            expect(xp).toBe(20); // 10 * 2.0
        });
    });

    describe('Level System', () => {
        it('should start at Level 1', () => {
            const level = getLevelFromXP(0);
            expect(level.level).toBe(1);
            expect(level.name).toBe('Novice');
        });

        it('should reach Level 2 at 100 XP', () => {
            const level = getLevelFromXP(100);
            expect(level.level).toBe(2);
            expect(level.name).toBe('Apprentice');
        });

        it('should reach Level 6 at 15000 XP', () => {
            const level = getLevelFromXP(15000);
            expect(level.level).toBe(6);
            expect(level.name).toBe('Legend');
        });

        it('should calculate next level progress correctly', () => {
            // Level 1 (0-100 XP), current 50 XP
            const { xpNeeded, progress, nextLevel } = getNextLevel(50);
            expect(nextLevel?.level).toBe(2);
            expect(xpNeeded).toBe(50);
            expect(progress).toBe(50);
        });

        it('should handle max level', () => {
            const { nextLevel, xpNeeded, progress } = getNextLevel(20000);
            expect(nextLevel).toBeNull();
            expect(xpNeeded).toBe(0);
            expect(progress).toBe(100);
        });
    });

    describe('Gamification Stats Calculation', () => {
        const mockRoutines: Routine[] = [
            {
                id: 'r1',
                userId: 'u1',
                name: 'Morning Routine',
                timeCategories: ['AM', 'NOON'],
                isActive: true,
                sortOrder: 1,
                createdAt: '2023-01-01'
            }
        ];

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        it('should calculate stats for empty data', () => {
            const stats = calculateGamificationStats([], [], 7);
            expect(stats.totalXP).toBe(0);
            expect(stats.currentStreak).toBe(0);
            expect(stats.completionRate).toBe(0);
        });

        it('should calculate current streak correctly', () => {
            // Completed yesterday, streak should start (if today is skipped, we check yesterday)
            const completions: Completion[] = [
                { id: 'c1', routineId: 'r1', date: yesterday, timeCategory: 'AM', completedAt: '...' },
                { id: 'c2', routineId: 'r1', date: yesterday, timeCategory: 'NOON', completedAt: '...' }
            ];

            const stats = calculateGamificationStats(mockRoutines, completions, 7);
            expect(stats.currentStreak).toBe(1);
        });

        it('should break streak if a day is missed', () => {
            const dayBeforeYesterday = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];

            const completions: Completion[] = [
                { id: 'c1', routineId: 'r1', date: dayBeforeYesterday, timeCategory: 'AM', completedAt: '...' },
                { id: 'c2', routineId: 'r1', date: dayBeforeYesterday, timeCategory: 'NOON', completedAt: '...' }
            ];

            const stats = calculateGamificationStats(mockRoutines, completions, 7);
            expect(stats.currentStreak).toBe(0);
        });

        it('should calculate completion rate correctly', () => {
            // 1 routine with 2 tasks/day = 14 tasks expected in 7 days
            // Completed 2 tasks (1 day)
            const completions: Completion[] = [
                { id: 'c1', routineId: 'r1', date: today, timeCategory: 'AM', completedAt: '...' },
                { id: 'c2', routineId: 'r1', date: today, timeCategory: 'NOON', completedAt: '...' }
            ];

            const stats = calculateGamificationStats(mockRoutines, completions, 7);
            const expectedTasks = 2 * 7;
            const expectedRate = Math.round((2 / expectedTasks) * 100);

            expect(stats.completionRate).toBe(expectedRate);
        });

        it('should track perfect days', () => {
            const completions: Completion[] = [
                { id: 'c1', routineId: 'r1', date: today, timeCategory: 'AM', completedAt: '...' },
                { id: 'c2', routineId: 'r1', date: today, timeCategory: 'NOON', completedAt: '...' }
            ];

            const stats = calculateGamificationStats(mockRoutines, completions, 7);
            expect(stats.perfectDays).toBe(1);
        });
    });

    describe('Achievement Progress', () => {
        it('should calculate progress towards locked achievement', () => {
            const achievement = {
                key: 'test',
                type: 'completion' as any,
                name: 'Test',
                description: 'Test',
                icon: 'T',
                requirement: 100
            };

            const stats = {
                currentStreak: 0,
                bestStreak: 0,
                totalCompletions: 25,
                totalPerfectDays: 0,
                amCompletions: 0,
                noonCompletions: 0,
                pmCompletions: 0,
                level: { level: 1 }
            };

            const progress = getAchievementProgress(achievement, stats);
            expect(progress.progress).toBe(25);
            expect(progress.remaining).toBe(75);
        });
    });

    describe('Period Helpers', () => {
        it('should return correct days for periods', () => {
            expect(getPeriodDays('7d')).toBe(7);
            expect(getPeriodDays('30d')).toBe(30);
            expect(getPeriodDays('1y')).toBe(365);
        });
    });
});
