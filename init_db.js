const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initialStations = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const initialDate = '2026-06-18';
const defaultAdminUser = 'admin';
const defaultAdminPass = 'admin123'; // The admin will be required to change this later if needed.

db.serialize(async () => {
    // Create Stations Table
    db.run(`CREATE TABLE IF NOT EXISTS stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_code TEXT UNIQUE NOT NULL,
        last_injury_date TEXT NOT NULL
    )`);

    // Create Admin Table
    db.run(`CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )`);

    // Create Resets History Table
    db.run(`CREATE TABLE IF NOT EXISTS resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_id INTEGER,
        previous_last_injury_date TEXT,
        new_last_injury_date TEXT,
        reset_date TEXT,
        reset_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(station_id) REFERENCES stations(id)
    )`);

    // Seed Stations
    const insertStation = db.prepare(`INSERT OR IGNORE INTO stations (station_code, last_injury_date) VALUES (?, ?)`);
    initialStations.forEach(code => {
        insertStation.run(code, initialDate);
    });
    insertStation.finalize();

    // Seed Admin
    const saltRounds = 10;
    const hash = await bcrypt.hash(defaultAdminPass, saltRounds);
    
    db.get(`SELECT id FROM admin WHERE username = ?`, [defaultAdminUser], (err, row) => {
        if (!row) {
            db.run(`INSERT INTO admin (username, password_hash) VALUES (?, ?)`, [defaultAdminUser, hash], (err) => {
                if (err) console.error(err);
                else console.log('Admin user created successfully.');
            });
        } else {
            console.log('Admin user already exists.');
        }
    });

    console.log('Database initialized successfully.');
});
