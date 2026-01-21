/**
 * Routine Minder API - Cloudflare Worker with D1
 * Simple REST API for routine tracking
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  API_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://routine-minder.ravishankars.com', 'https://routine-minder.pages.dev'],
  credentials: true,
}));

// API Key Protection Middleware (skip for health check)
app.use('/api/*', async (c, next) => {
  const apiSecret = c.env.API_SECRET;
  
  // Skip if no secret configured (development)
  if (!apiSecret) {
    await next();
    return;
  }
  
  const apiKey = c.req.header('X-API-Key');
  if (apiKey !== apiSecret) {
    return c.json({ error: 'Unauthorized - Invalid API key' }, 401);
  }
  
  await next();
});

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

// Link device with Google account - PRIMARY AUTH METHOD
// If google_id exists, return that user (cross-device sync)
// If new google_id, create user or link to existing device user
app.post('/api/auth/google', async (c) => {
  const { idToken, deviceId } = await c.req.json();
  
  if (!idToken) {
    return c.json({ error: 'idToken required' }, 400);
  }

  try {
    // Decode JWT (basic validation - in production, verify with Google's public keys)
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      return c.json({ error: 'Invalid token format' }, 400);
    }

    const payload = JSON.parse(atob(parts[1]));
    const email = payload.email;
    const googleId = payload.sub;
    const displayName = payload.name || email.split('@')[0];
    const photoUrl = payload.picture || null;

    if (!email || !googleId) {
      return c.json({ error: 'Invalid token payload' }, 400);
    }

    // FIRST: Check if user with this google_id already exists (cross-device sync!)
    let existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE google_id = ?'
    ).bind(googleId).first();

    if (existingUser) {
      // User exists! Return their userId for sync
      // Update profile info in case it changed
      await c.env.DB.prepare(
        'UPDATE users SET email = ?, display_name = ?, photo_url = ? WHERE id = ?'
      ).bind(email, displayName, photoUrl, existingUser.id).run();

      return c.json({ 
        userId: existingUser.id, 
        email, 
        displayName,
        photoUrl,
        isNewUser: false,
        message: 'Welcome back! Your data will sync.'
      });
    }

    // NEW Google user - check if device already has an anonymous user
    let userId: string;
    
    if (deviceId) {
      const deviceUser = await c.env.DB.prepare(
        'SELECT * FROM users WHERE device_id = ?'
      ).bind(deviceId).first();

      if (deviceUser && !deviceUser.google_id) {
        // Link Google to existing anonymous device user
        await c.env.DB.prepare(
          'UPDATE users SET email = ?, google_id = ?, display_name = ?, photo_url = ? WHERE id = ?'
        ).bind(email, googleId, displayName, photoUrl, deviceUser.id).run();
        
        userId = deviceUser.id as string;
      } else {
        // Create new user with Google info
        userId = crypto.randomUUID();
        await c.env.DB.prepare(
          'INSERT INTO users (id, device_id, email, google_id, display_name, photo_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(userId, deviceId, email, googleId, displayName, photoUrl, new Date().toISOString()).run();
      }
    } else {
      // No deviceId - create new user with Google info only
      userId = crypto.randomUUID();
      await c.env.DB.prepare(
        'INSERT INTO users (id, device_id, email, google_id, display_name, photo_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(userId, `google_${googleId}`, email, googleId, displayName, photoUrl, new Date().toISOString()).run();
    }

    return c.json({ 
      userId, 
      email, 
      displayName,
      photoUrl,
      isNewUser: true,
      message: 'Account created! Start adding routines.'
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return c.json({ error: 'Failed to process Google token' }, 500);
  }
});

// ==================== USER STATS (Gamification) ====================

// Get user stats (for cross-device sync of gamification data)
app.get('/api/user/stats', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const user = await c.env.DB.prepare(
    'SELECT best_streak, total_xp, level FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return c.json({ bestStreak: 0, totalXp: 0, level: 1 });
  }

  return c.json({
    bestStreak: user.best_streak || 0,
    totalXp: user.total_xp || 0,
    level: user.level || 1,
  });
});

// Update user stats
app.put('/api/user/stats', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const { bestStreak, totalXp, level } = await c.req.json();

  await c.env.DB.prepare(
    'UPDATE users SET best_streak = ?, total_xp = ?, level = ? WHERE id = ?'
  ).bind(
    bestStreak || 0,
    totalXp || 0,
    level || 1,
    userId
  ).run();

  return c.json({ success: true });
});

// ==================== ROUTINES ====================

// Get all routines for user (excludes soft-deleted)
app.get('/api/routines', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM routines WHERE user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY sort_order'
  ).bind(userId).all();

  return c.json(results.map(r => ({
    id: r.id,
    name: r.name,
    icon: r.icon || '✅',
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

  const body = await c.req.json();
  const { name, icon, timeCategories, sortOrder, createdAt } = body;
  // Use client-provided ID to prevent duplicates, or generate new one
  const id = body.id || crypto.randomUUID();

  // Get max sort order (only if not provided by client)
  const maxOrder = sortOrder === undefined ? await c.env.DB.prepare(
    'SELECT MAX(sort_order) as max FROM routines WHERE user_id = ?'
  ).bind(userId).first() : null;

  await c.env.DB.prepare(
    'INSERT INTO routines (id, user_id, name, icon, time_categories, is_active, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id,
    userId,
    name,
    icon || '✅',
    JSON.stringify(timeCategories),
    1,
    sortOrder ?? ((maxOrder?.max as number) || 0) + 1,
    createdAt || new Date().toISOString()
  ).run();

  return c.json({ id, name, icon: icon || '✅', timeCategories, isActive: true, sortOrder, createdAt });
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
  if (updates.icon !== undefined) {
    sets.push('icon = ?');
    values.push(updates.icon);
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

// Soft-delete routine (preserves completion history)
app.delete('/api/routines/:id', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');

  // Soft delete - set is_deleted flag instead of removing
  await c.env.DB.prepare(
    'UPDATE routines SET is_deleted = 1, is_active = 0 WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();

  // Completions are preserved for historical stats!
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

  // Get active routines count (excluding deleted)
  const routineCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM routines WHERE user_id = ? AND is_active = 1 AND (is_deleted = 0 OR is_deleted IS NULL)'
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

// ==================== ACCOUNT MANAGEMENT ====================

// Delete user account and all data (GDPR compliance)
app.delete('/api/users/:userId', async (c) => {
  const requestUserId = c.req.header('X-User-Id');
  const targetUserId = c.req.param('userId');
  
  // Users can only delete their own account
  if (!requestUserId || requestUserId !== targetUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Delete all completions for user's routines
    await c.env.DB.prepare(`
      DELETE FROM completions WHERE routine_id IN (
        SELECT id FROM routines WHERE user_id = ?
      )
    `).bind(targetUserId).run();

    // Delete all routines
    await c.env.DB.prepare(
      'DELETE FROM routines WHERE user_id = ?'
    ).bind(targetUserId).run();

    // Delete achievements
    await c.env.DB.prepare(
      'DELETE FROM achievements WHERE user_id = ?'
    ).bind(targetUserId).run();

    // Delete user
    await c.env.DB.prepare(
      'DELETE FROM users WHERE id = ?'
    ).bind(targetUserId).run();

    return c.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

// ==================== SYNC ====================

// Bulk sync from localStorage (only completions - routines require online CRUD)
app.post('/api/sync', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const { completions } = await c.req.json();

  // Note: Routines are created/updated/deleted directly via their endpoints
  // This sync only handles offline-first completions

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
