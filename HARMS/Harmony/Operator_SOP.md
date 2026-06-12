# Harmony Portal — Operator Standard Operating Procedure

## 1. Overview

The **Harmony Portal** is a web-based content management tool that controls what appears on your in-store Harmony displays. As an **Operator**, you manage content for your entire operator group (market), including all districts and individual stores within your group.

### What You Can Do

- Edit content at the **Operator level** (applies to all districts and stores in your group)
- Edit content at the **District level** (applies to all stores in a specific district)
- Edit content at the **Individual Store level** (applies to one store only)
- Manage Alerts, Announcements, LTOs, Events, and Daypart Schedules at every level you control

### What You Cannot Do

- Access Company Level (General) settings — only Admins can edit these
- Access the Admin panel or manage users
- Edit content for districts or stores outside your assigned operator group

---

## 2. Logging In

### First-Time Login

1. Open the Harmony Portal URL in your web browser.
2. You will see the **Harmony Portal** login screen.
3. Enter the **Email** and **Temporary Password** provided by your administrator.
4. Click **Login**.
5. Contact your administrator to request a password reset email so you can set your own password.

### Returning Login

1. Open the Harmony Portal URL.
2. Enter your **Email** and **Password**.
3. Click **Login**.

### Password Reset

If you need to reset your password, contact your administrator. They can send a password reset email from the Admin panel. You will receive an email with a link to create a new password.

### Troubleshooting Login

- **Incorrect password:** Double-check your email and password. Passwords are case-sensitive.
- **Account not found:** Contact your administrator to verify your account exists.
- **Login error message:** The portal will display the specific error below the login form. Share this with your administrator if you need help.

---

## 3. Portal Navigation

After logging in, you will see the portal with these elements:

### Top Navigation Bar

| Element | Description |
|---------|-------------|
| **Harmony Portal** | Brand logo/text on the far left |
| **Edit Content** | Navigation tab — your main workspace (active by default) |
| **Your Email** | Displayed on the right side of the navbar |
| **Logout** | Red button to sign out of the portal |

> **Note:** You will not see an "Admin" tab. That is only visible to administrators.

### Main Layout

The editing workspace is split into two columns:

- **Left Column (Select Site):** A dropdown to choose which level or site you want to edit.
- **Right Column (Editor):** The content editor that appears after you select a site. Before selecting a site, you will see the message: *"Select a site to start editing."*

---

## 4. Selecting a Site

The **Select Site** dropdown is your primary way to choose what you are editing. As an Operator, your dropdown contains:

### Dropdown Options

| Option Format | What It Means | Where Changes Save |
|---------------|---------------|-------------------|
| `Operator: [YourGroupName]` | Your operator-level settings | `markets/[YourGroupName]` in Firestore |
| `District: [DistrictName]` | A specific district in your group | `districts/[DistrictName]` in Firestore |
| `Store: [StoreID]` | An individual store | `stores/[StoreID]` in Firestore |

### How to Select

1. Click the **Select Site** dropdown (shows `-- Select a Site --` by default).
2. Choose the level you want to edit:
   - Pick your **Operator** entry to set defaults for your entire group.
   - Pick a **District** to set content for all stores in that district.
   - Pick a **Store** to set content for one specific location.
3. The editor will load on the right with the current content for that selection.
4. The title above the editor will update to show what you are editing (e.g., *"Editing market:YourGroupName"*).

---

## 5. Editing Alerts

Alerts appear as colored banners on the Harmony display. They are useful for urgent messages, reminders, or informational notices.

### Alert Fields

| Field | Description | Required |
|-------|-------------|----------|
| **Alert Text** | The message displayed in the alert banner | Yes |
| **Type** | The style/color of the alert | Yes |
| **Custom Colors** | Background and text color pickers (only visible when Type is "Custom") | Only for Custom |
| **Start Date** | Date the alert begins showing | No |
| **End Date** | Date the alert stops showing | No |

### Alert Types

| Type | Appearance |
|------|------------|
| **Normal** | Green background |
| **Info** | Blue background |
| **Warning** | Red background |
| **Custom** | You choose the background and text colors |

### Adding an Alert

1. Click the **+ Add Alert** button below the Alerts section.
2. A new alert row appears with empty fields.
3. Enter the **Alert Text** — this is the message your stores will see.
4. Select a **Type** from the dropdown:
   - Choose **Normal (Green)**, **Info (Blue)**, or **Warning (Red)** for preset colors.
   - Choose **Custom** to reveal two color pickers: one for **Background Color** and one for **Text Color**.
