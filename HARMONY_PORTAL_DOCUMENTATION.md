# Harmony Portal - Complete Documentation

## Project Overview

Harmony is a real-time dashboard system for managing restaurant operations across multiple locations. It displays live information including alerts, sensors, checklists, and schedules to crew members while providing a management portal for content editing.

### Core Components

1. **portal.html** - Administrative interface for content management and user administration
2. **index.html** - Full-screen dashboard for crew members
3. **dash-min.html** - Half-screen optimized dashboard variant (same data, compact layout)
4. **script.js** - All dashboard logic, Firebase integration, and media rotation player
5. **style.css** - Base dark theme styles shared by both dashboards
6. **Firebase Firestore** - Cloud database for all content and user data
7. **Jolt Integration** - External API for checklists and sensor data

---

## File Structure

```
Harmony/
├── portal.html          # Admin portal (login, content editor, user management)
├── index.html           # Full-screen dashboard viewer
├── dash-min.html        # Half-screen dashboard viewer
├── script.js            # Dashboard logic, Firebase integration, media rotation
├── style.css            # Base dashboard styling
├── general.json         # Company-level data template
├── store-XXXX.json      # Store-specific data templates
└── Media/               # (Optional) PDFs hosted on GitHub Pages
    └── *.pdf
```

**Accessing dashboards:**
```
index.html?store=8409        ← full screen
dash-min.html?store=8409     ← half screen (TV split layouts)
```

---

## Firebase Database Hierarchy

### Collections Structure

```
Firestore Database
│
├── company/
│   └── general (document)
│       ├── alerts: Array<Alert>
│       ├── announcements: Array<Announcement>
│       ├── ltos: Array<LTO>
│       ├── events: Array<Event>
│       ├── closureDates: Array<string>
│       ├── daypartSchedule: Array<Daypart>
│       └── mediaRotation: MediaRotation      ← master on/off lives here
│
├── markets/
│   └── {marketName} (document)
│       ├── alerts, announcements, ltos, events
│       └── mediaRotation: { items: Array<MediaItem> }
│
├── districts/
│   └── {districtName} (document)
│       ├── alerts, announcements, ltos, events
│       └── mediaRotation: { items: Array<MediaItem> }
│
├── stores/
│   └── {storeId} (document)
│       ├── storeName, joltLocationId, market, district, hasData
│       ├── alerts, announcements, ltos, events, closureDates, daypartSchedule
│       └── mediaRotation: { items: Array<MediaItem> }
│
└── users/
    └── {userId} (document)
        ├── email, name
        ├── role: "admin"|"operator"|"district"|"store"|"user"
        ├── assignedMarket, assignedDistrict, assignedSite
```

### Data Inheritance Model

```
Company Level (general)       ← master on/off, timing, global items
    ↓ appended by
Operator/Market Level         ← market-specific items added after general
    ↓ appended by
District Level                ← district-specific items added after market
    ↓ appended by
Store Level                   ← store-specific items added last
    ↓ displays on
Dashboard (?store=XXXX)
```

General items always play first in the media rotation queue. Lower levels append after.

---

## Data Models

### Alert Object

```javascript
{
    text: string,
    type: "normal" | "info" | "warning" | "custom",
    startDate?: string,       // YYYY-MM-DD
    endDate?: string,         // YYYY-MM-DD
    bgColor?: string,         // hex, custom type only
    textColor?: string        // hex, custom type only
}
```

### Announcement / Event Object

```javascript
{
    text: string,
    startDate?: string,       // YYYY-MM-DD
    endDate?: string          // YYYY-MM-DD
}
```

### LTO Object

```javascript
{
    text: string,
    icon?: string,            // emoji character
    countdownDate?: string    // ISO datetime YYYY-MM-DDTHH:mm
}
```

### Daypart Schedule Object

```javascript
{
    name: string,             // e.g. "Breakfast"
    startTime: string,        // HH:mm 24-hour — use 23:59 for midnight, not 24:00
    endTime: string,
    color: string,            // hex
    textColor: string,        // hex
    icon: string              // emoji
}
```

