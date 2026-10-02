# Harmony Project Status & Deployment Resume Guide

*Last Updated: 2026-10-02*

---

## 1. Overview & Architecture

* **Repository**: [`https://github.com/Ckuran148/Harmony`](https://github.com/Ckuran148/Harmony)
* **Production Deployment**: Hosted via **GitHub Pages** tracking the `main` branch:
  * **Main Dashboard**: [`https://ckuran148.github.io/Harmony/`](https://ckuran148.github.io/Harmony/)
  * **Mini Dashboard**: [`https://ckuran148.github.io/Harmony/dash-min.html`](https://ckuran148.github.io/Harmony/dash-min.html)
  * **Admin Portal**: [`https://ckuran148.github.io/Harmony/portal.html`](https://ckuran148.github.io/Harmony/portal.html)
* **Backend Database**: Firebase Firestore (`harmony9503`)
* **External Integrations**: Jolt GraphQL API (sensors, food safety checklists, chicken & chili timers), ThermoWorks Cloud API.

---

## 2. Current Git State

* **Active Branch**: `main`
* **Latest Commit**: `e2f7a60` — Sync portal fresh-beef --text-on-inset to #000000
* **Sync Status**: Up to date with `origin/main`. All changes deployed to production.

---

## 3. Seasonal Theme System (NEW — Oct 2026)

A configurable color theme system that allows seasonal branding across all dashboards, controllable per site through the existing Firebase data cascade.

### How It Works

1. **CSS Custom Properties**: All hardcoded colors in `style.css` have been converted to CSS variables with `:root` defaults matching the original dark theme.
2. **Theme Presets**: Defined as JS objects in `script.js` (`THEMES` constant). Currently includes:
   - `default` — Original dark theme (no overrides, uses CSS `:root` values)
   - `fresh-beef` — Red/yellow Wendy's "100% Fresh Never-Frozen Beef" campaign theme
   - `custom` — Fully user-defined, starts from default dark values
3. **Firebase Cascade**: Theme config stored as a `theme` field at any cascade level (company > market > district > store). Child levels override parent levels.
4. **Dashboard Application**: `applyTheme()` in `script.js` sets CSS variables on `document.documentElement` after merging preset + overrides.
5. **Portal Management**: Theme section in `portal.html` with preset dropdown and 24 color pickers organized into groups.

### CSS Variables (24 total)

| Group | Variable | Default | Description |
|-------|----------|---------|-------------|
| **Backgrounds** | `--bg-body` | `#121212` | Page background |
| | `--bg-card` | `#252525` | Card background |
| | `--bg-sensor-row` | `#1e1e1e` | Sensor row container |
| | `--bg-jolt-bottom` | `#2a2a2a` | Jolt bottom section, FS card sections |
| | `--bg-daypart` | `#333` | Daypart banner background |
| | `--bg-inset` | `#181818` | Inset panels (FS tiles, chili states) |
| | `--bg-site-indicator` | `rgba(0,0,0,0.6)` | Store number badge |
| **Accents** | `--accent-primary` | `#0097a7` | Card top borders |
| | `--accent-jolt` | `#0088ff` | Jolt card top border |
| **Borders** | `--border-light` | `#555` | Light borders (h2, daypart, site badge) |
| | `--border-dark` | `#333` | Dark borders (li, FS section dividers) |
| | `--border-medium` | `#444` | Medium borders (sensor cards) |
| **Text** | `--text-primary` | `#ffffff` | Primary text, headings |
| | `--text-secondary` | `#ddd` | Secondary text, list items |
| | `--text-muted` | `#aaa` | Muted text, jolt headers |
| | `--text-dim` | `#555` | Dim text ("None soon", "No Sensors") |
| | `--text-on-inset` | `#ccc` | Text on inset backgrounds (FS period labels, values) |
| | `--text-fs-label` | `#ccc` | FS tile labels ("COMPLETION", "ON TIME") |
| | `--text-countdown` | `#ffcc00` | LTO countdown timers |
| | `--text-live` | `#00ff00` | "LIVE!" label on LTOs |
| | `--text-discontinued` | `#ff4444` | "DISCONTINUED" label on LTOs |
| **Alerts** | `--alert-default` | `#028a0f` | Default alert banner (green) |
| | `--alert-warning` | `#b00000` | Warning alert banner (red) |
| | `--alert-info` | `#005cc8` | Info alert banner (blue) |

### Fresh Beef Preset Colors

```js
"fresh-beef": {
  "--bg-body": "#ff0000",        // Red page background
  "--bg-card": "#fffb00",        // Yellow cards
  "--bg-sensor-row": "#fffb00",  // Yellow sensor row
  "--bg-jolt-bottom": "#fffb00", // Yellow jolt sections
  "--bg-daypart": "#5a4520",     // Dark amber daypart
  "--bg-inset": "#6b0505",       // Dark red insets
  "--bg-site-indicator": "#cccccc",
  "--accent-primary": "#d4a020", // Gold accent
  "--accent-jolt": "#e2203a",    // Red jolt accent
  "--border-light": "#7a6530",
  "--border-dark": "#5a4520",
  "--border-medium": "#6a5528",
  "--text-primary": "#000000",   // Black text
  "--text-secondary": "#000000",
  "--text-muted": "#000000",
  "--text-dim": "#000000",
  "--text-on-inset": "#000000",
  "--text-fs-label": "#cccccc",  // Light FS labels on dark insets
  "--text-countdown": "#e2203a", // Red countdowns
  "--text-live": "#000000",
  "--text-discontinued": "#ff4444",
  "--alert-default": "#fffb00",  // Yellow alerts
  "--alert-warning": "#fffb00",
  "--alert-info": "#fffb00",
}
```

### Firebase Schema

```json
{
  "theme": {
    "preset": "fresh-beef",
    "overrides": {
      "--accent-primary": "#ff0000"
    }
  }
}
```

- `preset`: Name of a built-in theme (`"default"`, `"fresh-beef"`, or `"custom"`)
- `overrides`: Optional map of CSS variable names to color values (only colors changed from preset defaults)
- Set to `null` or omit to inherit from parent level in the cascade

### Cascade Behavior

| Company | Market | District | Store | Result |
|---------|--------|----------|-------|--------|
| fresh-beef | -- | -- | -- | All stores get fresh-beef |
| fresh-beef | -- | -- | default | That store gets default, others get fresh-beef |
| -- | -- | -- | fresh-beef | Only that store gets fresh-beef |
| default | -- | fresh-beef | -- | Stores in that district get fresh-beef |

### Colors NOT Themed (Semantic / Status)

These colors remain fixed regardless of theme because they convey safety/status information:
- `.temp-critical` red (`#d9534f`) — temperature out of range
- `.temp-warning` yellow (`#e6a800`) — temperature borderline
- Food safety tile status borders: green (`#00c853`), yellow (`#e6a800`), red (`#d9534f`)
- Food safety percentage values: colored by `.good`/`.warn`/`.bad` class
- Chili/chicken tracker status state colors
- Battery level indicator colors

### Adding a New Theme Preset

1. Add an entry to `THEMES` in `script.js` with the CSS variable overrides
2. Add matching entry to `PORTAL_THEMES` in `portal.html`
3. Add an `<option>` to the `#theme-preset` dropdown in `portal.html`
4. No CSS changes needed — driven entirely by variables

### Files Modified

| File | Changes |
|------|---------|
| `style.css` | Added `:root` with 24 CSS variables; replaced all hardcoded non-semantic colors |
| `script.js` | Added `THEME_VARS`, `THEMES`, `applyTheme()`; cascade call in `fetchData()` |
| `portal.html` | Added theme section with preset dropdown, 24 grouped color pickers, save/load logic |
| `index.html` | Replaced 4 inline hardcoded colors with `var()` references |
| `dash-min.html` | Replaced 4 inline hardcoded colors with `var()` references |

### Relevant Commits

- `43d3d53` — Add seasonal theme system with CSS custom properties
- `d9fc871` — Expand portal theme UI to show all 24 color pickers with Custom option
- `e2f7a60` — Sync portal fresh-beef --text-on-inset to #000000

---

## 4. ThermoWorks Cloud Integration (Sep 2026)

* Cloud-based temperature sensor integration via Firebase Cloud Functions
* Per-device channel selection in portal
* Sensor grid displays alongside Jolt sensors with TW badge
* Race condition fixes between Jolt and ThermoWorks snapshot listeners

### Relevant Commits

- `41ecff5` — Add ThermoWorks Cloud sensor integration
- `319cd93` — Fix thermoworks-push for deployment
- `63f7cb2` — Add per-device channel selection for ThermoWorks sensors
- `9548a6e` — Fix sensor grid race condition between Jolt and ThermoWorks
- `ecf31bc` — Fix TW snapshot overwriting Jolt sensor grid

---

## 5. Audio & Media Sound System (Aug 2026)

* In-memory synthesized WAV alarm tones for chicken/chili expiration
* Per-media-item sound toggle in portal and playlist player
* Avoids AudioContext autoplay restrictions in kiosk browsers

### Relevant Commit

- `ad2ef5b` — Save sound-toggle branch work before ThermoWorks integration

---

## 6. Untracked Files & Folders

* `HARMS/` — Legacy nested repository folder
* `Resource/` — Python test scripts and CSV data for Jolt API queries
* `JOLT_LOCAL_MIGRATION_PLAN.md` — Architectural migration planning doc
* `THERMOWORKS_INTEGRATION_PLAN.md` — ThermoWorks integration planning doc
* `New Microsoft Excel Worksheet.xlsx` — Temporary local workbook
* `nul` — Empty artifact (safe to delete)

---

## 7. Deployment

All code is on `main` and deployed via GitHub Pages automatically. To verify:

1. Push to `main`
2. GitHub Pages builds (~1-2 minutes)
3. Test at the production URLs listed in Section 1
