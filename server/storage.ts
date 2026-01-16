import { randomUUID } from "crypto";
import type { 
  Routine, 
  InsertRoutine, 
  Completion, 
  InsertCompletion, 
  Settings, 
  UpdateSettings,
  RoutineWithStatus,
  DashboardStats,
  RoutineStats
} from "@shared/schema";
import { MILESTONES, type Milestone } from "@shared/schema";

export interface IStorage {
  // Routines
  getRoutines(): Promise<Routine[]>;
  getRoutine(id: string): Promise<Routine | undefined>;
  createRoutine(routine: InsertRoutine): Promise<Routine>;
  updateRoutine(id: string, routine: InsertRoutine): Promise<Routine | undefined>;
  deleteRoutine(id: string): Promise<boolean>;
  
  // Completions
  getCompletionsForDate(date: string): Promise<Completion[]>;
  getCompletionsByRoutine(routineId: string): Promise<Completion[]>;
  upsertCompletion(completion: InsertCompletion): Promise<Completion>;
  
  // Daily view
  getRoutinesWithStatus(date: string): Promise<RoutineWithStatus[]>;
  
  // Dashboard
  getDashboardStats(range: string): Promise<DashboardStats>;
  getRoutineStats(range: string): Promise<RoutineStats[]>;
  
  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: UpdateSettings): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private routines: Map<string, Routine>;
  private completions: Map<string, Completion>;
  private settings: Settings;

  constructor() {
    this.routines = new Map();
    this.completions = new Map();
    this.settings = {
      id: randomUUID(),
      notificationsEnabled: false,
      amNotificationTime: "08:00",
      noonNotificationTime: "12:00",
      pmNotificationTime: "20:00",
    };

    // Add sample routines
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleRoutines: InsertRoutine[] = [
      { name: "Take Vitamins", timeCategories: ["AM", "PM"], isActive: true, sortOrder: 0, notificationEnabled: false },
      { name: "Morning Journal", timeCategories: ["AM"], isActive: true, sortOrder: 1, notificationEnabled: false },
      { name: "Stretch", timeCategories: ["PM"], isActive: true, sortOrder: 2, notificationEnabled: false },
      { name: "Ukulele Practice", timeCategories: ["PM"], isActive: true, sortOrder: 3, notificationEnabled: false },
      { name: "No Alcohol", timeCategories: ["ALL"], isActive: true, sortOrder: 4, notificationEnabled: false },
      { name: "Drink 8 Glasses of Water", timeCategories: ["ALL"], isActive: true, sortOrder: 5, notificationEnabled: false },
    ];

    sampleRoutines.forEach((routine) => {
      const id = randomUUID();
      this.routines.set(id, { ...routine, id });
    });
  }

  // Routines
  async getRoutines(): Promise<Routine[]> {
    return Array.from(this.routines.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getRoutine(id: string): Promise<Routine | undefined> {
    return this.routines.get(id);
  }

  async createRoutine(insertRoutine: InsertRoutine): Promise<Routine> {
    const id = randomUUID();
    const routine: Routine = { 
      ...insertRoutine, 
      id,
      isActive: insertRoutine.isActive ?? true,
      sortOrder: insertRoutine.sortOrder ?? this.routines.size,
      notificationEnabled: insertRoutine.notificationEnabled ?? false,
    };
    this.routines.set(id, routine);
    return routine;
  }

  async updateRoutine(id: string, insertRoutine: InsertRoutine): Promise<Routine | undefined> {
    const existing = this.routines.get(id);
    if (!existing) return undefined;
    
    const updated: Routine = { ...existing, ...insertRoutine, id };
    this.routines.set(id, updated);
    return updated;
  }

  async deleteRoutine(id: string): Promise<boolean> {
    const deleted = this.routines.delete(id);
    // Also delete all completions for this routine
    const entries = Array.from(this.completions.entries());
    for (const [key, completion] of entries) {
      if (completion.routineId === id) {
        this.completions.delete(key);
      }
    }
    return deleted;
  }

  // Completions
  async getCompletionsForDate(date: string): Promise<Completion[]> {
    return Array.from(this.completions.values()).filter(c => c.date === date);
  }

  async getCompletionsByRoutine(routineId: string): Promise<Completion[]> {
    return Array.from(this.completions.values()).filter(c => c.routineId === routineId);
  }

  async upsertCompletion(insertCompletion: InsertCompletion): Promise<Completion> {
    // Find existing completion for this routine/date/category
    const key = `${insertCompletion.routineId}-${insertCompletion.date}-${insertCompletion.timeCategory}`;
    const existing = this.completions.get(key);
    
    if (existing) {
      const updated: Completion = { ...existing, completed: insertCompletion.completed };
      this.completions.set(key, updated);
      return updated;
    }
    
    const id = randomUUID();
    const completion: Completion = { ...insertCompletion, id, completed: insertCompletion.completed ?? false };
    this.completions.set(key, completion);
    return completion;
  }

  // Daily view with completion status
  async getRoutinesWithStatus(date: string): Promise<RoutineWithStatus[]> {
    const routines = await this.getRoutines();
    const completions = await this.getCompletionsForDate(date);
    
    return routines
      .filter(r => r.isActive)
      .map(routine => {
        const routineCompletions = completions.filter(c => c.routineId === routine.id);
        const completionMap: { [key: string]: boolean } = {};
        
        routine.timeCategories.forEach(cat => {
          const comp = routineCompletions.find(c => c.timeCategory === cat);
          completionMap[cat] = comp?.completed || false;
        });
        
        return { ...routine, completions: completionMap };
      });
  }

  // Dashboard stats
  async getDashboardStats(range: string): Promise<DashboardStats> {
    const { startDate, periodLabel } = this.getDateRange(range);
    const routines = await this.getRoutines();
    const activeRoutines = routines.filter(r => r.isActive);
    
    if (activeRoutines.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        completedCount: 0,
        totalTasks: 0,
        completionRate: 0,
        periodLabel,
      };
    }

    const completions = Array.from(this.completions.values())
      .filter(c => c.date >= startDate);
    
    // Calculate total expected tasks and completed
    const dates = this.getDatesBetween(startDate, this.formatDate(new Date()));
    let totalTasks = 0;
    let completedCount = 0;
    
    dates.forEach(date => {
      activeRoutines.forEach(routine => {
        routine.timeCategories.forEach(cat => {
          totalTasks++;
          const comp = completions.find(
            c => c.routineId === routine.id && c.date === date && c.timeCategory === cat && c.completed
          );
          if (comp) completedCount++;
        });
      });
    });
    
    // Calculate streaks (days where all routines were completed)
    const { currentStreak, longestStreak } = this.calculateStreaks(activeRoutines);
    
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    
    return {
      currentStreak,
      longestStreak,
      completedCount,
      totalTasks,
      completionRate,
      periodLabel,
    };
  }

  async getRoutineStats(range: string): Promise<RoutineStats[]> {
    const { startDate } = this.getDateRange(range);
    const routines = await this.getRoutines();
    const activeRoutines = routines.filter(r => r.isActive);
    
    const stats: RoutineStats[] = [];
    
    for (const routine of activeRoutines) {
      const completions = Array.from(this.completions.values())
        .filter(c => c.routineId === routine.id && c.date >= startDate);
      
      const { currentStreak, longestStreak } = this.calculateRoutineStreak(routine);
      
      // Calculate completion rate
      const dates = this.getDatesBetween(startDate, this.formatDate(new Date()));
      const totalTasks = dates.length * routine.timeCategories.length;
      const completedCount = completions.filter(c => c.completed).length;
      const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      
      // Calculate milestones
      const achievedMilestones = MILESTONES.filter(m => currentStreak >= m) as Milestone[];
      const nextMilestone = MILESTONES.find(m => m > currentStreak) || null;
      
      stats.push({
        routineId: routine.id,
        routineName: routine.name,
        currentStreak,
        longestStreak,
        nextMilestone,
        achievedMilestones,
        completionRate,
      });
    }
    
    return stats.sort((a, b) => b.currentStreak - a.currentStreak);
  }

  private calculateStreaks(routines: Routine[]): { currentStreak: number; longestStreak: number } {
    if (routines.length === 0) return { currentStreak: 0, longestStreak: 0 };
    
    const completions = Array.from(this.completions.values());
    const today = new Date();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Check last 365 days
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = this.formatDate(checkDate);
      
      // Check if all routines were completed for this day
      let allCompleted = true;
      for (const routine of routines) {
        for (const cat of routine.timeCategories) {
          const comp = completions.find(
            c => c.routineId === routine.id && c.date === dateStr && c.timeCategory === cat
          );
          if (!comp?.completed) {
            allCompleted = false;
            break;
          }
        }
        if (!allCompleted) break;
      }
      
      if (allCompleted) {
        tempStreak++;
        if (i === 0 || (i > 0 && tempStreak === i + 1)) {
          currentStreak = tempStreak;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (i === 0) currentStreak = 0;
        tempStreak = 0;
      }
    }
    
    return { currentStreak, longestStreak };
  }

  private calculateRoutineStreak(routine: Routine): { currentStreak: number; longestStreak: number } {
    const completions = Array.from(this.completions.values())
      .filter(c => c.routineId === routine.id);
    
    const today = new Date();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = this.formatDate(checkDate);
      
      // Check if all time categories were completed for this day
      const allCategoriesCompleted = routine.timeCategories.every(cat => {
        const comp = completions.find(c => c.date === dateStr && c.timeCategory === cat);
        return comp?.completed;
      });
      
      if (allCategoriesCompleted) {
        tempStreak++;
        if (i === 0 || tempStreak === i + 1) {
          currentStreak = tempStreak;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (i === 0) currentStreak = 0;
        tempStreak = 0;
      }
    }
    
    return { currentStreak, longestStreak };
  }

  private getDateRange(range: string): { startDate: string; periodLabel: string } {
    const today = new Date();
    let startDate: Date;
    let periodLabel: string;
    
    switch (range) {
      case "7d":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
        periodLabel = "Last 7 Days";
        break;
      case "30d":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 29);
        periodLabel = "Last 30 Days";
        break;
      case "ytd":
        startDate = new Date(today.getFullYear(), 0, 1);
        periodLabel = "Year to Date";
        break;
      case "all":
      default:
        startDate = new Date(2020, 0, 1);
        periodLabel = "All Time";
        break;
    }
    
    return { startDate: this.formatDate(startDate), periodLabel };
  }

  private getDatesBetween(start: string, end: string): string[] {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    while (startDate <= endDate) {
      dates.push(this.formatDate(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    
    return dates;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(updates: UpdateSettings): Promise<Settings> {
    this.settings = { ...this.settings, ...updates };
    return this.settings;
  }
}

export const storage = new MemStorage();
