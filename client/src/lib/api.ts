/**
 * Google Sheets API Client
 * Communicates with Google Apps Script Web App
 */

import type {
  Routine,
  DailyRoutine,
  Completion,
  Settings,
  Dashboard,
  CreateRoutineInput,
  ToggleCompletionInput,
} from "./schema";

// Pre-deployed Apps Script URL from environment variable
const ENV_SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "";

// Get the Apps Script URL from environment or localStorage
const getScriptUrl = (): string => {
  // First check localStorage (for manual override in settings)
  const localUrl = localStorage.getItem("routineMinder_scriptUrl");
  if (localUrl) return localUrl;
  
  // Then check environment variable
  if (ENV_SCRIPT_URL) return ENV_SCRIPT_URL;
  
  throw new Error("Google Apps Script URL not configured.");
};

// Check if API is configured
export function isApiConfigured(): boolean {
  return !!(localStorage.getItem("routineMinder_scriptUrl") || ENV_SCRIPT_URL);
}

// API request helper
async function apiRequest<T>(
  action: string,
  params: Record<string, string> = {},
  body?: unknown
): Promise<T> {
  const scriptUrl = getScriptUrl();
  const url = new URL(scriptUrl);
  url.searchParams.set("action", action);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const options: RequestInit = {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data as T;
}

// Routines API
export const routinesApi = {
  getAll: () => apiRequest<Routine[]>("getRoutines"),
  
  getById: (id: string) => apiRequest<Routine | null>("getRoutine", { id }),
  
  getDaily: (date: string) => 
    apiRequest<DailyRoutine[]>("getDailyRoutines", { date }),
  
  create: (data: CreateRoutineInput) =>
    apiRequest<Routine>("createRoutine", {}, data),
  
  update: (id: string, data: Partial<Routine>) =>
    apiRequest<Routine>("updateRoutine", { id }, data),
  
  delete: (id: string) => apiRequest<void>("deleteRoutine", { id }),
};

// Completions API
export const completionsApi = {
  getByDate: (date: string) =>
    apiRequest<Completion[]>("getCompletions", { date }),
  
  getRange: (days: number) =>
    apiRequest<Completion[]>("getCompletionsRange", { days: String(days) }),
  
  toggle: (data: ToggleCompletionInput) =>
    apiRequest<{ completed: boolean }>("toggleCompletion", {}, data),
};

// Dashboard API
export const dashboardApi = {
  getStats: (range: "week" | "month" | "year" = "week") =>
    apiRequest<Dashboard>("getDashboard", { range }),
  
  getRoutines: (range: "week" | "month" | "year" = "week") =>
    apiRequest<Routine[]>("getDashboardRoutines", { range }),
};

// Settings API
export const settingsApi = {
  get: () => apiRequest<Settings>("getSettings"),
  
  update: (data: Partial<Settings>) =>
    apiRequest<Settings>("updateSettings", {}, data),
};

// Export API
export const exportApi = {
  getData: () => apiRequest<{
    routines: Routine[];
    completions: Completion[];
    settings: Settings;
    exportedAt: string;
  }>("exportData"),
};

// Ping API to check connection
export const pingApi = () =>
  apiRequest<{ status: string; user: string }>("ping");

// Set the Apps Script URL (for manual override)
export const setScriptUrl = (url: string): void => {
  localStorage.setItem("routineMinder_scriptUrl", url);
};

// Get the current script URL (for display)
export const getConfiguredScriptUrl = (): string | null => {
  return localStorage.getItem("routineMinder_scriptUrl") || ENV_SCRIPT_URL || null;
};

// Clear user session
export const clearSession = (): void => {
  localStorage.removeItem("routineMinder_user");
  localStorage.removeItem("routineMinder_scriptUrl");
};
