# Routine Minder - Roadmap

## Version 2.1 - Planned Enhancements

### 🔐 1. API Key Protection
**Priority:** High | **Status:** Planned

Protect the Cloudflare Worker API with API key authentication to prevent abuse and DDOS attacks.

#### Implementation Options

**Option A: Simple API Key (Recommended for v2.1)**
```typescript
// Worker middleware
app.use('*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  if (apiKey !== c.env.API_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});
```

**Option B: Rate Limiting**
- Use Cloudflare's built-in rate limiting
- Limit requests per device ID

**Option C: JWT Tokens (with Google OAuth)**
- Issue JWT tokens after authentication
- Validate on each request

#### Tasks
- [ ] Add API key validation middleware to Worker
- [ ] Store secret: `wrangler secret put API_SECRET`
- [ ] Update client storage.ts to send API key
- [ ] Add rate limiting per device ID
- [ ] Configure Cloudflare WAF rules

---

### 📊 2. Export Data (CSV/JSON)
**Priority:** Medium | **Status:** Planned

Allow users to export their routine and completion data for backup or analysis.

#### UI Design (Settings Page)
```
📥 Export Data
├── Format: [JSON ▼] / [CSV ▼]
├── Include: ☑ Routines  ☑ Completions
├── Date Range: [Last 30 days ▼]
└── [Download Export]
```

#### CSV Format
**routines.csv:**
```csv
id,name,icon,timeCategories,createdAt
abc123,Hydration,💧,"AM,NOON,PM",2024-01-15
```

**completions.csv:**
```csv
date,routine,timeCategory,completedAt
2024-01-20,Hydration,AM,2024-01-20T08:00:00Z
```

#### Implementation
```typescript
// client/src/lib/export.ts
export const exportData = async (format: 'json' | 'csv') => {
  const data = {
    routines: await routinesApi.getAll(),
    completions: await completionsApi.getRange(365),
    exportedAt: new Date().toISOString()
  };
  
  if (format === 'json') {
    downloadFile(JSON.stringify(data, null, 2), 'routine-minder-export.json', 'application/json');
  } else {
    const csv = convertToCSV(data);
    downloadFile(csv, 'routine-minder-export.csv', 'text/csv');
  }
};
```

#### Tasks
- [ ] Add export UI to Settings page
- [ ] Implement JSON export
- [ ] Implement CSV conversion utility
- [ ] Add date range picker
- [ ] Test download on mobile
- [ ] Consider import for restore

---

### 🔑 3. Google Sign-In for Cloud Sync
**Priority:** Medium | **Status:** Planned

Allow users to sign in with Google to sync data across devices.

#### User Flow
1. User opens Settings → "Sign in with Google"
2. Google OAuth popup appears
3. On success, device linked to Google account
4. Data syncs across all devices with same Google account

#### Benefits
- 🔄 Sync across phone, tablet, desktop
- 💾 Cloud backup of all data
- 🔐 Secure Google authentication
- 📱 Same experience on new devices

#### Implementation

**Frontend:**
```typescript
// Using Firebase Auth or custom OAuth
const handleGoogleLogin = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  
  await api('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken, deviceId: getDeviceId() })
  });
};
```

**Backend:**
```typescript
app.post('/api/auth/google', async (c) => {
  const { idToken, deviceId } = await c.req.json();
  
  // Verify token with Google
  const payload = await verifyGoogleToken(idToken);
  const email = payload.email;
  
  // Link device to Google account
  await c.env.DB.prepare(
    'UPDATE users SET email = ? WHERE device_id = ?'
  ).bind(email, deviceId).run();
  
  // Merge data from other devices with same email
  await mergeUserData(email, deviceId);
});
```

**Database Update:**
```sql
CREATE INDEX idx_users_email ON users(email);
```

#### Tasks
- [ ] Create Google Cloud project & OAuth credentials
- [ ] Add Firebase Auth or custom OAuth
- [ ] Add "Sign in with Google" to Settings
- [ ] Verify Google tokens server-side
- [ ] Implement cross-device data merge
- [ ] Handle sign-out and privacy
- [ ] Update onboarding to mention sync

---

### 🎨 4. Emoji/Icon Picker for Routines
**Priority:** Low | **Status:** Planned

Allow users to select an emoji for each routine to make the app more visually appealing.

#### Design

**Current:**
```
☐ Hydration
☐ Vitamins
```

**With Emojis:**
```
💧 Hydration
💊 Vitamins
🏋️ Exercise
🧘 Meditation
📖 Journaling
```

#### Curated Emoji List
```typescript
const ROUTINE_EMOJIS = [
  // Health & Fitness
  '💧', '💊', '🏋️', '🧘', '🏃', '🚴', '🧗', '⚽',
  // Mind & Learning
  '📖', '✍️', '🧠', '🎯', '📝', '💭', '🎓',
  // Creative
  '🎵', '🎨', '📷', '🎮', '🎸', '🎹', '🎤',
  // Daily Life
  '☀️', '🌙', '🍎', '🥗', '💤', '🛁', '🧹',
  // Work & Productivity
  '💻', '📧', '📞', '📊', '🗓️', '✅', '📌',
  // Nature & Outdoors
  '🌳', '🌺', '🐕', '🚶', '🧘‍♀️',
];
```

#### Schema Update
```typescript
type Routine = {
  id: string;
  name: string;
  icon: string; // emoji character
  timeCategories: TimeCategory[];
  // ...
};
```

#### Database Migration
```sql
ALTER TABLE routines ADD COLUMN icon TEXT DEFAULT '✅';
```

#### Tasks
- [ ] Add `icon` field to Routine type
- [ ] Create database migration
- [ ] Build emoji picker component
- [ ] Update Add/Edit routine form
- [ ] Display emoji in routine checkbox
- [ ] Update onboarding presets with emojis
- [ ] Default emoji for existing routines

---

## Future Ideas (Backlog)

- 📱 **Widget Support** - iOS/Android home screen widgets
- 🔔 **Push Notifications** - Reminders for routines
- 📈 **Advanced Analytics** - Charts, trends, insights
- 👥 **Sharing** - Share progress with friends
- 🎮 **Gamification** - Achievements, badges, levels
- 🌐 **Import from Other Apps** - Migrate from Habitica, etc.
- 🗣️ **Voice Commands** - "Hey Siri, mark meditation done"

---

## Version History

### v2.0 (Current)
- ✅ Migrated to Cloudflare Workers + D1
- ✅ Offline-first localStorage architecture
- ✅ Device-based authentication
- ✅ Onboarding flow with preset routines
- ✅ Polished UI with animations
- ✅ PWA with Service Worker

### v1.0
- Google Apps Script backend
- Google Sheets as database
- Basic routine tracking
