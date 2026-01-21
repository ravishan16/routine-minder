/**
 * Routine Minder API - Cloudflare Worker with D1
 * Simple REST API for routine tracking
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://routine-minder.ravishankars.com', 'https://routine-minder.pages.dev'],
  credentials: true,
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'routine-minder-api' }));

// ==================== AUTH ====================

// Get or create device user
app.post('/api/auth/device', async (c) => {
  const { deviceId } = await c.req.json();
  
  if (!deviceId) {
    return c.json({ error: 'deviceId required' }, 400);
  }

  // Check if device exists
  let user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE device_id = ?'
  ).bind(deviceId).first();

  if (!user) {
    // Create new user (no default routines - user picks in onboarding)
    const userId = crypto.randomUUID();
    await c.env.DB.prepare(
      'INSERT INTO users (id, device_id, created_at) VALUES (?, ?, ?)'
    ).bind(userId, deviceId, new Date().toISOString()).run();

    user = { id: userId, device_id: deviceId };
  }

  return c.json({ userId: user.id, deviceId: user.device_id });
});

// ==================== ROUTINES ====================

// Get all routines for user
app.get('/api/routines', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM routines WHERE user_id = ? ORDER BY sort_order'
  ).bind(userId).all();

  return c.json(results.map(r => ({
    id: r.id,
    name: r.name,
    timeCategories: JSON.parse(r.time_categories as string),
    isActive: !!r.is_active,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  })));
});

// Create routine
app.post('/api/routines', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const { name, timeCategories } = await c.req.json();
  const id = crypto.randomUUID();

  // Get max sort order
  const maxOrder = await c.env.DB.prepare(
    'SELECT MAX(sort_order) as max FROM routines WHERE user_id = ?'
  ).bind(userId).first();

  await c.env.DB.prepare(
    'INSERT INTO routines (id, user_id, name, time_categories, is_active, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id,
    userId,
    name,
    JSON.stringify(timeCategories),
    1,
    ((maxOrder?.max as number) || 0) + 1,
    new Date().toISOString()
  ).run();

  return c.json({ id, name, timeCategories, isActive: true });
});

// Update routine
app.put('/api/routines/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const updates = await c.req.json();

  const sets: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    values.push(updates.name);
  }
  if (updates.timeCategories !== undefined) {
    sets.push('time_categories = ?');
    values.push(JSON.stringify(updates.timeCategories));
  }
  if (updates.isActive !== undefined) {
    sets.push('is_active = ?');
    values.push(updates.isActive ? 1 : 0);
  }
  if (updates.sortOrder !== undefined) {
    sets.push('sort_order = ?');
    values.push(updates.sortOrder);
  }

  if (sets.length === 0) {
    return c.json({ error: 'No updates provided' }, 400);
  }

  values.push(id, userId);

  await c.env.DB.prepare(
    `UPDATE routines SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...values).run();

  return c.json({ success: true });
});

// Delete routine
app.delete('/api/routines/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');

  await c.env.DB.prepare(
    'DELETE FROM routines WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();

  // Also delete completions
  await c.env.DB.prepare(
    'DELETE FROM completions WHERE routine_id = ?'
  ).bind(id).run();

  return c.json({ success: true });
});

// ==================== COMPLETIONS ====================

// Get completions for date range
app.get('/api/completions', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const date = c.req.query('date');
  const days = c.req.query('days');

  let query = 'SELECT c.* FROM completions c JOIN routines r ON c.routine_id = r.id WHERE r.user_id = ?';
  const params: any[] = [userId];

  if (date) {
    query += ' AND c.date = ?';
    params.push(date);
  } else if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    query += ' AND c.date >= ?';
    params.push(startDate.toISOString().split('T')[0]);
  }

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(results.map(r => ({
    id: r.id,
    routineId: r.routine_id,
    date: r.date,
    timeCategory: r.time_category,
    completedAt: r.completed_at,
  })));
});

// Toggle completion
app.post('/api/completions/toggle', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const { routineId, date, timeCategory } = await c.req.json();

  // Verify routine belongs to user
  const routine = await c.env.DB.prepare(
    'SELECT id FROM routines WHERE id = ? AND user_id = ?'
  ).bind(routineId, userId).first();

  if (!routine) {
    return c.json({ error: 'Routine not found' }, 404);
  }

  // Check if completion exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM completions WHERE routine_id = ? AND date = ? AND time_category = ?'
  ).bind(routineId, date, timeCategory).first();

  if (existing) {
    // Remove completion
    await c.env.DB.prepare(
      'DELETE FROM completions WHERE id = ?'
    ).bind(existing.id).run();
    return c.json({ completed: false });
  } else {
    // Add completion
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      'INSERT INTO completions (id, routine_id, date, time_category, completed_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, routineId, date, timeCategory, new Date().toISOString()).run();
    return c.json({ completed: true, id });
  }
});

// ==================== DASHBOARD ====================

app.get('/api/dashboard', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const today = new Date().toISOString().split('T')[0];

  // Get active routines count
  const routineCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM routines WHERE user_id = ? AND is_active = 1'
  ).bind(userId).first();

  // Get today's completions
  const todayCompletions = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM completions c JOIN routines r ON c.routine_id = r.id WHERE r.user_id = ? AND c.date = ?'
  ).bind(userId, today).first();

  // Get streak (simplified - days with at least one completion)
  const { results: recentCompletions } = await c.env.DB.prepare(
    'SELECT DISTINCT c.date FROM completions c JOIN routines r ON c.routine_id = r.id WHERE r.user_id = ? ORDER BY c.date DESC LIMIT 30'
  ).bind(userId).all();

  let streak = 0;
  const checkDate = new Date();
  for (let i = 0; i < 30; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (recentCompletions.some(r => r.date === dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i > 0) {
      break;
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return c.json({
    totalRoutines: routineCount?.count || 0,
    completedToday: todayCompletions?.count || 0,
    currentStreak: streak,
    weeklyCompletionRate: 0, // Simplified
  });
});

// ==================== SYNC ====================

// Bulk sync from localStorage
app.post('/api/sync', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const { routines, completions } = await c.req.json();

  // Sync routines
  if (routines && Array.isArray(routines)) {
    for (const r of routines) {
      await c.env.DB.prepare(`
        INSERT INTO routines (id, user_id, name, time_categories, is_active, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          time_categories = excluded.time_categories,
          is_active = excluded.is_active,
          sort_order = excluded.sort_order
      `).bind(
        r.id,
        userId,
        r.name,
        JSON.stringify(r.timeCategories),
        r.isActive ? 1 : 0,
        r.sortOrder || 0,
        r.createdAt || new Date().toISOString()
      ).run();
    }
  }

  // Sync completions
  if (completions && Array.isArray(completions)) {
    for (const c of completions) {
      await c.env.DB.prepare(`
        INSERT INTO completions (id, routine_id, date, time_category, completed_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `).bind(
        c.id,
        c.routineId,
        c.date,
        c.timeCategory,
        c.completedAt
      ).run();
    }
  }

  return c.json({ success: true });
});

export default app;
