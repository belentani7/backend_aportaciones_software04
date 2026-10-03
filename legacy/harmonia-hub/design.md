# BELENTANI — Mobile App Design Plan

## Brand Identity
- **Name:** BELENTANI
- **Tagline:** "Your AI Music OS"
- **Aesthetic:** Dark premium, Spotify-inspired, futuristic
- **Personality:** Autonomous, intelligent, sleek, powerful

## Color Palette
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `primary` | `#1DB954` | `#1DB954` | Accent, CTAs, active states (BELENTANI green) |
| `background` | `#121212` | `#121212` | Main background (always dark) |
| `surface` | `#1E1E1E` | `#1E1E1E` | Cards, modals, bottom sheets |
| `surface2` | `#2A2A2A` | `#2A2A2A` | Elevated cards, inputs |
| `foreground` | `#FFFFFF` | `#FFFFFF` | Primary text |
| `muted` | `#B3B3B3` | `#B3B3B3` | Secondary text, icons |
| `border` | `#333333` | `#333333` | Dividers, borders |
| `gold` | `#FFD700` | `#FFD700` | Premium/CEO tier indicators |
| `error` | `#F44336` | `#F44336` | Kill switch, errors |

## Screen List

### 1. Splash / Onboarding
- Animated BELENTANI logo
- 3-step onboarding: "AI Playlists", "Executive Council", "Your Music OS"
- CTA: Get Started / Sign In

### 2. Home (Tab 1)
- Header: BELENTANI logo + greeting + notification bell
- "Good Morning / Afternoon / Evening, Pedro" personalized
- Featured Section: "Today's Strategy" — CEO daily recommendation card
- Quick Moods: horizontal scroll chips (Focus, Chill, Energy, Sad, Party, Sleep)
- Recent Playlists: horizontal scroll cards with album art
- Trending Now: vertical list of AI-curated playlists
- Mini Player: sticky bottom bar when music is playing

### 3. Discover / Generate (Tab 2)
- AI Playlist Generator hero section
- Mood selector: visual grid with emoji + color (8 moods)
- Context selector: chips (Work, Gym, Sleep, Drive, Study, Party)
- Genre tags: multi-select pills
- BPM slider: slow ↔ fast
- "Generate Playlist" button — primary CTA
- Generated playlist result: track list with album art, play button
- Save to Library option

### 4. Library (Tab 3)
- My Playlists: grid view
- Liked Songs
- Recently Played
- Downloaded (Premium)
- Artist Marketplace: "Discover Independent Artists"

### 5. Player Screen (Modal / Full Screen)
- Large album art with animated glow
- Track title, artist, album
- Progress bar with time
- Controls: shuffle, prev, play/pause, next, repeat
- Volume slider
- Like button, add to playlist, share
- Lyrics tab (Premium)
- "AI Insight" — why this song was recommended

### 6. Profile (Tab 4)
- Avatar + username (Pedro / BELENTANI)
- Stats: Playlists created, Hours listened, Mood streak
- Subscription badge: Free / Premium / Creator
- Listening history
- Settings link

### 7. CEO Dashboard (Admin only — Tab 5 or hidden menu)
- Executive Council header with 5 agent cards (CEO, COO, CMO, CPO, CTO)
- Daily Strategy card — AI-generated market analysis
- Key Metrics: Users, Revenue, Churn, Engagement
- Autonomous Actions log: recent decisions made
- "Trigger Analysis" button
- Kill Switch toggle (red, prominent)
- Monthly CEO Report preview

### 8. Settings
- Account settings
- Subscription management
- Notification preferences
- Kill Switch (owner only)
- App version / About BELENTANI

## Key User Flows

### Flow 1: Generate AI Playlist
Home → Discover tab → Select mood (e.g., "Focus") → Select context ("Work") → Tap "Generate" → View playlist → Tap play → Mini player appears → Tap mini player → Full player opens

### Flow 2: CEO Council Analysis
Profile → CEO Dashboard → View metrics → Tap "Trigger Council Analysis" → Loading animation with 5 agent icons → Strategy card updates → Review autonomous decisions

### Flow 3: Subscription Upgrade
Home → Premium banner → Subscription screen → Select plan → Payment (Stripe) → Premium badge unlocked

## Typography
- **Headings:** Bold, 24-32px
- **Subheadings:** SemiBold, 16-20px
- **Body:** Regular, 14-16px
- **Caption:** Regular, 12px, muted color

## Navigation Structure
- Bottom Tab Bar: Home | Discover | Library | Profile
- CEO Dashboard: accessible via Profile → "Executive Council" (admin)
- Player: modal overlay from any screen
- Onboarding: shown only on first launch

## Component Library
- `PlaylistCard` — album art, title, track count, mood tag
- `TrackRow` — number, album art, title, artist, duration, options
- `MoodChip` — emoji + label, selectable
- `MiniPlayer` — sticky bar with track info, play/pause, progress
- `AgentCard` — CEO/COO/CMO/CPO/CTO with status indicator
- `MetricCard` — label, value, trend arrow
- `KillSwitch` — red toggle with confirmation modal
- `SubscriptionBadge` — Free/Premium/Creator tier
