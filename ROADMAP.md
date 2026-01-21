# Routine Minder - Roadmap

## Version 2.1 - Released

### API Key Protection
- API key validation middleware for Worker
- Client sends X-API-Key header with all requests
- Configurable via VITE_API_KEY env variable
- Set worker secret with wrangler secret put API_SECRET

### Export Data (CSV/JSON)
- Export to JSON or CSV format
- Select date range (30 days, 90 days, year, all time)
- Import from JSON backup file
- Settings page UI with format/range selection

### Emoji/Icon Picker
- Emoji picker component with curated routine emojis
- Auto-suggest emoji based on routine name
- Icon displayed in routine list and checkbox
- Database migration for icon field

### Google Sign-In
- Google Identity Services integration
- Account linking with device
- Settings page UI with sign-in/sign-out
- Worker endpoint for Google token verification

### Push Notifications
- Web Push API support
- VAPID key configuration
- Local notification fallback
- Settings page toggle

### Enhanced PWA Support
- PWA shortcuts (Today, Dashboard)
- App categories and screenshots in manifest
- Install prompt on landing page

---

## Future Ideas (v2.2+)

- iOS/Android Widgets - Native home screen widgets
- Advanced Analytics - Charts, trends, insights
- Social Features - Share progress with friends
- Gamification - Achievements, badges, levels
- Import from Other Apps - Migrate from Habitica, etc.
- Voice Commands - Siri/Google Assistant integration

---

## Version History

### v2.1 (Current)
- API key protection
- Export/Import data (JSON/CSV)
- Emoji picker for routines
- Google Sign-In for sync
- Push notifications
- Enhanced PWA manifest

### v2.0
- Migrated to Cloudflare Workers + D1
- Offline-first localStorage architecture
- Device-based authentication
- Onboarding flow with preset routines
- Polished UI with animations
- PWA with Service Worker
- Landing page for new users

### v1.0
- Google Apps Script backend
- Google Sheets as database
- Basic routine tracking