5. Optionally set a **Start Date** and/or **End Date** to control when the alert is visible.
6. Click **Save Changes** at the bottom of the page to apply.

### Removing an Alert

1. Find the alert you want to remove.
2. Click the red **Remove** button on that alert row.
3. The row disappears immediately from the editor.
4. Click **Save Changes** to confirm the removal.

> **Important:** Removing an alert only removes it from the editor. You must click **Save Changes** for the removal to take effect on the displays.

---

## 6. Editing Announcements

Announcements are text messages that scroll or display on the Harmony screen. Use them for general information, promotions, or team messages.

### Announcement Fields

| Field | Description | Required |
|-------|-------------|----------|
| **Announcement Text** | The message to display | Yes |
| **Start Date** | Date the announcement begins showing (optional) | No |
| **End Date** | Date the announcement stops showing (optional) | No |

### Adding an Announcement

1. Click **+ Add Announcement** below the Announcements section.
2. A new row appears.
3. Type your message in the **Announcement Text** field.
4. Optionally set **Start Date** and/or **End Date** to schedule visibility.
5. Click **Save Changes**.

### Removing an Announcement

1. Click the red **Remove** button on the announcement row.
2. Click **Save Changes** to confirm.

---

## 7. Editing LTOs (Limited Time Offers)

LTOs showcase special menu items or promotions with an icon/emoji and an optional countdown timer.

### LTO Fields

| Field | Description | Required |
|-------|-------------|----------|
| **LTO Name** | The name of the limited time offer | Yes |
| **Icon/Emoji** | A visual icon displayed next to the LTO name | No |
| **Countdown?** | Toggle switch to enable a countdown timer | No |
| **Countdown Date** | The date/time the countdown targets (only active when Countdown is on) | Only if Countdown is enabled |

### Setting the Icon/Emoji

There are two ways to set an icon:

1. **Quick Pick dropdown:** Select from a list of preset food and promo emojis. The dropdown includes items like Burger, Fries, Drink, Ice Cream, Coffee, Taco, Pizza, and more. When you select one, it fills the icon field automatically.
2. **Manual entry:** Type or paste any emoji directly into the small icon text box on the left.

### Adding an LTO

1. Click **+ Add LTO** below the LTOs section.
2. Enter the **LTO Name** (e.g., "Spicy Chicken Sandwich").
3. Set an icon using the Quick Pick dropdown or by typing an emoji manually.
4. To add a countdown:
   - Toggle the **Countdown?** switch to ON.
   - The date/time picker will become active.
   - Select the target date and time for the countdown.
5. Click **Save Changes**.

### Removing an LTO

1. Click the red **Remove** button on the LTO row.
2. Click **Save Changes** to confirm.

---

## 8. Editing Events

Events are displayed in the "This Week" section of the Harmony display. Use them for team meetings, training sessions, promotional events, or any time-bound activity.

### Event Fields

| Field | Description | Required |
|-------|-------------|----------|
| **Event Name** | The name/description of the event | Yes |
| **Start Date** | When the event begins (optional) | No |
| **End Date** | When the event ends (optional) | No |

### Adding an Event

1. Click **+ Add Event** below the Events section.
2. Enter the **Event Name** (e.g., "All-Hands Meeting").
3. Optionally set **Start Date** and/or **End Date**.
4. Click **Save Changes**.

### Removing an Event

1. Click the red **Remove** button on the event row.
2. Click **Save Changes** to confirm.

---

## 9. Editing Daypart Schedule

The Daypart Schedule defines the time blocks shown on the Harmony display (e.g., Breakfast, Lunch, Dinner). This section is collapsed by default to save screen space.

### Viewing the Daypart Section

1. Click the **Show / Hide** button next to the "Daypart Schedule" heading.
2. The section will expand to show all current dayparts and the **+ Add Daypart** button.

### Daypart Fields

| Field | Description | Required |
|-------|-------------|----------|
| **Name** | The daypart name (e.g., "Breakfast") | Yes |
| **Start Time** | When this daypart begins (time picker) | Yes |
| **End Time** | When this daypart ends (time picker) | Yes |
| **Color** | Background color for the daypart block (color picker) | Yes (defaults to dark gray) |
| **Icon** | A text icon or emoji for the daypart | No |

