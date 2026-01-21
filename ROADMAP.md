# Routine Minder - Roadmap

## Version 2.2 - Current Release

### Gamification System
- XP system with 10 XP per completion
- Streak multipliers (1.25x at 7 days, 1.5x at 14 days, 2x at 30 days)
- 6 levels: Novice → Apprentice → Practitioner → Expert → Master → Legend
- 21 achievements including streak badges, completion milestones, time categories
- Per-routine stats with individual streaks and completion rates
- Period filtering: 7 days, 30 days, 1 year, YTD

### Dashboard Revamp
- Level & XP hero card with progress to next level
- Achievement showcase with unlocked badges
- "Next to unlock" achievement hints
- Time of day breakdown (AM/Noon/PM/All)
- Routine performance comparison
- Lifetime stats summary
- Share stats functionality

### Data Preservation
- Soft-delete routines (completion history preserved)
- Best streak persistence (survives streak breaks)
- Account deletion with full server cleanup (GDPR)

### UX Improvements
- Removed blocking onboarding - users go straight to app
- Simplified landing page with Google Sign-In CTA
- Cross-device sync via Google account
- Privacy, Terms, and About pages for OAuth verification
- Warm coral/teal color theme

---

## Version 2.1

### API Key Protection
- API key validation middleware for Worker
- Client sends X-API-Key header with all requests
- Configurable via VITE_API_KEY env variable

### Export Data (CSV/JSON)
- Export to JSON or CSV format
- Select date range (30 days, 90 days, year, all time)
- Import from JSON backup file

### Emoji/Icon Picker
- Emoji picker component with curated routine emojis
- Auto-suggest emoji based on routine name

### Google Sign-In
- Google Identity Services integration
- Account linking with device
- Cross-device data sync

### Push Notifications
- Web Push API support
- Local notification fallback

---

## Future Ideas (v2.3+)

- 📱 iOS/Android Widgets - Native home screen widgets
- 📈 Advanced Analytics - Charts, trends, weekly insights
- 🤝 Social Features - Share achievements with friends
- 🔄 Import from Other Apps - Migrate from Habitica, etc.
- 🎤 Voice Commands - Siri/Google Assistant integration
- 📅 Calendar View - Monthly heat map of completions
- 🎯 Challenges - Weekly/monthly challenges with bonus XP

---

## Version History

### v2.2 (Current)
- Gamification system with XP, levels, achievements
- Dashboard complete revamp
- Soft-delete routines (preserves history)
- Account deletion (GDPR)
- Removed onboarding flow
- Privacy/Terms/About pages
- Best streak persistence
- Warm coral/teal theme

### v2.1
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
- PWA with Service Worker
- Landing page for new users

### v1.0
- Google Apps Script backend
- Google Sheets as database
- Basic routine tracking
