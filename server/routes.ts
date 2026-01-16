import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRoutineSchema, insertCompletionSchema, updateSettingsSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === ROUTINES ===
  
  // Get all routines
  app.get("/api/routines", async (req, res) => {
    try {
      const routines = await storage.getRoutines();
      res.json(routines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch routines" });
    }
  });

  // Get routines with completion status for a specific date
  app.get("/api/routines/daily", async (req, res) => {
    try {
      const date = req.query.param0 as string || new Date().toISOString().split('T')[0];
      const routines = await storage.getRoutinesWithStatus(date);
      res.json(routines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily routines" });
    }
  });

  // Get single routine
  app.get("/api/routines/:id", async (req, res) => {
    try {
      const routine = await storage.getRoutine(req.params.id);
      if (!routine) {
        return res.status(404).json({ error: "Routine not found" });
      }
      res.json(routine);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch routine" });
    }
  });

  // Create routine
  app.post("/api/routines", async (req, res) => {
    try {
      const parsed = insertRoutineSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const routine = await storage.createRoutine(parsed.data);
      res.status(201).json(routine);
    } catch (error) {
      res.status(500).json({ error: "Failed to create routine" });
    }
  });

  // Update routine
  app.put("/api/routines/:id", async (req, res) => {
    try {
      const parsed = insertRoutineSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const routine = await storage.updateRoutine(req.params.id, parsed.data);
      if (!routine) {
        return res.status(404).json({ error: "Routine not found" });
      }
      res.json(routine);
    } catch (error) {
      res.status(500).json({ error: "Failed to update routine" });
    }
  });

  // Delete routine
  app.delete("/api/routines/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRoutine(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Routine not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete routine" });
    }
  });

  // === COMPLETIONS ===

  // Toggle completion
  app.post("/api/completions", async (req, res) => {
    try {
      const parsed = insertCompletionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const completion = await storage.upsertCompletion(parsed.data);
      res.status(201).json(completion);
    } catch (error) {
      res.status(500).json({ error: "Failed to update completion" });
    }
  });

  // Get completions for a date
  app.get("/api/completions", async (req, res) => {
    try {
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const completions = await storage.getCompletionsForDate(date);
      res.json(completions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch completions" });
    }
  });

  // === DASHBOARD ===

  // Get dashboard stats
  app.get("/api/dashboard", async (req, res) => {
    try {
      const range = req.query.param0 as string || "7d";
      const stats = await storage.getDashboardStats(range);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Get routine-specific stats
  app.get("/api/dashboard/routines", async (req, res) => {
    try {
      const range = req.query.param0 as string || "7d";
      const stats = await storage.getRoutineStats(range);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch routine stats" });
    }
  });

  // === SETTINGS ===

  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update settings
  app.put("/api/settings", async (req, res) => {
    try {
      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const settings = await storage.updateSettings(parsed.data);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  return httpServer;
}
