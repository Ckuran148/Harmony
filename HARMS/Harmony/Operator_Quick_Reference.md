# Harmony Portal — Operator Quick Reference

## Login

1. Open the Harmony Portal URL.
2. Enter your **Email** and **Password**.
3. Click **Login**.
- Forgot password? Contact your administrator to send a reset email.

---

## Site Selector

Your dropdown contains three types of entries:

| Entry | Scope | Use When |
|-------|-------|----------|
| **Operator: [YourGroup]** | All districts and stores in your group | Setting defaults for everyone |
| **District: [Name]** | All stores in one district | Overriding for a specific district |
| **Store: [StoreID]** | One store only | Overriding for a single location |

---

## Alerts

| Field | Notes |
|-------|-------|
| Alert Text | The message shown on the banner |
| Type | Normal (green), Info (blue), Warning (red), Custom (pick your colors) |
| Custom Colors | Background + Text color pickers — only visible when Type = Custom |
| Start Date | Optional — when the alert starts showing |
| End Date | Optional — when the alert stops showing |

**Quick steps:** Click **+ Add Alert** > fill text > pick type > optionally set dates > **Save Changes**

---

## Announcements

| Field | Notes |
|-------|-------|
| Announcement Text | The message to display |
| Start Date | Optional |
| End Date | Optional |

**Quick steps:** Click **+ Add Announcement** > fill text > optionally set dates > **Save Changes**

---

## LTOs (Limited Time Offers)

| Field | Notes |
|-------|-------|
| LTO Name | Name of the offer |
| Icon/Emoji | Use Quick Pick dropdown or type/paste any emoji |
| Countdown? | Toggle ON to enable countdown timer |
| Countdown Date | Pick target date/time (only active when Countdown is ON) |

**Quick steps:** Click **+ Add LTO** > enter name > pick emoji > optionally enable countdown > **Save Changes**

---

## Events (This Week)

| Field | Notes |
|-------|-------|
| Event Name | Name/description of the event |
| Start Date | Optional |
| End Date | Optional |

**Quick steps:** Click **+ Add Event** > fill text > optionally set dates > **Save Changes**

---

## Daypart Schedule

Click **Show / Hide** to expand/collapse the daypart section.

| Field | Notes |
|-------|-------|
| Name | Daypart name (e.g., "Breakfast") |
| Start Time | Time picker |
| End Time | Time picker — use **23:59** for midnight |
| Color | Color picker for background |
| Icon | Optional emoji or text character |

**Quick steps:** Click **Show / Hide** > **+ Add Daypart** > fill all fields > **Save Changes**

---

## Saving

1. Click the blue **Save Changes** button at the bottom.
2. Button shows "Saving..." while in progress.
3. Confirmation popup: "Saved successfully!"
- All five sections save together every time.
- Empty text fields are automatically excluded.
- Removing a row requires Save to take effect.

---

## Content Hierarchy

```
Company (General)  ← Admin only
  └── Operator     ← Your defaults for all stores
        └── District   ← Override per district
              └── Store    ← Override per store
```

Lower levels override higher levels. Set defaults at Operator level, override only where needed.

---

## Common Actions

### Change an existing alert
1. Select the site level from the dropdown.
2. Edit the alert text, type, or dates directly in the row.
3. Click **Save Changes**.

### Remove content
1. Click **Remove** on the row.
2. Click **Save Changes** — removal is not saved until you click Save.

### Schedule temporary content
- Set a **Start Date** and **End Date** on any alert, announcement, or event.
- Content will automatically appear and disappear based on those dates.

### Add an LTO with countdown
1. Click **+ Add LTO**.
2. Enter the name and pick an emoji.
3. Toggle **Countdown?** to ON.
4. Set the target date/time.
5. Click **Save Changes**.

---

## Tips

- Use **23:59** for midnight in daypart times.
- Always preview all sections before saving — the save includes everything on the page.
- Log out when finished to keep your account secure.
- Alert type conventions: Green = positive, Blue = info, Red = urgent.
