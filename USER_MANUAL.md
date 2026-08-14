# User Manual: Injury-Free Days Tracker

Welcome to the User Manual for the Injury-Free Days Tracking application. This document is designed for system users and administrators to understand how to interact with the dashboards, manage station data, and utilize the themes.

---

## 1. Public Viewing (The Dashboards)

The application has two types of public, read-only displays. Anyone with access to the internal network can view these screens without needing a password. Both dashboards automatically recalculate dates at exactly midnight (India Standard Time - IST) without requiring you to manually refresh your browser.

### A. The Main Dashboard (`/`)
If you navigate to the base URL of the application (e.g., `http://localhost:3000`), you will see the **Main Dashboard**.
- Displays all 9 stations simultaneously in a neatly organized 2-row grid.
- Shows the current "Injury-Free Days" calculated for each station.
- You can click on any specific station tile to open its individual page.

### B. Individual Station Displays (`/station/A`, `/station/B`, etc.)
If you navigate to a specific station's URL or click a tile from the main dashboard, you are taken to a dedicated full-screen display.
- Specifically designed for TVs or large monitors stationed around the facility.
- Features a massive, easy-to-read counter.
- Shows the actual "Last Injury Date" near the bottom for absolute clarity.

### C. Light & Dark Themes
The application supports a beautiful, corporate-style **Light Mode** and a deep, premium **Dark Mode**.
- Click the **"🌓 Theme"** button (or the **☀️/🌙** icon) located in the top-right corner of the screen.
- Your choice is automatically saved to your browser. If you set a display monitor to Dark Mode, it will remember that preference forever, even if the server restarts.

---

## 2. Administrator Access

Administrators have the exclusive ability to reset a station's injury date back to 0. 

### Logging In
1. Navigate to the hidden admin portal URL: `http://localhost:3000/admin-login`
2. Enter your credentials.
   - **Default Username:** `admin`
   - **Default Password:** `admin123`
3. Click "Login". Upon success, you will be securely redirected to the Admin Dashboard.

> **CRITICAL SECURITY WARNING:** You must immediately change the default password upon your first login.

---

## 3. Managing Stations (Admin Dashboard)

Once logged into the Admin Dashboard (`/admin`), you have access to the control panel.

### Changing Your Password
1. Click the blue **"Change Password"** button at the top right of the Admin Dashboard.
2. Enter your current password.
3. Enter a new, highly secure password (minimum 6 characters).
4. Click **"Save Password"**. 
*Note: Your new password is instantly hashed and securely stored. There is no way to recover a forgotten password through the UI, so keep it safe!*

### Resetting a Station's Injury Date
When an incident occurs at a specific station, you need to "reset" it so the counter goes back to 0. You do NOT manually enter dates. 

1. Locate the specific station in the "Station" table.
2. Click the red **"Reset to Today"** button in the Action column.
3. A confirmation window will appear, asking you to verify the reset action. It will explicitly tell you the current date (IST) that will be applied.
4. Click **"Confirm Reset"**.
5. The station's "Last Injury Date" will instantly update to today's date, and its Injury-Free Days will drop to `0`. All public dashboards viewing that station will update on their next automated sync cycle (within 10 minutes).

### Viewing Reset Logs
At the bottom of the Admin Dashboard is the **Reset Logs** table. This is an uneditable history ledger.
- Every single time a station is reset, the system logs the exact Date and Time.
- It displays the "Previous Date" alongside the "New Date".
- This ensures full transparency and allows you to audit exactly when a station's counter was reset.

---

## 4. Frequently Asked Questions

**Q: Do I need to manually add 1 to the counters every day?**
**A:** No. The system stores the calendar date of the last injury. The frontend simply subtracts that date from today's date (in IST). The days increment perfectly on their own forever.

**Q: What happens if the server goes offline for a weekend?**
**A:** Because there is no daily counter script running, server downtime doesn't affect the data. When the server turns back on, the frontend simply calculates `Today - Last Injury Date` and displays the correct, updated number instantly.

**Q: How do I add a new station (e.g., Station J)?**
**A:** The application is currently hard-coded to support the fixed 9 stations per the initial technical requirements. To add more stations, an administrator must utilize the `database.sqlite` file manually or a database GUI to insert a new row into the `stations` table. The frontend will automatically detect and display the new station.

**Q: How do I logout?**
**A:** Click the red "Logout" button at the top right of the Admin Dashboard. This instantly destroys your secure session token.
