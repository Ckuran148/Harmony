# Harmony Portal - Complete Documentation

## Project Overview

Harmony is a real-time dashboard system for managing restaurant operations across multiple locations. It displays live information including alerts, sensors, checklists, and schedules to crew members while providing a management portal for content editing.

### Core Components

1. **portal.html** - Administrative interface for content management and user administration
2. **index.html** - Public-facing dashboard display for crew members
3. **Firebase Firestore** - Cloud database for all content and user data
4. **Jolt Integration** - External API for checklists and sensor data

---

## File Structure

```
Harmony/
├── portal.html          # Admin portal (login, content editor, user management)
├── index.html           # Dashboard viewer (displays real-time info)
├── script.js            # Dashboard logic & Firebase integration
├── style.css            # Dashboard styling
├── firebase-config.js   # Shared Firebase configuration
├── general.json         # Company-level data template
└── store-XXXX.json      # Store-specific data templates
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
│       └── daypartSchedule: Array<Daypart>
│
├── markets/
│   └── {marketName} (document)
│       ├── alerts: Array<Alert>
│       ├── announcements: Array<Announcement>
│       ├── ltos: Array<LTO>
│       └── events: Array<Event>
│
├── districts/
│   └── {districtName} (document)
│       ├── alerts: Array<Alert>
│       ├── announcements: Array<Announcement>
│       ├── ltos: Array<LTO>
│       └── events: Array<Event>
│
├── stores/
│   └── {storeId} (document)
│       ├── storeName: string
│       ├── joltLocationId: string
│       ├── market: string
│       ├── district: string
│       ├── hasData: boolean
│       ├── alerts: Array<Alert>
│       ├── announcements: Array<Announcement>
│       ├── ltos: Array<LTO>
│       ├── events: Array<Event>
│       ├── closureDates: Array<string>
│       └── daypartSchedule: Array<Daypart>
│
└── users/
    └── {userId} (document)
        ├── email: string
        ├── name: string
        ├── role: "admin" | "operator" | "district" | "store" | "user"
        ├── assignedMarket: string | null
        ├── assignedDistrict: string | null
        └── assignedSite: string | null
```

### Data Inheritance Model

The system uses a cascading inheritance model for content:

```
Company Level (general)
    ↓ merges with
Operator/Market Level (markets/{marketName})
    ↓ merges with
District Level (districts/{districtName})
    ↓ merges with
Store Level (stores/{storeId})
    ↓ displays on
Dashboard (index.html?store=XXXX)
```

**Example:** If you set an alert at the Company level, ALL stores see it. If you set an alert at the District level, only stores in that district see it.

---

## Data Models

### Alert Object

```javascript
{
    text: string,                    // Alert message
    type: "normal" | "info" | "warning" | "custom",
    startDate?: string,              // YYYY-MM-DD (optional)
    endDate?: string,                // YYYY-MM-DD (optional)
    bgColor?: string,                // Hex color (only for custom type)
    textColor?: string               // Hex color (only for custom type)
}
```