### MediaRotation Object (General level only — controls master settings)

```javascript
{
    enabled: boolean,         // master on/off for all dashboards
    activeUntil?: string,     // YYYY-MM-DD — kills all rotation after this date
    waitMinutes: number,      // delay after page load before first play (default 5)
    restMinutes: number,      // how long normal columns show between rotations (default 5)
    items: Array<MediaItem>
}
```

### MediaItem Object (all levels)

```javascript
{
    id: string,               // auto-generated unique ID
    type: "video" | "pdf",
    name: string,             // display label in portal
    url: string,              // see URL formats below
    durationSeconds?: number, // required for PDF and Brightcove; optional for YouTube/MP4
    startDate?: string,       // ISO datetime — when item becomes active
    endDate?: string          // ISO datetime — when item expires
}
```

---

## Media Rotation Feature

### Overview

At a configurable interval the three info columns (column 1 rotating card, LTOs, placeholder) are replaced by a full-width media panel. After all items in the queue have played the columns return for a configurable rest period, then the rotation repeats. **Jolt checklists and sensors always remain visible.**

The entire system is driven by Firestore — no hardcoded content in the HTML files. Changes made in the portal take effect on all dashboards within seconds via `onSnapshot` real-time listeners.

### How Playback Works

| Media Type | How end is detected |
|---|---|
| Direct `.mp4` / `.webm` | `ended` event on `<video>` element |
| YouTube | YouTube IFrame API postMessage (`onStateChange` info=0) |
| Brightcove / other iframe | `durationSeconds` timeout (set in portal); falls back to 10 min if not set |
| PDF | `durationSeconds` timeout (required) |

### URL Formats Supported

**Videos:**
- YouTube: `https://www.youtube.com/watch?v=VIDEO_ID` or `https://youtu.be/VIDEO_ID`
- Direct MP4: any `.mp4`, `.webm`, `.ogg`, `.mov` URL
- Brightcove: `https://players.brightcove.net/...` — autoplay params are added automatically

**PDFs:**
- Google Drive: `https://drive.google.com/file/d/FILE_ID/view` — auto-converted to `/preview`
- GitHub blob: `https://github.com/owner/repo/blob/main/Media/file.pdf` — auto-converted to raw URL → Google Docs Viewer
- Direct PDF URL: routed through Google Docs Viewer automatically

### Configuring Media Rotation in the Portal

#### General Level (master controls — admin only)

1. Select **Company Level (General)** in site selector
2. Scroll to **Media Rotation** section
3. Toggle **Enabled** on
4. Set **Stop Showing After** date (optional — leave blank to run indefinitely)
5. Set **Delay Before First Play** — minutes after page load before first rotation
6. Set **Dashboard Rest Period** — minutes normal columns show between rotations
7. Add items with **+ Add Video Link** or **+ Add PDF Link**
8. Click **Save Changes**

#### Market / District / Store Level (appended items only)

- Timing and on/off are always controlled at General level
- Items added here play **after** General items in the queue
- Select the level, scroll to Media Rotation, add items, save

#### Per-Item Fields

| Field | Description |
|---|---|
| Label/Name | Displayed in the portal for identification |
| URL | Video or PDF URL (see URL formats above) |
| Max Duration (video) | Required for Brightcove; ignored for YouTube and direct MP4 |
| Display Duration (PDF) | How long to show the PDF |
| Show From | Item only plays on/after this date-time |
| Stop Showing After | Item stops playing after this date-time |

Duration uses separate **minutes** and **seconds** fields for fine control (e.g., 2 m 30 s = 150 seconds stored).

### Per-Item Scheduling

Items can be scheduled independently — useful for seasonal or time-limited content:
- A Christmas video set to run Dec 1–25 will automatically skip outside that window
- Schedules are re-evaluated at the start of each rotation cycle
- Expired items are skipped without any manual intervention

### Media Rotation State Machine

