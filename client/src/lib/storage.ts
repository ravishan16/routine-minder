/**
 * Routine Minder - Simple Storage
 * localStorage-first with background sync to Cloudflare D1
 */

import type { Routine, Completion, Dashboard, TimeCategory } from "./schema";

// API URL - Worker
const API_URL = import.meta.env.VITE_API_URL || "https://routine-minder-api.ravishankar-sivasubramaniam.workers.dev";

// API Key for protection (set in .env)
const API_KEY = import.meta.env.VITE_API_KEY || "";

// Storage keys
const KEYS = {
  userId: "rm_userId",
  deviceId: "rm_deviceId",
  routines: "rm_routines",
  completions: "rm_completions",
  lastSync: "rm_lastSync",
  onboarded: "rm_onboarded",
  visited: "rm_visited",
  bestStreak: "rm_bestStreak",
};

// Generate device ID
function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(KEYS.deviceId);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(KEYS.deviceId, deviceId);
  }
  return deviceId;
}

// Get user ID
function getUserId(): string | null {
  return localStorage.getItem(KEYS.userId);
}

// Storage helpers
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// API helper
async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const userId = getUserId();
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        ...(userId ? { "X-User-Id": userId } : {}),
        ...options.headers,
      },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ==================== AUTH ====================

export async function initAuth(): Promise<boolean> {
  const deviceId = getOrCreateDeviceId();
  let userId = getUserId();

  if (!userId) {
    // Register device with API
    const result = await api<{ userId: string }>("/api/auth/device", {
      method: "POST",
      body: JSON.stringify({ deviceId }),
    });

    if (result?.userId) {
      localStorage.setItem(KEYS.userId, result.userId);
      userId = result.userId;
      
      // Fetch initial data from server
      await syncFromServer();
      return true;
    }
    
    // Offline - create local-only user
    const localUserId = `local_${crypto.randomUUID()}`;
    localStorage.setItem(KEYS.userId, localUserId);
    return true;
  }

  // User exists, try to sync
  syncFromServer();
  return true;
}

export function isAuthenticated(): boolean {
  return !!getUserId();
}

// Check if user has completed onboarding
export function isOnboarded(): boolean {
  return localStorage.getItem(KEYS.onboarded) === "true";
}

// Mark onboarding as complete
export function setOnboarded(): void {
  localStorage.setItem(KEYS.onboarded, "true");
}

// ==================== SYNC ====================

async function syncFromServer(): Promise<void> {
  const [routines, completions] = await Promise.all([
    api<Routine[]>("/api/routines"),
    api<Completion[]>("/api/completions?days=30"),
  ]);

  if (routines) saveToStorage(KEYS.routines, routines);
  if (completions) saveToStorage(KEYS.completions, completions);
  localStorage.setItem(KEYS.lastSync, new Date().toISOString());
}

// Public sync function for after Google Sign-In on new device
// Returns true if routines were restored from server
export async function syncFromServerAfterGoogleSignIn(): Promise<boolean> {
  const [routines, completions] = await Promise.all([
    api<Routine[]>("/api/routines"),
    api<Completion[]>("/api/completions?days=30"),
  ]);

  const hasRoutines = routines && routines.length > 0;
  
  if (hasRoutines) {
    saveToStorage(KEYS.routines, routines);
    // Mark as onboarded if we have routines from server
    localStorage.setItem(KEYS.onboarded, "true");
    // Also mark as visited
    localStorage.setItem(KEYS.visited, "true");
  }
  if (completions) saveToStorage(KEYS.completions, completions);
  localStorage.setItem(KEYS.lastSync, new Date().toISOString());
  
  return hasRoutines ?? false;
}

async function syncToServer(): Promise<void> {
  const routines = getFromStorage<Routine[]>(KEYS.routines, []);
  const completions = getFromStorage<Completion[]>(KEYS.completions, []);

  await api("/api/sync", {
    method: "POST",
    body: JSON.stringify({ routines, completions }),
  });
}

// Background sync
export function startBackgroundSync(): void {
  // Sync every 5 minutes
  setInterval(() => {
    if (navigator.onLine) {
      syncToServer();
    }
  }, 5 * 60 * 1000);

  // Sync when coming online
  window.addEventListener("online", () => {
    syncToServer();
  });
}

// ==================== ROUTINES ====================