**Alert Types:**
- `normal` - Green background (#028a0f)
- `info` - Blue background (#005cc8)
- `warning` - Red background (#b00000)
- `custom` - User-defined colors

### Announcement Object

```javascript
{
    text: string,                    // Announcement message
    startDate?: string,              // YYYY-MM-DD (optional)
    endDate?: string                 // YYYY-MM-DD (optional)
}
```

### LTO (Limited Time Offer) Object

```javascript
{
    text: string,                    // LTO name
    icon?: string,                   // Emoji character
    countdownDate?: string           // ISO datetime (YYYY-MM-DDTHH:mm)
}
```

**Available Icons:** 🍔 🍟 🥤 🍦 ☕ 🍩 🍪 🍰 🧁 🥪 🌮 🌯 🥗 🍕 🌭 🍳 🥞 🥓 🍗 🥩 🍤 🥟 🍣 🍜 🍝 🍞 🥐 🧀 🍎 🍌 🍓 🥑 🥦 🥕 🌽 🍯 🍫 🍬 🍭 🆕 🔥 ✨

### Event Object

```javascript
{
    text: string,                    // Event name
    startDate?: string,              // YYYY-MM-DD (optional)
    endDate?: string                 // YYYY-MM-DD (optional)
}
```

### Daypart Schedule Object

```javascript
{
    name: string,                    // Daypart name (e.g., "Breakfast")
    startTime: string,               // HH:mm (24-hour format)
    endTime: string,                 // HH:mm (24-hour format)
    color: string,                   // Hex color code
    textColor: string,               // Hex color code
    icon: string                     // Emoji character
}
```

**Important Time Note:** Use `23:59` for midnight, not `24:00` or `00:00`.

### User Object

```javascript
{
    email: string,
    name: string,
    role: "admin" | "operator" | "district" | "store" | "user",
    assignedMarket: string | null,     // Required for "operator" role
    assignedDistrict: string | null,   // Required for "district" role
    assignedSite: string | null        // Required for "store" role
}
```

**User Roles:**
- `admin` - Full access to all stores and admin panel
- `operator` - Can edit all stores in assigned market/operator
- `district` - Can edit all stores in assigned district
- `store` - Can edit only their specific store
- `user` - View-only access (unassigned)

---

## Firebase Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project named "Harmony" (or your choice)
3. Enable **Firestore Database**
4. Enable **Authentication** with Email/Password provider

### 2. Configure Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read company-level data
    match /company/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Markets, Districts, Stores - authenticated users can read
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

    // Users collection - admins can read/write, users can read their own profile
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

### 3. Get Firebase Config

1. In Firebase Console, go to Project Settings
2. Scroll to "Your apps" section
3. Click "Web" icon to add a web app
4. Copy the `firebaseConfig` object

**Update in portal.html** (lines 301-309):

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyCIBUjhkYDcSPMAiowao6NUCOdOb_V73m8",
    authDomain: "harmony9503.firebaseapp.com",
    projectId: "harmony9503",
    storageBucket: "harmony9503.firebasestorage.app",
    messagingSenderId: "244278361492",
    appId: "1:244278361492:web:a18a7a5a6351a26f9ea381",
    measurementId: "G-47T5G80056"
};
```

**Update in script.js** (lines 8-16) with the same config.

---

## Portal.html Features

### Authentication System

The portal uses Firebase Authentication with email/password:

**Login Flow:**
1. User enters email and password
2. Firebase validates credentials
3. System checks Firestore for user profile
4. If no profile exists, creates basic profile with `user` role
5. Redirects to content editor or admin panel based on role

**Auth State Management** (lines 350-395):
- Monitors authentication state changes
- Loads user profile from Firestore
- Shows/hides admin panel based on role
- Auto-redirects on logout

### Content Editor

The editor allows managing 5 content types across 4 hierarchy levels:

**Content Types:**
1. **Alerts** - Rotating banner messages with color coding
2. **Announcements** - Important company-wide messages
3. **LTOs** - Limited time offers with optional countdown timers
4. **Events** - Upcoming events this week
5. **Daypart Schedule** - Time-based operational phases

**Hierarchy Levels:**
1. **Company Level (General)** - Affects all stores
2. **Operator/Market Level** - Affects all stores in market
3. **District Level** - Affects all stores in district
4. **Store Level** - Affects only specific store

**Site Selection Logic** (lines 415-520):
- Admins see all levels and all stores
- Operators see their market + districts + stores within
- District managers see their district + stores within
- Store managers see only their assigned store

### Admin Panel

#### User Management Tab (lines 184-242)

**Create User:**
1. Enter name, email, temporary password
2. Select role (admin, operator, district, store, user)
3. Assign market/district/site based on role
4. System creates Firebase Auth account + Firestore profile

**Edit User:**
1. Click "Edit" button on user card
2. Modify role or assignments
3. Save updates to Firestore only (email cannot change)

**Reset Password:**
- For existing users, sends Firebase password reset email
- Temporary passwords only used during creation

**Secondary App Pattern** (lines 698-709):
- Uses secondary Firebase app instance to create users
- Prevents auto-login when creating new accounts
- Automatically signs out and deletes secondary app

#### Data Tools Tab (lines 244-279)

**Initial Setup Tools:**

1. **Upload general.json** - Sets company-wide defaults
   - Click "Upload" button
   - Reads JSON file
   - Writes to `company/general` document

2. **Upload store-XXXX.json** - Imports all store data
   - Select multiple JSON files
   - Extracts store ID from filename pattern `store-(\d+)\.json`
   - Creates/updates documents in `stores/` collection
   - Sets `hasData: true` flag

3. **Upload CSV** - Establishes organizational hierarchy
   - CSV Format: `SiteID, StoreName, Market, District`
   - Creates/updates store documents with market/district assignments
   - Enables filtering in site selector

**CSV Import Logic** (lines 747-774):
```javascript
// CSV Format Example:
// 8409,Wendy's Barker,Texas,Houston North
// 8412,Wendy's Main St,Texas,Houston South
```

---

## Dashboard System (index.html + script.js)

### URL Parameters

The dashboard requires a store parameter:

```
index.html?store=8409
```

**Error Handling:**
- Missing store parameter: Shows error in alert banner
- Store not in database: Shows "Store not found" error

### Data Fetching Logic (lines 57-176)

**Fetch Sequence:**
1. Get store document from Firestore
2. Extract market and district names
3. Parallel fetch: general, market, district documents
4. Merge data arrays (company → market → district → store)
5. Filter alerts by active date range
6. Render content to DOM

**Refresh Rate:**
- Main data: 30 seconds (`REFRESH_RATE = 30000`)
- Alert rotation: 5 seconds (`ALERT_ROTATION_RATE = 5000`)
- Daypart update: 1 minute

### Alert Rotation (lines 368-391)

Cycles through multiple alerts with fade effect:

```javascript
1. Fade out current alert (opacity: 0)
2. Wait 200ms
3. Update text and colors
4. Fade in new alert (opacity: 1)
5. Repeat every 5 seconds
```

### Daypart Calculation (lines 392-411)

Determines current operational phase:

```javascript
1. Get current time in minutes since midnight
2. Loop through daypart schedule
3. Check if current time falls within range
4. Update banner with name, icon, time range, and colors
5. Default to "PREP / OFF HOURS" if no match
```

### Closure Detection (lines 413-421)

Checks if store is closed today:

```javascript
1. Get current date (YYYY-MM-DD)
2. Check if date exists in closureDates array
3. If match: Show full-screen overlay, hide all content
4. If no match: Display normal dashboard
```

### Jolt Integration

**Checklist Fetching** (lines 179-251):

```javascript
// Fetches incomplete checklists within 31-day window
// Categorizes into:
// - Current & Late (displayTimestamp <= now)
// - Upcoming (displayTimestamp within 3 hours)

Query Variables:
- deadlineAfterTimestamp: now - 31 days
- deadlineBeforeTimestamp: now + 31 days
- completionStatus: "INCOMPLETE"
- isSublist: false
```

**Sensor Monitoring** (lines 268-340):

```javascript
// Fetches active temperature sensors
// Displays:
// - Name (cleaned from Jolt format)
// - Temperature reading (converted to Fahrenheit)
// - Signal strength
// - Battery level
// - Alert status (warning/critical)
```

---

## Step-by-Step Recreation Guide

### Phase 1: Firebase Setup

1. **Create Firebase Project**
   - Go to firebase.google.com/console
   - Click "Add project"
   - Name: "Harmony" (or your choice)
   - Disable Google Analytics (optional)

2. **Enable Firestore**
   - In Firebase Console, click "Firestore Database"
   - Click "Create database"
   - Start in **production mode**
   - Choose server location closest to users

3. **Enable Authentication**
   - Click "Authentication" in sidebar
   - Click "Get started"
   - Enable "Email/Password" sign-in method
   - Save changes

4. **Get Configuration**
   - Click gear icon → Project settings
   - Scroll to "Your apps"
   - Click web icon `</>`
   - Register app (name: "Harmony Portal")
   - Copy firebaseConfig object

5. **Set Security Rules**
   - Go to Firestore Database → Rules tab
   - Paste the security rules from section above
   - Publish rules

### Phase 2: Create Files

1. **Create portal.html**
   - Copy the complete portal.html content
   - Update firebaseConfig (lines 301-309) with your values
   - Save file

2. **Create index.html**
   - Copy the complete index.html content
   - Save file

3. **Create script.js**
   - Copy the complete script.js content
   - Update firebaseConfig (lines 8-16) with your values
   - Save file

4. **Create style.css**
   - Copy the complete style.css content
   - Save file

5. **Create general.json** (template)
```json
{
    "alerts": [],
    "closureDates": [],
    "announcements": [],
    "ltos": [],
    "events": [],
    "daypartSchedule": []
}
```

6. **Create store-XXXX.json** (template)
```json
{
    "storeName": "Wendy's Store 8409",
    "joltLocationId": "YOUR_JOLT_LOCATION_ID",
    "alerts": [],
    "daypartSchedule": [],
    "announcements": [],
    "ltos": [],
    "events": []
}
```

### Phase 3: Initial Admin Setup

1. **Create First Admin User**
   - Open Firebase Console → Authentication
   - Click "Add user" manually
   - Enter email and password
   - Copy the UID

2. **Create Admin Profile in Firestore**
   - Go to Firestore Database
   - Create collection: `users`
   - Create document with UID as document ID
   - Add fields:
     ```
     email: "admin@example.com"
     name: "System Admin"
     role: "admin"
     assignedMarket: null
     assignedDistrict: null
     assignedSite: null
     ```

3. **Test Admin Login**
   - Open portal.html in browser
   - Login with admin credentials
   - Verify admin panel is visible

### Phase 4: Data Migration

1. **Upload Company Data**
   - Login to portal.html as admin
   - Go to Admin → Data Tools tab
   - Upload general.json
   - Verify in Firestore: `company/general` document exists

2. **Upload Store Data**
   - Prepare store JSON files (store-8409.json, store-8412.json, etc.)
   - In Data Tools tab, upload all store JSON files
   - System extracts IDs and creates `stores/` documents
   - Verify `hasData: true` flag is set

3. **Upload Organizational Hierarchy**
   - Create CSV file:
     ```csv
     SiteID,StoreName,Market,District
     8409,Wendy's Barker,Texas,Houston North
     8412,Wendy's Main St,Texas,Houston South
     ```
   - Upload in Data Tools tab
   - Verify market/district fields populate in store documents

### Phase 5: User Creation

1. **Create Store Managers**
   - In portal.html, go to Admin → User Management
   - Click "Create User"
   - Fill in name, email, temporary password
   - Select role: "Store Manager"
   - Assign specific site
   - Click "Save User"

2. **Create District Managers**
   - Same process, select role: "District Manager"
   - Assign district

3. **Create Operators**
   - Same process, select role: "Operator"
   - Assign market

### Phase 6: Content Setup

1. **Set Company-Wide Content**
   - Login as admin
   - Select "Company Level (General)" in site selector
   - Add alerts, announcements, LTOs, events
   - Configure default daypart schedule
   - Click "Save Changes"

2. **Set Store-Specific Content**
   - Select specific store from dropdown
   - Add store-specific alerts/announcements
   - Override daypart schedule if needed
   - Save changes

3. **Test Dashboard**
   - Open index.html?store=8409 in browser
   - Verify content displays correctly
   - Check alert rotation
   - Verify daypart updates

### Phase 7: Jolt Integration (Optional)

If you have Jolt access:

1. **Get Jolt Location IDs**
   - Login to Jolt system
   - Navigate to locations
   - Copy base64 location IDs

2. **Update Store Documents**
   - In portal.html, go to Admin → Data Tools
   - Re-upload store JSON files with joltLocationId included
   - Or manually edit Firestore documents

3. **Configure Jolt Proxy**
   - Update JOLT_ENDPOINT in script.js (line 22)
   - Ensure CORS proxy is configured

4. **Test Sensors and Checklists**
   - Open dashboard
   - Verify sensor cards populate
   - Check checklist sections

---

## Firebase Costs & Optimization

### Free Tier Limits (Spark Plan)

- Firestore: 1 GB storage, 50k reads/day, 20k writes/day
- Authentication: Unlimited
- Hosting: 10 GB storage, 360 MB/day transfer

### Optimization Strategies

1. **Reduce Read Operations**
   - Current: 30-second refresh = 120 reads/hour per dashboard
   - For 10 dashboards: 28,800 reads/day
   - Solution: Increase REFRESH_RATE to 60000 (1 minute)

2. **Use Firestore Realtime Listeners** (Advanced)
   - Only charged for actual document changes
   - Eliminates polling overhead
   - Requires code modification

3. **Cache Static Content**
   - Store daypartSchedule locally after first fetch
   - Only refresh announcements/events

---

## Troubleshooting

### Portal Issues

**Problem:** "Permission denied" error when saving
- **Cause:** Security rules not configured
- **Solution:** Update Firestore rules as shown in Firebase Configuration section

**Problem:** User created but can't see sites
- **Cause:** Sites not assigned or hasData flag missing
- **Solution:** Upload store JSON files, verify hasData: true in Firestore

**Problem:** Admin panel not visible
- **Cause:** User role not set to "admin"
- **Solution:** Edit user document in Firestore, set role: "admin"

### Dashboard Issues

**Problem:** "Store not found in Database"
- **Cause:** Store document doesn't exist
- **Solution:** Upload store JSON via portal Data Tools

**Problem:** Alerts not rotating
- **Cause:** Only one active alert
- **Solution:** Add more alerts or check date ranges

**Problem:** Sensors not loading
- **Cause:** Missing joltLocationId or CORS issues
- **Solution:** Verify joltLocationId in store document, check browser console

**Problem:** Daypart stuck on "PREP / OFF HOURS"
- **Cause:** No daypart schedule defined
- **Solution:** Add daypartSchedule in portal editor

---

## Advanced Customization

### Adding New Content Types

To add a new content type (e.g., "Tasks"):

1. **Update Data Model**
   - Add `tasks: []` field to Firestore documents

2. **Add Editor UI in portal.html**
   ```html
   <div class="mb-4">
       <h4>Tasks</h4>
       <div id="tasks-container"></div>
       <button class="btn btn-sm btn-outline-success mt-2" onclick="addTask()">+ Add Task</button>
   </div>
   ```

3. **Add Render Function**
   ```javascript
   function renderTasks(items) {
       const container = document.getElementById('tasks-container');
       // Similar to renderAnnouncements
   }
   ```

4. **Update Save Logic**
   ```javascript
   const data = {
       // existing fields...
       tasks: Array.from(document.querySelectorAll('#tasks-container > div')).map(div => ({
           text: div.querySelector('.task-text').value
       }))
   };
   ```

5. **Add Display in index.html**
   ```html
   <div class="card">
       <h2>📋 Tasks</h2>
       <div class="list-container"><ul id="tasks-list"></ul></div>
   </div>
   ```

6. **Update script.js**
   ```javascript
   updateList('tasks-list', data.tasks);
   ```

### Custom Alert Colors

Already supported via "Custom" alert type:

1. In portal, create alert
2. Set type to "Custom"
3. Select background color (bgColor)
4. Select text color (textColor)

### Time Zone Handling

Current system uses local browser time. To add timezone support:

1. **Install moment-timezone library**
   ```html
   <script src="https://cdn.jsdelivr.net/npm/moment-timezone@latest/moment-timezone-with-data.min.js"></script>
   ```

2. **Update timeToMinutes function**
   ```javascript
   function timeToMinutes(timeStr) {
       const tz = 'America/Chicago'; // Store timezone
       const now = moment.tz(tz);
       const [hours, minutes] = timeStr.split(':').map(Number);
       return (hours * 60) + minutes;
   }
   ```

---

## Security Best Practices

1. **Never Commit Firebase Config**
   - Add firebase-config.js to .gitignore
   - Use environment variables for production

2. **Strengthen Security Rules**
   - Current rules allow any authenticated user to write
   - Recommended: Add role-based write restrictions

3. **Password Policy**
   - Enforce strong passwords in Firebase Console
   - Require password reset on first login

4. **Enable App Check** (Advanced)
   - Protects against abuse and unauthorized access
   - Requires additional setup in Firebase Console

5. **Monitor Usage**
   - Set up Firebase usage alerts
   - Monitor authentication logs for suspicious activity

---

## Maintenance Tasks

### Weekly

- Review active alerts and remove expired ones
- Update announcements for current week
- Check sensor battery levels

### Monthly

- Audit user list, remove inactive accounts
- Review Firestore usage in Firebase Console
- Backup important data (export Firestore collections)

### Quarterly

- Review and update security rules
- Update daypart schedules for seasonal changes
- Test disaster recovery process

---

## Support & Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Firestore Data Model Best Practices:** https://firebase.google.com/docs/firestore/data-model
- **Firebase Authentication:** https://firebase.google.com/docs/auth
- **Bootstrap 5 Docs:** https://getbootstrap.com/docs/5.3/

---

## Appendix: Complete Firebase Config Example

```javascript
// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyCIBUjhkYDcSPMAiowao6NUCOdOb_V73m8",
    authDomain: "harmony9503.firebaseapp.com",
    projectId: "harmony9503",
    storageBucket: "harmony9503.firebasestorage.app",
    messagingSenderId: "244278361492",
    appId: "1:244278361492:web:a18a7a5a6351a26f9ea381",
    measurementId: "G-47T5G80056"
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
```

---

## Appendix: Sample Data Files

### general.json - Company Level

```json
{
    "alerts": [
        {
            "text": "Welcome to Harmony Dashboard",
            "type": "normal"
        },
        {
            "text": "System Maintenance Tonight at 11 PM",
            "type": "warning",
            "startDate": "2026-01-25",
            "endDate": "2026-01-25"
        }
    ],
    "closureDates": [
        "2026-12-25",
        "2026-01-01"
    ],
    "announcements": [
        "Safety First - Report all incidents immediately",
        "New LTO launching next week"
    ],
    "ltos": [
        {
            "text": "Spicy Chicken Sandwich",
            "icon": "🔥",
            "countdownDate": "2026-02-01T06:00"
        }
    ],
    "events": [
        "Team Meeting - Friday 3 PM",
        "Inventory Count - Saturday"
    ],
    "daypartSchedule": [
        {
            "name": "Breakfast",
            "startTime": "06:00",
            "endTime": "10:30",
            "color": "#e6a800",
            "textColor": "#000000",
            "icon": "☕"
        },
        {
            "name": "Lunch",
            "startTime": "10:30",
            "endTime": "14:00",
            "color": "#b00000",
            "textColor": "#ffffff",
            "icon": "🍔"
        },
        {
            "name": "Dinner",
            "startTime": "17:00",
            "endTime": "21:00",
            "color": "#b00000",
            "textColor": "#ffffff",
            "icon": "🍽️"
        },
        {
            "name": "Late Night",
            "startTime": "21:00",
            "endTime": "23:59",
            "color": "#333333",
            "textColor": "#ffffff",
            "icon": "🌙"
        }
    ]
}
```

### store-8409.json - Store Level

```json
{
    "storeName": "Wendy's 8409 - Barker",
    "joltLocationId": "TG9jYXRpb246MDAwNTg3NWIyNjBkNGM2ZDNhMTkxOTQ3YWI5MGUyMTI=",
    "alerts": [
        {
            "text": "Store 8409 - Dashboard",
            "type": "info"
        }
    ],
    "announcements": [
        "Drive-thru times must stay under 3 minutes",
        "New crew member starting Monday - Please welcome them!"
    ],
    "ltos": [],
    "events": [
        "Health Inspection - Tuesday 10 AM"
    ],
    "daypartSchedule": [
        {
            "name": "Breakfast",
            "startTime": "06:30",
            "endTime": "10:30",
            "color": "#e6a800",
            "textColor": "#000000",
            "icon": "☕"
        },
        {
            "name": "Lunch Rush",
            "startTime": "10:30",
            "endTime": "14:00",
            "color": "#b00000",
            "textColor": "#ffffff",
            "icon": "🍔"
        },
        {
            "name": "Afternoon",
            "startTime": "14:00",
            "endTime": "17:00",
            "color": "#005cc8",
            "textColor": "#ffffff",
            "icon": "🍟"
        },
        {
            "name": "Dinner",
            "startTime": "17:00",
            "endTime": "20:00",
            "color": "#b00000",
            "textColor": "#ffffff",
            "icon": "🍽️"
        },
        {
            "name": "Late Night",
            "startTime": "20:00",
            "endTime": "23:59",
            "color": "#333333",
            "textColor": "#ffffff",
            "icon": "🌙"
        }
    ]
}
```

### hierarchy.csv - Organizational Structure

```csv
SiteID,StoreName,Market,District
8409,Wendy's Barker,Texas,Houston North
8412,Wendy's Main St,Texas,Houston North
8415,Wendy's Westheimer,Texas,Houston South
14205,Wendy's Downtown,Texas,Houston South
9001,Wendy's Airport,Texas,Dallas Central
9002,Wendy's Uptown,Texas,Dallas Central
```

---

## End of Documentation

This document provides complete instructions for recreating the Harmony portal system. For questions or issues, refer to the Troubleshooting section or Firebase documentation.

**Version:** 1.0
**Last Updated:** January 25, 2026
**Author:** System Documentation
