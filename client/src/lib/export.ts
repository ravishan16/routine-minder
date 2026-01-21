/**
 * Export utility for Routine Minder data
 * Supports JSON and CSV formats
 */

import { routinesApi, completionsApi } from "./storage";
import type { Routine, Completion } from "./schema";

export type ExportFormat = "json" | "csv";
export type ExportRange = "all" | "30" | "90" | "365";

interface ExportData {
  routines: Routine[];
  completions: Completion[];
  exportedAt: string;
  version: string;
}

// Download helper
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Convert data to CSV format
function routinesToCSV(routines: Routine[]): string {
  const headers = ["id", "name", "icon", "timeCategories", "isActive", "createdAt"];
  const rows = routines.map((r) => [
    r.id,
    `"${r.name.replace(/"/g, '""')}"`,
    r.icon || "✅",
    `"${r.timeCategories.join(",")}"`,
    r.isActive ? "true" : "false",
    r.createdAt || "",
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function completionsToCSV(completions: Completion[]): string {
  const headers = ["id", "routineId", "date", "timeCategory", "completedAt"];
  const rows = completions.map((c) => [
    c.id,
    c.routineId,
    c.date,
    c.timeCategory,
    c.completedAt || "",
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// Main export function
export async function exportData(
  format: ExportFormat,
  range: ExportRange = "all"
): Promise<void> {
  // Fetch data
  const routines = await routinesApi.getAll();
  const days = range === "all" ? 9999 : parseInt(range);
  const completions = await completionsApi.getRange(days);

  const data: ExportData = {
    routines,
    completions,
    exportedAt: new Date().toISOString(),
    version: "2.1.0",
  };

  const dateStr = new Date().toISOString().split("T")[0];

  if (format === "json") {
    const content = JSON.stringify(data, null, 2);
    downloadFile(content, `routine-minder-${dateStr}.json`, "application/json");
  } else {
    // Create a zip-like combined CSV
    const routinesCSV = routinesToCSV(routines);
    const completionsCSV = completionsToCSV(completions);
    
    const combined = `# Routine Minder Export - ${dateStr}
# Version: 2.1.0

## ROUTINES
${routinesCSV}

## COMPLETIONS
${completionsCSV}
`;
    downloadFile(combined, `routine-minder-${dateStr}.csv`, "text/csv");
  }
}

// Import function for restore
export async function importData(file: File): Promise<{ routines: number; completions: number }> {
  const content = await file.text();
  
  try {
    const data: ExportData = JSON.parse(content);
    
    if (!data.routines || !Array.isArray(data.routines)) {
      throw new Error("Invalid export file: missing routines");
    }
    
    // Import routines
    for (const routine of data.routines) {
      await routinesApi.create({
        name: routine.name,
        timeCategories: routine.timeCategories,
        icon: routine.icon,
      });
    }
    
    return {
      routines: data.routines.length,
      completions: data.completions?.length || 0,
    };
  } catch (e) {
    throw new Error("Failed to parse export file. Make sure it's a valid JSON export.");
  }
}
