/**
 * Routine Minder API - Cloudflare Worker with D1
 * Simple REST API for routine tracking
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  API_SECRET?: string;
  OURA_CLIENT_ID?: string;
  OURA_CLIENT_SECRET?: string;
  OURA_REDIRECT_URI?: string;
  OURA_ALLOWED_EMAIL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const OURA_AUTH_URL = 'https://cloud.ouraring.com/oauth/authorize';
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token';
const OURA_API_BASE = 'https://api.ouraring.com/v2/usercollection';

type OuraTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

function toIsoAfterSeconds(seconds?: number): string | null {
  if (!seconds || Number.isNaN(seconds)) return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function shiftIsoDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().startsWith(value);
}

function getOuraRedirectUri(c: { env: Bindings }): string {
  return c.env.OURA_REDIRECT_URI || 'https://routine-minder.ravishankars.com';
}

async function getUserEmailById(c: any, userId: string): Promise<string | null> {
  const user = (await c.env.DB.prepare(
    'SELECT email FROM users WHERE id = ?'
  ).bind(userId).first()) as { email?: string | null } | null;

  return user?.email?.toLowerCase() || null;
}

async function isOuraAllowedForUser(c: any, userId: string): Promise<boolean> {
  const allowed = c.env.OURA_ALLOWED_EMAIL?.toLowerCase().trim();
  if (!allowed) {
    return false;
  }

  const userEmail = await getUserEmailById(c, userId);
  return !!userEmail && userEmail === allowed;
}

async function requireOuraAccess(c: any): Promise<{ userId: string } | Response> {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const allowed = await isOuraAllowedForUser(c, userId);
  if (!allowed) return c.json({ error: 'Oura dashboard is not enabled for this account' }, 403);

  return { userId };
}

async function saveOuraTokens(c: any, userId: string, token: OuraTokenResponse) {
  const now = new Date().toISOString();
  const expiresAt = toIsoAfterSeconds(token.expires_in);

  await c.env.DB.prepare(
    `INSERT INTO oura_connections (user_id, access_token, refresh_token, token_type, scope, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = COALESCE(excluded.refresh_token, oura_connections.refresh_token),
       token_type = excluded.token_type,
       scope = excluded.scope,
       expires_at = excluded.expires_at,
       updated_at = excluded.updated_at`
  ).bind(
    userId,
    token.access_token,
    token.refresh_token || null,
    token.token_type || 'Bearer',
    token.scope || null,
    expiresAt,
    now,
    now
  ).run();
}

async function refreshOuraTokenIfNeeded(c: any, userId: string): Promise<string | null> {
  const connection = (await c.env.DB.prepare(
    'SELECT access_token, refresh_token, expires_at FROM oura_connections WHERE user_id = ?'
  ).bind(userId).first()) as { access_token: string; refresh_token: string | null; expires_at: string | null } | null;

  if (!connection?.access_token) return null;

  const refreshToken = connection.refresh_token;
  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : null;
  const shouldRefresh = !!expiresAt && Date.now() >= (expiresAt - 60_000);

  if (!shouldRefresh) {
    return connection.access_token;
  }

  if (!refreshToken) {
    return connection.access_token;
  }

  const clientId = c.env.OURA_CLIENT_ID;
  const clientSecret = c.env.OURA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return connection.access_token;
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(OURA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    console.error('Failed to refresh Oura token', await res.text());
    return connection.access_token;
  }

  const token = (await res.json()) as OuraTokenResponse;
  await saveOuraTokens(c, userId, token);
  return token.access_token;
}

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

// ==================== OURA ====================

// Oura feature + connection status for current user
app.get('/api/oura/status', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ enabled: false, connected: false }, 401);

  const enabled = await isOuraAllowedForUser(c, userId);
  if (!enabled) {
    return c.json({ enabled: false, connected: false });
  }

  const connection = await c.env.DB.prepare(
    'SELECT updated_at FROM oura_connections WHERE user_id = ?'
  ).bind(userId).first<{ updated_at?: string }>();

  return c.json({
    enabled: true,
    connected: !!connection,
    lastSyncAt: connection?.updated_at || null,
  });
});

// Build OAuth authorization URL
app.get('/api/oura/connect-url', async (c) => {
  const access = await requireOuraAccess(c);
  if (access instanceof Response) return access;

  const clientId = c.env.OURA_CLIENT_ID;
  const redirectUri = getOuraRedirectUri(c);
  if (!clientId) {
    return c.json({ error: 'Oura client ID is not configured on worker' }, 500);
  }

  const state = `oura_${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await c.env.DB.prepare(
    'INSERT INTO oura_oauth_states (state, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(state, access.userId, createdAt, expiresAt).run();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email personal daily heartrate tag workout session spo2 ring_configuration stress heart_health',
    state,
  });

  return c.json({ authUrl: `${OURA_AUTH_URL}?${params.toString()}` });
});

// Exchange authorization code for tokens
app.post('/api/oura/exchange', async (c) => {
  const access = await requireOuraAccess(c);
  if (access instanceof Response) return access;

  const { code, state } = await c.req.json<{ code?: string; state?: string }>();
  if (!code || !state) {
    return c.json({ error: 'code and state are required' }, 400);
  }

  const stateRow = await c.env.DB.prepare(
    'SELECT user_id, expires_at, used_at FROM oura_oauth_states WHERE state = ?'
  ).bind(state).first<{ user_id: string; expires_at: string; used_at?: string | null }>();

  if (!stateRow || stateRow.user_id !== access.userId) {
    return c.json({ error: 'Invalid OAuth state' }, 400);
  }

  if (stateRow.used_at) {
    return c.json({ error: 'OAuth state already used' }, 400);
  }

  if (new Date(stateRow.expires_at).getTime() < Date.now()) {
    return c.json({ error: 'OAuth state expired' }, 400);
  }

  const clientId = c.env.OURA_CLIENT_ID;
  const clientSecret = c.env.OURA_CLIENT_SECRET;
  const redirectUri = getOuraRedirectUri(c);

  if (!clientId || !clientSecret) {
    return c.json({ error: 'Oura client credentials are not configured on worker' }, 500);
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenRes = await fetch(OURA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenRes.ok) {
    const reason = await tokenRes.text();
    console.error('Oura token exchange failed:', reason);
    return c.json({ error: 'Failed to exchange Oura authorization code' }, 502);
  }

  const token = (await tokenRes.json()) as OuraTokenResponse;
  await saveOuraTokens(c, access.userId, token);

  await c.env.DB.prepare(
    'UPDATE oura_oauth_states SET used_at = ? WHERE state = ?'
  ).bind(new Date().toISOString(), state).run();

  return c.json({ success: true });
});

// Disconnect Oura account
app.delete('/api/oura/connection', async (c) => {
  const access = await requireOuraAccess(c);
  if (access instanceof Response) return access;

  await c.env.DB.prepare(
    'DELETE FROM oura_connections WHERE user_id = ?'
  ).bind(access.userId).run();

  return c.json({ success: true });
});

// Oura dashboard summary (custom range, defaults to last 7 days)
app.get('/api/oura/summary', async (c) => {
  const access = await requireOuraAccess(c);
  if (access instanceof Response) return access;

  const token = await refreshOuraTokenIfNeeded(c, access.userId);
  if (!token) {
    return c.json({ connected: false, reason: 'No Oura connection found' });
  }

  const requestedStartDate = c.req.query('startDate');
  const requestedEndDate = c.req.query('endDate');
  const requestedLegacyDate = c.req.query('date');

  if (requestedLegacyDate && !isValidIsoDate(requestedLegacyDate)) {
    return c.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, 400);
  }
  if (requestedStartDate && !isValidIsoDate(requestedStartDate)) {
    return c.json({ error: 'Invalid startDate format. Use YYYY-MM-DD.' }, 400);
  }
  if (requestedEndDate && !isValidIsoDate(requestedEndDate)) {
    return c.json({ error: 'Invalid endDate format. Use YYYY-MM-DD.' }, 400);
  }

  if ((requestedStartDate && !requestedEndDate) || (!requestedStartDate && requestedEndDate)) {
    return c.json({ error: 'Both startDate and endDate are required when specifying a custom range' }, 400);
  }

  const today = todayDate();
  let endDate = today;
  let startDate = shiftIsoDate(today, -6);

  if (requestedStartDate && requestedEndDate) {
    endDate = requestedEndDate <= today ? requestedEndDate : today;
    startDate = requestedStartDate;
  } else if (requestedLegacyDate) {
    endDate = requestedLegacyDate <= today ? requestedLegacyDate : today;
    startDate = shiftIsoDate(endDate, -6);
  }

  if (startDate > endDate) {
    return c.json({ error: 'startDate must be on or before endDate' }, 400);
  }

  const rangeMs = new Date(`${endDate}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime();
  const rangeDays = Math.floor(rangeMs / 86_400_000) + 1;
  if (rangeDays > 90) {
    return c.json({ error: 'Date range is too large. Please request 90 days or fewer.' }, 400);
  }

  const headers = { Authorization: `Bearer ${token}` };

  const [profileRes, activityRes, sleepRes] = await Promise.all([
    fetch(`${OURA_API_BASE}/personal_info`, { headers }),
    fetch(`${OURA_API_BASE}/daily_activity?start_date=${startDate}&end_date=${endDate}`, { headers }),
    fetch(`${OURA_API_BASE}/daily_sleep?start_date=${startDate}&end_date=${endDate}`, { headers }),
  ]);

  if ([profileRes, activityRes, sleepRes].some((r) => r.status === 401)) {
    await c.env.DB.prepare('DELETE FROM oura_connections WHERE user_id = ?').bind(access.userId).run();
    return c.json({ connected: false, reason: 'Oura connection expired. Please reconnect.' }, 401);
  }

  if (!profileRes.ok || !activityRes.ok || !sleepRes.ok) {
    return c.json({ error: 'Failed to load Oura data' }, 502);
  }

  const profile = await profileRes.json<any>();
  const activity = await activityRes.json<any>();
  const sleep = await sleepRes.json<any>();

  const optionalCollectionPaths = [
    'daily_spo2',
    'daily_readiness',
    'daily_stress',
    'daily_resilience',
    'daily_cardiovascular_age',
    'vO2_max',
    'workout',
    'session',
  ] as const;

  const optionalResponses = await Promise.all(
    optionalCollectionPaths.map(async (path) => {
      try {
        const res = await fetch(`${OURA_API_BASE}/${path}?start_date=${startDate}&end_date=${endDate}`, { headers });
        if (!res.ok) {
          return [path, []] as const;
        }

        const payload = await res.json<any>();
        const items = Array.isArray(payload?.data) ? payload.data : [];
        return [path, items] as const;
      } catch {
        return [path, []] as const;
      }
    })
  );

  const optionalCollections = Object.fromEntries(optionalResponses) as Record<string, Array<Record<string, unknown>>>;

  const activityItems = Array.isArray(activity?.data) ? activity.data : [];
  const sleepItems = Array.isArray(sleep?.data) ? sleep.data : [];

  const stepValues = activityItems
    .map((row: any) => row?.steps)
    .filter((v: any) => typeof v === 'number');
  const activeCalValues = activityItems
    .map((row: any) => row?.active_calories)
    .filter((v: any) => typeof v === 'number');
  const sleepValues = sleepItems
    .map((row: any) => row?.total_sleep_duration)
    .filter((v: any) => typeof v === 'number');

  const avgSteps = stepValues.length ? Math.round(stepValues.reduce((a: number, b: number) => a + b, 0) / stepValues.length) : null;
  const avgActiveCalories = activeCalValues.length ? Math.round(activeCalValues.reduce((a: number, b: number) => a + b, 0) / activeCalValues.length) : null;
  const avgSleepHours = sleepValues.length
    ? Number((sleepValues.reduce((a: number, b: number) => a + b, 0) / sleepValues.length / 3600).toFixed(1))
    : null;

  return c.json({
    connected: true,
    range: { startDate, endDate },
    profile: profile?.data || null,
    activity: activityItems,
    sleep: sleepItems,
    spo2: optionalCollections.daily_spo2 || [],
    readiness: optionalCollections.daily_readiness || [],
    stress: optionalCollections.daily_stress || [],
    resilience: optionalCollections.daily_resilience || [],
    cardiovascularAge: optionalCollections.daily_cardiovascular_age || [],
    vo2Max: optionalCollections.vO2_max || [],
    workout: optionalCollections.workout || [],
    session: optionalCollections.session || [],
    metrics: {
      avgSteps,
      avgActiveCalories,
      avgSleepHours,
    },
    latestActivity: activityItems.length ? activityItems[activityItems.length - 1] : null,
    latestSleep: sleepItems.length ? sleepItems[sleepItems.length - 1] : null,
  });
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
