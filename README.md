# Injury-Free Days Tracker

A robust, standalone, and lightweight web application designed to track and display "Injury-Free Days" across fixed workstations. 

This application uses a pure mathematical approach (Current Calendar Date - Last Injury Date) rather than relying on unreliable background counters. It automatically adjusts for timezone shifts (India Standard Time - IST) and midnight rollovers without requiring page reloads.

---

## 🛠 Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** SQLite3 (Embedded, persistent, zero-configuration database)
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (Zero build steps, highly maintainable)
- **Security:** bcrypt (password hashing), JSON Web Tokens (secure stateless admin sessions)

---

## 🚀 Setup & Installation (All Operating Systems)

### 1. Prerequisites
You must have **Node.js (v18 or higher)** installed on your machine.
- **Windows / macOS:** Download and install from [Node.js Official Website](https://nodejs.org/).
- **Linux (Debian/Ubuntu):** `sudo apt update && sudo apt install nodejs npm`
- **Linux (RHEL/CentOS):** `sudo dnf install nodejs npm`

### 2. Clone the Repository
Open your terminal (Command Prompt/PowerShell on Windows, Terminal on Linux/macOS) and run:
```bash
git clone <repository_url>
cd injury_counter
```

### 3. Install Dependencies
Install all required Node packages:
```bash
npm install
```

### 4. Configure Environment Variables
Create a file named `.env` in the root of the project directory. Add the following lines:
```env
PORT=3000
JWT_SECRET=replace_this_with_a_very_long_random_secure_string
```
*Note: In production environments, ensure `JWT_SECRET` is kept absolutely secret. Do not commit your `.env` file to version control.*

### 5. Initialize the Database
Before running the application for the first time, you must initialize the SQLite database. This creates the tables, inserts the 9 stations (A-I), and sets up the default admin account.

Run the following command:
```bash
node init_db.js
```
*You should see output confirming that the database was initialized and the admin user was created. A `database.sqlite` file will securely appear in the folder.*

---

## 💻 Running the Application

### Local Development / Testing
To start the server, run:
```bash
node server.js
```
The application is now live! Open your web browser and navigate to:
- **Public Dashboard:** [http://localhost:3000](http://localhost:3000)

### Production Deployment
For production servers (Windows Server, Linux VM, etc.), it is highly recommended to use a process manager like **PM2** so the application stays alive after reboots or crashes.

**Install PM2 globally:**
```bash
npm install -g pm2
```

**Start the application:**
```bash
pm2 start server.js --name "injury-tracker"
```

**Ensure it starts on boot:**
```bash
pm2 save
pm2 startup
```

---

## 📁 Project Structure

```
/injury_counter
├── server.js          # Main Express HTTP API server
├── init_db.js         # Database schema creation and seeding script
├── database.sqlite    # The live embedded SQLite database (Generated)
├── .env               # Environment configuration (Create this)
├── .gitignore         # Excludes sensitive files from git
├── package.json       # Project dependencies config
├── README.md          # Technical installation guide
├── USER_MANUAL.md     # Detailed usage guide for administrators
└── public/            # Static Frontend Assets
    ├── index.html     # Main dashboard
    ├── station.html   # Individual station screen
    ├── admin.html     # Secured admin dashboard
    ├── admin-login.html # Admin authentication screen
    ├── css/
    │   └── style.css  # Application styling (Themes/Colors)
    └── js/
        ├── main.js    # Logic for main dashboard auto-refresh
        ├── station.js # Logic for individual station auto-refresh
        ├── admin.js   # API requests for logs, resets, and stats
        ├── auth.js    # JWT storage and injection handling
        ├── theme.js   # Light/Dark mode toggling logic
        └── utils.js   # Date calculations (IST parsing)
```

---

## 🔒 Security Notes
- The database securely hashes the admin password using `bcrypt` (10 salt rounds). It is impossible to recover the plaintext password from the database.
- The Admin dashboard issues a 12-hour stateless JWT stored in `localStorage`. 
- No secure APIs can be hit without providing a valid `Bearer Token`.
- See `USER_MANUAL.md` for instructions on how to immediately change the default admin password.
# Injury_tracker