> **Important:** For midnight, use **23:59** instead of 24:00 or 00:00. The portal displays this warning above the daypart editor.

### Adding a Daypart

1. Click **Show / Hide** to expand the Daypart Schedule section.
2. Click **+ Add Daypart**.
3. Enter the **Daypart Name** (e.g., "Late Night").
4. Set the **Start Time** and **End Time** using the time pickers.
5. Click the **Color** swatch to choose a background color.
6. Optionally enter an **Icon** (emoji or text character).
7. Click **Save Changes**.

### Removing a Daypart

1. Click the red **Remove** button on the daypart row.
2. Click **Save Changes** to confirm.

---

## 10. Saving Changes

### How Saving Works

1. After making any edits (adding, modifying, or removing content), click the blue **Save Changes** button at the bottom of the editor.
2. The button changes to **"Saving..."** and becomes disabled while the save is in progress.
3. A confirmation dialog appears: **"Saved successfully!"** — click OK to dismiss.
4. The button returns to **"Save Changes"** and is re-enabled.

### Where Your Changes Save

| Selected Level | Firestore Location | Who Sees It |
|----------------|-------------------|-------------|
| `Operator: [YourGroup]` | `markets/[YourGroup]` | All districts and stores in your group |
| `District: [Name]` | `districts/[Name]` | All stores in that district |
| `Store: [StoreID]` | `stores/[StoreID]` | Only that specific store |

### What Gets Saved

Every time you click Save, **all five content sections** are saved together:
- Alerts
- Announcements
- LTOs
- Events
- Daypart Schedule

> **Tip:** If you only changed one alert, the save still includes all content in all sections for that level. Make sure all sections look correct before saving.

### If Save Fails

If an error occurs, an alert will display the error message. Common causes:
- Lost internet connection
- Session expired (log out and log back in)
- Firestore permissions issue (contact your administrator)

---

## 11. Understanding Content Hierarchy

Harmony uses a cascading content system. Content flows down from the top level and can be overridden at lower levels:

```
Company (General)        ← Set by Admins only
  └── Operator (Market)  ← YOU set this for your entire group
        └── District     ← YOU can override for specific districts
              └── Store  ← YOU can override for individual stores
```

### How It Works

- **Company Level** content is the baseline default for all stores.
- **Operator Level** content overrides Company content for all stores in your group.
- **District Level** content overrides Operator content for all stores in that district.
- **Store Level** content overrides everything above for that one store.

### Practical Example

1. An Admin sets a company-wide announcement: "Welcome to Harmony!"
2. You add an operator-level announcement: "Operator Group Special: Free Coffee Fridays"
3. You add a district-level announcement for District A: "District A Training Wednesday"
4. You add a store-level announcement for Store 1234: "Store 1234 Grand Re-opening!"

**Result:**
- Stores in other operator groups see only the company announcement.
- Stores in your group (but not District A) see company + operator announcements.
- Stores in District A (except 1234) see company + operator + district announcements.
- Store 1234 sees company + operator + district + its own store announcement.

---

## 12. Tips and Best Practices

1. **Start at the Operator level.** Set your default content at the Operator level first, then override only where needed at district or store level.

2. **Use date ranges for temporary content.** Instead of manually adding and removing alerts or announcements, set Start and End dates so they appear and disappear automatically.

3. **Preview before saving.** Review all five sections before clicking Save Changes — the save includes everything on the page.

4. **Use alert types consistently.** Establish a convention for your team:
   - **Normal (Green):** Positive news, celebrations, everyday info
   - **Info (Blue):** FYI, neutral updates, reminders
   - **Warning (Red):** Urgent issues, critical reminders, safety alerts

5. **Keep LTO icons relevant.** Use the Quick Pick dropdown for common food emojis, or paste a custom emoji for unique items.

6. **Daypart midnight note.** Always enter **23:59** for midnight. Entering 24:00 or 00:00 may cause display issues.

7. **One change at a time when troubleshooting.** If something doesn't look right on the display, edit one section, save, and verify before making additional changes.

8. **Log out when done.** Always click the **Logout** button when you finish editing to keep your account secure.

9. **Content that is removed but not saved still exists.** Clicking Remove only removes a row from the editor view. You must click Save Changes to permanently delete it.

10. **Empty text fields are ignored.** If you add an alert, LTO, announcement, or event but leave the text field blank, it will not be saved.