export const routinesApi = {
  getAll: async (): Promise<Routine[]> => {
    return getFromStorage<Routine[]>(KEYS.routines, []);
  },

  getDaily: async (date: string): Promise<(Routine & { 
    completedCategories: string[];
    isFullyCompleted: boolean;
  })[]> => {
    const routines = getFromStorage<Routine[]>(KEYS.routines, []);
    const completions = getFromStorage<Completion[]>(KEYS.completions, []);

    return routines
      .filter((r) => r.isActive)
      .map((r) => {
        // Get all completed time categories for this routine on this date
        const routineCompletions = completions.filter(
          (c) => c.routineId === r.id && c.date === date
        );
        const completedCategories = routineCompletions.map((c) => c.timeCategory);
        return {
          ...r,
          completedCategories,
          isFullyCompleted: r.timeCategories.every((cat) => completedCategories.includes(cat)),
        };
      });
  },

  create: async (data: { name: string; icon?: string; timeCategories: TimeCategory[] }): Promise<Routine> => {
    const routines = getFromStorage<Routine[]>(KEYS.routines, []);
    const newRoutine: Routine = {
      id: crypto.randomUUID(),
      name: data.name,
      icon: data.icon || "✅",
      timeCategories: data.timeCategories,
      isActive: true,
      sortOrder: routines.length,
      createdAt: new Date().toISOString(),
    };
    routines.push(newRoutine);
    saveToStorage(KEYS.routines, routines);

    // Sync to server
    api("/api/routines", {
      method: "POST",
      body: JSON.stringify(data),
    });

    return newRoutine;
  },

  update: async (id: string, data: Partial<Routine>): Promise<Routine> => {
    const routines = getFromStorage<Routine[]>(KEYS.routines, []);
    const index = routines.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Routine not found");
    
    routines[index] = { ...routines[index], ...data };
    saveToStorage(KEYS.routines, routines);

    // Sync to server
    api(`/api/routines/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    return routines[index];
  },

  delete: async (id: string): Promise<void> => {
    const routines = getFromStorage<Routine[]>(KEYS.routines, []);
    const filtered = routines.filter((r) => r.id !== id);
    saveToStorage(KEYS.routines, filtered);

    // KEEP completions for historical stats! Don't delete them.
    // The server soft-deletes, so history is preserved.

    // Sync to server (server will soft-delete)
    api(`/api/routines/${id}`, { method: "DELETE" });
  },
};

// ==================== COMPLETIONS ====================

export const completionsApi = {
  getByDate: async (date: string): Promise<Completion[]> => {
    const completions = getFromStorage<Completion[]>(KEYS.completions, []);
    return completions.filter((c) => c.date === date);
  },

  getRange: async (days: number): Promise<Completion[]> => {
    const completions = getFromStorage<Completion[]>(KEYS.completions, []);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = formatDate(startDate);
    return completions.filter((c) => c.date >= startStr);
  },

  toggle: async (data: { routineId: string; date: string; timeCategory: string }): Promise<{ completed: boolean }> => {
    const completions = getFromStorage<Completion[]>(KEYS.completions, []);
    const existingIndex = completions.findIndex(
      (c) => c.routineId === data.routineId && c.date === data.date && c.timeCategory === data.timeCategory
    );

    if (existingIndex >= 0) {
      completions.splice(existingIndex, 1);
      saveToStorage(KEYS.completions, completions);
      api("/api/completions/toggle", { method: "POST", body: JSON.stringify(data) });
      return { completed: false };
    } else {
      const newCompletion: Completion = {
        id: crypto.randomUUID(),
        routineId: data.routineId,
        date: data.date,
        timeCategory: data.timeCategory,
        completedAt: new Date().toISOString(),
      };
      completions.push(newCompletion);
      saveToStorage(KEYS.completions, completions);
      api("/api/completions/toggle", { method: "POST", body: JSON.stringify(data) });
      return { completed: true };
    }
  },
};

// ==================== DASHBOARD ====================

export const dashboardApi = {
  get: async (): Promise<Dashboard> => {
    const routines = getFromStorage<Routine[]>(KEYS.routines, []);
    const completions = getFromStorage<Completion[]>(KEYS.completions, []);
    const today = formatDate(new Date());

    const activeRoutines = routines.filter((r) => r.isActive);
    const todaysCompletions = completions.filter((c) => c.date === today);

    // Calculate streak
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = formatDate(checkDate);
      const dayCompletions = completions.filter((c) => c.date === dateStr);
      if (dayCompletions.length > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i > 0) {
        break;
      } else {
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Persist best streak
    const savedBestStreak = getFromStorage<number>(KEYS.bestStreak, 0);
    const bestStreak = Math.max(savedBestStreak, streak);
    if (bestStreak > savedBestStreak) {
      saveToStorage(KEYS.bestStreak, bestStreak);
    }

    // Weekly completion rate
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCompletions = completions.filter((c) => c.date >= formatDate(weekAgo));
    const weeklyExpected = activeRoutines.reduce((sum, r) => sum + r.timeCategories.length, 0) * 7;
    const weeklyRate = weeklyExpected > 0 ? Math.round((weekCompletions.length / weeklyExpected) * 100) : 0;

    return {
      totalRoutines: activeRoutines.length,
      completedToday: todaysCompletions.length,
      totalToday: activeRoutines.reduce((sum, r) => sum + r.timeCategories.length, 0),
      currentStreak: streak,
      bestStreak,
      weeklyCompletionRate: weeklyRate,
    };
  },

  // Get all completions for gamification
  getAllCompletions: async (): Promise<Completion[]> => {
    return getFromStorage<Completion[]>(KEYS.completions, []);
  },

  // Get saved best streak
  getBestStreak: (): number => {
    return getFromStorage<number>(KEYS.bestStreak, 0);
  },
};

// ==================== SETTINGS ====================

export const settingsApi = {
  get: async () => {
    return getFromStorage("rm_settings", { theme: "system", notifications: false });
  },
  update: async (data: any) => {
    const current = await settingsApi.get();
    const updated = { ...current, ...data };
    saveToStorage("rm_settings", updated);
    return updated;
  },
};

// ==================== LANDING PAGE ====================

export function hasVisited(): boolean {
  return localStorage.getItem(KEYS.visited) === "true";
}

export function setVisited(): void {
  localStorage.setItem(KEYS.visited, "true");
}

// ==================== GOOGLE AUTH ====================

// Google user type
export type GoogleUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
};

const GOOGLE_USER_KEY = "rm_google_user";

// Get stored Google user (sync version for initial state)
export function getGoogleUserSync(): GoogleUser | null {
  try {
    const stored = localStorage.getItem(GOOGLE_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Get stored Google user
export async function getGoogleUser(): Promise<GoogleUser | null> {
  return getGoogleUserSync();
}

// Check if signed in with Google
export function isGoogleSignedIn(): boolean {
  return localStorage.getItem(GOOGLE_USER_KEY) !== null;
}

// Sign in with Google (using Google One Tap or popup)
// This is the PRIMARY auth method - returns existing user data for cross-device sync
export async function signInWithGoogle(): Promise<GoogleUser & { isNewUser: boolean }> {
  // Check if Google Identity Services is loaded
  if (!window.google?.accounts?.id) {
    throw new Error("Google Sign-In not loaded. Please try again.");
  }

  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      reject(new Error("Google Client ID not configured"));
      return;
    }

    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential: string }) => {
        try {
          // Decode the JWT credential for local user info
          const payload = JSON.parse(atob(response.credential.split(".")[1]));
          
          // Call server - this will lookup by google_id first for cross-device sync
          const result = await api<{
            userId: string;
            email: string;
            displayName: string;
            photoUrl: string | null;
            isNewUser: boolean;
            message: string;
          }>("/api/auth/google", {
            method: "POST",
            body: JSON.stringify({
              idToken: response.credential,
              deviceId: getOrCreateDeviceId(),
            }),
          });

          if (!result) {
            throw new Error("Failed to authenticate with server");
          }

          // Store the userId from server - this is the KEY for cross-device sync
          localStorage.setItem(KEYS.userId, result.userId);

          const user: GoogleUser = {
            uid: payload.sub,
            email: result.email,
            displayName: result.displayName,
            photoURL: result.photoUrl,
          };

          // Store user locally
          localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));

          // If returning user (not new), sync their data from server
          if (!result.isNewUser) {
            await syncFromServer();
          }

          // Mark as visited since they've authenticated
          localStorage.setItem(KEYS.visited, "true");

          resolve({ ...user, isNewUser: result.isNewUser });
        } catch (error) {
          reject(error);
        }
      },
    });

    // Prompt the user to sign in
    window.google!.accounts.id.prompt((notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fall back to popup - create visible button
        const buttonContainer = document.createElement("div");
        buttonContainer.id = "google-signin-fallback";
        buttonContainer.style.position = "fixed";
        buttonContainer.style.top = "50%";
        buttonContainer.style.left = "50%";
        buttonContainer.style.transform = "translate(-50%, -50%)";
        buttonContainer.style.zIndex = "9999";
        buttonContainer.style.padding = "20px";
        buttonContainer.style.background = "white";
        buttonContainer.style.borderRadius = "12px";
        buttonContainer.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
        document.body.appendChild(buttonContainer);
        
        window.google!.accounts.id.renderButton(buttonContainer, { 
          theme: "outline", 
          size: "large",
          text: "signin_with",
          shape: "rectangular"
        });
        
        // Clean up after a delay
        setTimeout(() => {
          const el = document.getElementById("google-signin-fallback");
          if (el) el.remove();
        }, 60000);
      }
    });
  });
}

// Sign out from Google
export async function signOutGoogle(): Promise<void> {
  localStorage.removeItem(GOOGLE_USER_KEY);
  
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
}

// Delete entire account (server + local)
export async function deleteAccount(): Promise<boolean> {
  const userId = getUserId();
  if (!userId) return false;

  // Delete from server
  const result = await api<{ success: boolean }>(`/api/users/${userId}`, {
    method: "DELETE",
  });

  // Clear all local data regardless of server result
  localStorage.clear();
  
  return result?.success ?? false;
}

// Declare Google global types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