```
Page loads
    → wait waitMinutes
    → filter active items from queue
    → play each item in order (General → Market → District → Store)
    → show info columns for restMinutes
    → repeat (re-filtering active items each cycle)

Portal change detected (onSnapshot)
    → if disabled or queue empty: stop immediately, restore columns
    → if newly enabled: start wait timer
```

---

## Platform & Device Compatibility

### Debian (Chromium kiosk)

The dashboards are designed to run on Debian devices in Chromium kiosk mode. Most features work without any changes.

**Autoplay:** Works when Chromium is launched with the kiosk autoplay flag:
```bash
chromium-browser --kiosk --autoplay-policy=no-user-gesture-required --url "https://yoursite.github.io/Harmony/dash-min.html?store=8409"
```

**YouTube, direct MP4, PDF:** Work on all platforms including Debian Chromium.

**Brightcove (DRM content):** Brightcove uses Widevine DRM. Chromium on Debian does **not** ship with Widevine (it's proprietary). Two options:

Option 1 — Install Widevine on existing Chromium (no browser change needed):
```bash
sudo apt-get install -y chromium-widevine
```
If that package is unavailable, extract from Chrome:
```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
dpkg-deb -x google-chrome-stable_current_amd64.deb chrome-tmp
sudo cp chrome-tmp/opt/google/chrome/WidevineCdm /usr/lib/chromium/ -r
rm -rf chrome-tmp google-chrome-stable_current_amd64.deb
```

Option 2 — Use YouTube Unlisted instead of Brightcove (recommended for 68+ screens):
- Upload videos to YouTube as **Unlisted** (not public, not searchable)
- Zero DRM concerns, no per-device configuration, YouTube handles all bandwidth
- End detection works reliably via YouTube IFrame API

---

## Portal Features

### Authentication

Firebase Auth with email/password. On first login with a new account a basic `user` profile is auto-created in Firestore. Admins must manually set the role.

### Content Editor

Manages 5 content types + daypart schedule + media rotation across all hierarchy levels.

**Site Selection:** Admins see all levels. Operators see their market + districts + stores. District managers see their district + stores. Store managers see only their store.

### Admin Panel

**User Management:**
- Create users — sets Firebase Auth account + Firestore profile simultaneously
- Edit role and assignments
- Send password reset email
- Uses secondary Firebase app instance to create accounts without auto-logging in

**Data Tools:**
- Upload `general.json` → writes to `company/general`
- Upload `store-XXXX.json` files → creates `stores/` documents, sets `hasData: true`
- Upload hierarchy CSV → links stores to markets and districts

CSV format:
```csv
SiteID,StoreName,Market,District
8409,Wendy's Barker,Texas,Houston North
8412,Wendy's Main St,Texas,Houston South
```

**Hierarchy View:** Visual tree of Company → Operator → District → Store with store counts.

---

## Dashboard System

### URL Parameters

```
index.html?store=8409
dash-min.html?store=8409
```

Missing or invalid `store` parameter shows an error in the alert banner.

### Data Flow

1. Fetch store document → get market and district names
2. Parallel fetch: general, market, district documents
3. Merge arrays (company → market → district → store order)
4. Render content to DOM
5. Initialize media rotation `onSnapshot` listeners (once per session)
6. Fetch Jolt checklists and sensors

**Refresh rates:**
- Firebase / main content: every 5 minutes
- Jolt checklists, sensors, chili labels, chicken labels: every 5 minutes
- Food safety KPI (DFSL completion): every **6 hours** — these figures change slowly and API quota is limited
- Alert rotation: every 5 seconds
- Daypart check: every 1 minute
- Column 1 panel rotation: 30 seconds
- Column 3 panel rotation: 15 seconds per panel (see sequence below)

### Column 3 — Rotating Panel (Food Safety / Chili / Chicken)

Column 3 cycles through three panels using a **sequence array** so chili and chicken each appear twice per cycle before food safety returns:

```
food-safety (15s) → chili (15s) → chicken (15s) → chili (15s) → chicken (15s) → food-safety …
```

The top border color changes with each panel:

| Panel | Border color |
|---|---|
| Food Safety | Teal `#0097a7` |
| Chili Tracker | Gold `#e6a800` |
| Chicken Line | Orange `#e65100` |

**Key constants:**
- `COL3_SEQUENCE` — `['food-safety', 'chili', 'chicken', 'chili', 'chicken']` — edit this array to change order or repeat count
- `COL3_DURATIONS` — per-panel display time map (all currently 15 000 ms)
- `COL3_COLORS` — per-panel border color map
- `col3SeqIdx` — current position in the sequence (integer, wraps mod sequence length)

---

#### Panel A — Food Safety DFSL Completion

Displays DFSL completion KPIs for the current store. Refreshes every **6 hours** (guarded by `lastFoodSafetyFetch` / `FOOD_SAFETY_REFRESH_RATE`). Three stacked sections:

| Section | `idSuffix` | Date range |
|---|---|---|
| 14 Days | `''` | 14 days ago 00:00 → yesterday 23:59 |
| 7 Days | `'-7d'` | 7 days ago 00:00 → yesterday 23:59 |
| Yesterday | `'-1d'` | yesterday 00:00 → yesterday 23:59 |

**Color thresholds:**

| Color | Meaning |
|---|---|
| Green (`#00c853`) | ≥ 90% |
| Yellow (`#e6a800`) | 75–89% |
| Red (`#d9534f`) | < 75% |

**Data source:** Jolt `ListCompletionTimeSeries` query against 6 food safety list template IDs (`FOOD_SAFETY_TEMPLATES`). When the date range spans two calendar months the API returns two entries; both are averaged.

**Percentage font scaling:** `.fs-value` uses `clamp(1rem, 18cqw, 3.8rem)` — `cqw` is relative to the `.fs-tile` element's own width (via `container-type: inline-size`), so the percentage number always scales to fit the tile regardless of how narrow the column 3 card gets.

**Key functions:**

| Function | Purpose |
|---|---|
| `fetchFoodSafety(locationId, days, idSuffix)` | Builds rolling date range, calls Jolt proxy, averages multi-month series |
| `renderFoodSafetyKPI(complete, onTime, error, idSuffix)` | Updates KPI tiles with color class; `idSuffix` targets `''`, `'-7d'`, or `'-1d'` tile sets |
| `kpiColorClass(pct)` | Returns `"good"` / `"warn"` / `"bad"` |

---

#### Panel B — Chili Tracker

Shows active chili batches for the current day with real-time countdown timers. Polled every **5 minutes** with the rest of Jolt. Countdowns tick client-side every **1 second**.

**Template IDs:**

| Variable | Template name | Purpose |
|---|---|---|
| `CHILI_NEW_IDS[0]` | Chili | New batch label |
| `CHILI_NEW_IDS[1]` | Chili (Clone) | New batch label (alt printer) |
| `CHILI_ONLINE_IDS[0]` | Time Chili | Online/hold label |
| `CHILI_ONLINE_IDS[1]` | Time (Chili) | Online/hold label (alt format) |

**Batch states:**

| State | Trigger | Display |
|---|---|---|
| `COOKING` | New Chili label printed, "Done at" time still in the future | Countdown to done time (amber) |
| `READY` | New Chili label with "Done at" time in the past, not yet online | Static "NOT ONLINE" warning (red) |
| `ONLINE` | Matched to an active (non-expired) Online label | Countdown to hold-until time (green → amber when < 30 min) |
| `EXPIRED` | Hold-until time passed during the current 5-min poll window | "EXPIRED" text shown until next poll removes the card |

**Print count handling:** The Jolt API returns one record per print *event* even when multiple identical stickers are printed simultaneously (e.g., 2 labels printed at 2:06 PM = 1 record with `count: 2`). Each record is expanded by its `count` before any filtering or capping — so `count: 2` correctly produces 2 active ONLINE slots. Count is capped at 4 per record to prevent edge-case explosions.

**Pairing / consumption logic:**

1. All online print events for today are expanded by `count` → `allOnlineExpanded` (includes expired).
2. Active (non-expired) online slots are filtered from that pool, capped at 2 → `activeOnline` (shown on display).
3. New labels are also expanded by `count`, sorted newest-first → `allNewExpanded`.
4. `unconsumedNew` = new slots not yet accounted for by the total online event pool (`allNewExpanded.slice(allOnlineExpanded.length, +2)`). Only unconsumed new labels show as COOKING/READY — preventing morning new-chili labels from appearing as still-cooking once any online prints have been made.

**Time parsing:** Hold-until time found by regex-scanning all fields for `/^\d{1,2}:\d{2}\s*(am|pm)$/i` — works for both Online templates regardless of field index or extra temperature fields. "Done at" time found by scanning past a "Done at:" field for the next time-pattern match.

**Midnight-crossing guard:** `chiliTimeToDate(timeStr, anchorTs)` uses the label's own `startTimestamp` as the reference point. If the computed time is more than 2 hours before the print time it advances one calendar day, handling labels printed late-night with hold times that cross midnight.

**Key functions:**

| Function | Purpose |
|---|---|
| `fetchChiliLabels(locationId)` | Queries today's labels, expands by count, separates active from consumed, calls `renderChiliTracker` |
| `renderChiliTracker(batches, error)` | Builds batch cards with `data-target` timestamp attributes; no grace-period filter (expired slots excluded upstream) |
| `updateChiliCountdowns()` | Runs every 1s; updates countdown text and state classes |
| `pairChiliBatches(newEvents, onlineEvents)` | 1-to-1 sequential pairing: Nth online consumes Nth new; remainder shown as COOKING/READY |
| `parseChiliTimeFromFields(fields)` | Regex scans all fields for hold-until time |
| `parseDoneAtFromFields(fields)` | Scans past "Done at:" marker for cook-complete time |
| `chiliTimeToDate(timeStr, anchorTs)` | Converts "H:MM am/pm" to today's Date using label's print timestamp as midnight-crossing anchor |

---

#### Panel C — Chicken Line

Shows up to 8 active cooked-chicken hold stickers printed in the last 35 minutes. Each sticker card displays the expiry time (read directly from the label's `fields[1]`), a live countdown, and a progress bar that fills as the 30-minute hold drains. Polled every **5 minutes** with the rest of Jolt. Countdowns tick client-side every **1 second**.

**Template IDs:**

| Variable | Template name | Filter |
|---|---|---|
| `CHICKEN_DEDICATED_IDS[0]` | Time (Chicken) | Always included |
| `CHICKEN_GENERIC_IDS[0]` | Time | Only if `fields[3].value === 'Cooked Chicken'` |

The generic "Time" template is shared across products; the `fields[3]` filter ensures only chicken prints are shown.

**Card states:**

| State | Condition | Color |
|---|---|---|
| Fresh | > 10 min remaining | Green |
| Warning | 5–10 min remaining | Amber |
| Hot | < 5 min remaining | Red |
| Expired | Hold time elapsed | Gray, faded |

**Print count handling:** Same expansion logic as the chili tracker — each label record's `count` field is used to generate the correct number of individual chicken cards. A single print event with `count: 3` produces 3 cards, each with its own countdown.

**Constants:**
- `CHICKEN_HOLD_MS = 1 800 000` (30 min)
- `CHICKEN_LOOKBACK_S = 2 100` (35 min) — query window
- Max 8 cards displayed; oldest drop off when more than 8 are active

**Key functions:**

| Function | Purpose |
|---|---|
| `fetchChickenLabels(locationId)` | Queries last 35 min of labels, filters for chicken, expands by count, sorts newest-first, caps at 8 |
| `renderChickenTracker(labels, error)` | Builds 2-column grid of sticker cards with `data-target` expiry timestamps |
| `updateChickenCountdowns()` | Runs every 1s; updates countdowns, state classes, and progress bar widths |

---

### Column 1 Rotation (Announcements / This Week)

Column 1 alternates between **Announcements** and **This Week** (Events) every 30 seconds using a smooth CSS crossfade. The top border color changes with the active panel (teal `#0097a7` for Announcements, gold `#e6a800` for This Week). The hidden panel has `opacity: 0` and `pointer-events: none`.

Key pieces:
- `.rotating-card` / `.rotating-panel` / `.rotating-panel.hidden` — CSS classes in `style.css`
- `startCol1Rotation()` — called once at page load, fixed 30-second `setInterval`
- `col1ActivePanel` — global string: `'announcements'` or `'events'`
- `startCol3Rotation()` — column 3 uses recursive `setTimeout` with per-panel durations from `COL3_DURATIONS`; position tracked by `col3SeqIdx`

### Media Rotation Player (script.js)

Four `onSnapshot` listeners watch general, market, district, and store documents simultaneously. Any portal change reaches the dashboard within ~150ms (debounced).

Key functions:

| Function | Purpose |
|---|---|
| `startCol1Rotation()` | Alternates column 1 between Announcements and This Week every 60 seconds |
| `fetchFoodSafety(locationId)` | Fetches 14-day rolling food safety completion for the current store |
| `renderFoodSafetyKPI(complete, onTime, error)` | Renders completion/on-time percentages with color coding into column 3 |
| `initMediaRotation(market, district)` | Sets up 4 Firestore listeners, called once on first data load |
| `onMediaDataUpdate(...)` | Rebuilds queue and settings on any Firestore change |
| `buildQueue(...)` | Merges items from all levels, filters by active dates |
| `runRotation(queue, settings)` | Async loop — plays each item, then schedules rest |
| `scheduleNext(settings)` | Re-filters active items and starts next rotation |
| `stopRotation()` | Aborts playback, restores info columns |
| `showInfoCards()` | Hides video panel, restores the 3 info columns |
| `hideInfoCards()` | Hides 3 info columns, shows video panel |
| `playVideo(item, el)` | Direct MP4 — resolves on `ended` event |
| `playYouTube(item, el)` | YouTube embed — resolves on postMessage state=0 or duration timeout |
| `playIframe(item, el)` | Brightcove/other — resolves on `durationSeconds` timeout |
| `playPDF(item, el)` | PDF via viewer — resolves on `durationSeconds` timeout |
| `buildYouTubeEmbed(url)` | Extracts video ID, appends autoplay + enablejsapi + origin params |
| `buildIframeUrl(url)` | Appends `autoplay=true&muted=true` for Brightcove URLs |
| `buildPDFEmbedUrl(url)` | Converts GitHub blob to raw URL; converts Drive to /preview; routes through Google Docs Viewer |
| `detectMediaType(url)` | Returns `youtube`, `video`, `pdf`, or `iframe` |

### Jolt Integration

Requires `?store=` param to be set and `joltLocationId` in the store document.

**Checklists:** Fetches incomplete items within a 31-day window. Splits into Current & Late (deadline ≤ now) and Upcoming (displayTimestamp within 3 hours). Items expired more than 24 hours ago are hidden.

**Sensors:** Fetches active temperature sensors. Shows reading in °F, battery level, signal status. Sensors offline for more than 15 minutes blink.

---

### Sensor Row

Displayed as a fixed-height row at the bottom of both dashboards. Row height is `max(12%, 80px)` of viewport height — the `80px` floor prevents the row from collapsing on small screens (phones in landscape).

**Card layout:**
- Sensor name: top-aligned, single line with ellipsis (`white-space: nowrap`)
- Temperature reading: bottom-aligned via `margin-top: auto` — sits directly above the signal row regardless of card height
- Signal row: always pinned to the very bottom (battery icon + "On Line" / "No Sig" status)
- When a sensor is offline the "Last Reading" indicator appears between the reading and signal row; the reading font shrinks slightly (CSS `:has(.last-reading-indicator)`) to keep all three elements visible

**Font scaling:** Reading uses `clamp(1.5rem, 20cqw, 3rem)` — `cqw` is relative to the sensor card's own width (via `container-type: inline-size` on `.sensor-card`), so the number always fits regardless of how many cards share the row.

**Scroll mode:** When the number of sensors exceeds the scroll threshold the row switches to a continuous left-to-right marquee:

| File | Scroll threshold | Reason |
|---|---|---|
| `dash-min.html` | > 7 cards | Split-screen / half-screen layout |
| `index.html` | > 12 cards | Full-screen 32–42" TV, more cards fit comfortably |

Threshold is set by `SENSOR_SCROLL_THRESHOLD` constant in `script.js`, detected at runtime from `window.location.pathname`.

**Scroll implementation:**
- Cards get fixed width `130px` + `margin-right: 5px` (replaces CSS `gap` so pixel math is exact)
- Enough copies of the card set are rendered so `total track width ≥ viewport width + one set width` — guarantees no empty space on the right during the animation
- `@keyframes sensor-scroll` translates by `--sensor-one-set-width` (set in JS as `sensors.length × 135px`) — exact pixel offset means the seam is seamless
- Animation speed: `max(28s, sensors.length × 4s)` — hover pauses the scroll
- Sensor names clamp to 2 lines (`-webkit-line-clamp: 2`) in scroll mode to prevent pushing the reading off the bottom of the card
- Safari/WebKit compatibility: `overflow: hidden` is kept on `#sensor-row-container` only (not on `#sensor-grid`); `height: 100%` is set on `#sensor-grid.sensor-scrolling` to prevent Safari's flex-child height collapse bug

---

## Setup Guide

### Phase 1: Firebase Setup

1. Create project at [firebase.google.com/console](https://console.firebase.google.com)
2. Enable **Firestore Database** (production mode)
3. Enable **Authentication** → Email/Password provider
4. Get web app config from Project Settings → Your apps → Web
5. Apply security rules (see below)
6. Update `firebaseConfig` in both `portal.html` and `script.js`

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /company/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /markets/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /districts/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /stores/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /users/{userId} {
      allow read: if request.auth != null &&
        (request.auth.uid == userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Phase 2: First Admin User

1. Firebase Console → Authentication → Add user (email + password)
2. Copy the UID
3. Firestore → Create collection `users` → document with that UID:
```
email: "admin@example.com"
name: "System Admin"
role: "admin"
assignedMarket: null
assignedDistrict: null
assignedSite: null
```

### Phase 3: Data Migration

1. Upload `general.json` via Admin → Data Tools
2. Upload all `store-XXXX.json` files
3. Upload hierarchy CSV to link stores to markets/districts

### Phase 4: Create Users

Admin → User Management → Create User. Assign role and market/district/store as appropriate.

### Phase 5: Configure Media Rotation (optional)

1. Login as admin, select Company Level (General)
2. Scroll to Media Rotation, toggle Enabled
3. Add video/PDF items
4. Save — dashboards update within seconds

### Phase 6: Debian Kiosk Setup

On each Debian display device, create a startup script:
```bash
#!/bin/bash
chromium-browser \
  --kiosk \
  --autoplay-policy=no-user-gesture-required \
  --disable-infobars \
  --noerrdialogs \
  --url "https://yoursite.github.io/Harmony/dash-min.html?store=XXXX"
```

For Brightcove support, install Widevine first:
```bash
sudo apt-get install -y chromium-widevine
```

---

## GitHub Pages Hosting

The project is hosted on GitHub Pages (free static hosting).

**PDF hosting via /Media folder:**
- Commit PDFs to the `/Media` folder in the repo (25 MB per file GitHub limit)
- GitHub Pages URL: `https://username.github.io/Harmony/Media/file.pdf`
- The portal's **Browse /media Folder** button uses the GitHub Contents API to list available files and generate the correct URLs automatically

**File browser auto-detection:** The portal detects the GitHub owner and repo from the `window.location.hostname` — no hardcoding needed. If using a custom domain, set `GITHUB_OWNER_OVERRIDE` and `GITHUB_REPO_OVERRIDE` in `portal.html`.

---

## Firebase Spark Plan Notes

The project runs on Firebase's free Spark plan. **Firebase Storage is not available** on Spark — all media (videos and PDFs) must be hosted externally:

- Videos: YouTube (recommended), Brightcove, or any CDN
- PDFs: Google Drive, GitHub Pages /Media folder, or any public URL

**Spark plan limits:**
- Firestore: 1 GB storage, 50k reads/day, 20k writes/day
- Authentication: Unlimited
- Hosting: 10 GB storage, 360 MB/day transfer

With 68 dashboards refreshing every 5 minutes and 4 `onSnapshot` listeners per dashboard, Firestore reads are driven by actual document changes rather than polling — well within Spark limits.

---

## Troubleshooting

### Portal Issues

**Portal page won't load**
- Check the `importmap` in `portal.html` for trailing commas — the JSON must be valid
- Open DevTools console for specific error

**"Permission denied" when saving**
- Firestore security rules not configured — apply rules from Setup Guide

**text-muted / input labels invisible**
- The portal overrides Bootstrap's default `text-muted` color to `#aaa` and `input-group-text` to dark background — if these appear invisible check the `<style>` block at the top of `portal.html`

### Dashboard Issues

**Jolt 403 error**
- URL must include `?store=YOUR_STORE_ID` — the Jolt proxy requires this parameter

**Jolt data not loading on localhost**
- `localhost` must be in the Jolt proxy worker allowlist
- Verify the worker's CORS configuration

**Sensors / checklists not loading**
- Verify `joltLocationId` is set in the store's Firestore document
- Check browser console for network errors

**Media rotation not starting**
- Confirm **Enabled** is toggled on at General level and saved
- Confirm at least one item has a valid URL
- Check that `activeUntil` date (if set) hasn't passed
- Open DevTools console — `[Media]` prefixed logs show rotation state

**YouTube video doesn't auto-advance**
- The `origin` parameter must match the page's origin for YouTube IFrame API events to fire
- `buildYouTubeEmbed()` handles this automatically — ensure the function includes `&origin=`
- Check console for `[Media] YouTube postMessage:` logs
- If no logs appear, the `durationSeconds` fallback (10 min default) will advance the rotation

**Brightcove doesn't autoplay**
- Add `encrypted-media` to the iframe's `allow` attribute (already done in current version)
- Install Widevine on Debian Chromium if DRM content fails entirely

**PDF shows CSP / framing error**
- GitHub blob URLs and raw.githubusercontent.com cannot be framed directly
- `buildPDFEmbedUrl()` handles this automatically: GitHub blob → raw URL → Google Docs Viewer
- Google Drive URLs are converted to `/preview` format automatically
- Ensure the PDF URL is publicly accessible (not behind auth)

**"Encrypted media" violation for Brightcove**
- On Debian Chromium without Widevine: install `chromium-widevine` package
- Or switch to YouTube for video content

---

## Maintenance

### Content
- Review and remove expired alerts, LTOs, and events regularly
- Media rotation items with `endDate` self-expire — no manual cleanup needed

### Weekly
- Check sensor battery levels on dashboards
- Review active alerts

### Monthly
- Audit user list, remove inactive accounts
- Review Firestore usage in Firebase Console

### Quarterly
- Review Firestore security rules
- Update daypart schedules for seasonal changes

---

## Support & Resources

- Firebase Documentation: https://firebase.google.com/docs
- Bootstrap 5 Docs: https://getbootstrap.com/docs/5.3/
- YouTube IFrame API: https://developers.google.com/youtube/iframe_api_reference
- GitHub Contents API: https://docs.github.com/en/rest/repos/contents

---

**Version:** 2.6
**Last Updated:** June 24, 2026
