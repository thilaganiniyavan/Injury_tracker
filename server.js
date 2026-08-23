const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only_please_change';

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication Middleware
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ error: 'Forbidden' });
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// --- PUBLIC API ENDPOINTS ---

// Get all stations
app.get('/api/stations', (req, res) => {
    db.all(`SELECT id, station_code, campaign_start_date, last_injury_date FROM stations ORDER BY id`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Get single station
app.get('/api/stations/:code', (req, res) => {
    db.get(`SELECT id, station_code, campaign_start_date, last_injury_date FROM stations WHERE station_code = ?`, [req.params.code], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Station not found' });
        res.json(row);
    });
});


// --- ADMIN API ENDPOINTS ---

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT id, username, password_hash FROM admin WHERE username = ?`, [username], async (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, row.password_hash);
        if (match) {
            const token = jwt.sign({ id: row.id, username: row.username }, JWT_SECRET, { expiresIn: '12h' });
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Admin Check Session
app.get('/api/admin/me', authenticateAdmin, (req, res) => {
    res.json({ username: req.user.username });
});

// Helper function to get current IST date (YYYY-MM-DD)
const getISTDate = () => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
};

// Update Station Dates (campaign_start_date & last_injury_date)
app.put('/api/admin/stations/:id', authenticateAdmin, (req, res) => {
    const stationId = req.params.id;
    const { campaign_start_date, last_injury_date } = req.body;
    const todayIST = getISTDate();

    if (!campaign_start_date || !last_injury_date) {
        return res.status(400).json({ error: 'Both campaign start date and last injury date are required' });
    }

    db.get(`SELECT last_injury_date FROM stations WHERE id = ?`, [stationId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Station not found' });

        const previousDate = row.last_injury_date;
        const dateChanged = previousDate !== last_injury_date;

        db.serialize(() => {
            db.run(`BEGIN TRANSACTION`);

            db.run(
                `UPDATE stations SET campaign_start_date = ?, last_injury_date = ? WHERE id = ?`,
                [campaign_start_date, last_injury_date, stationId],
                function(err) {
                    if (err) {
                        db.run(`ROLLBACK`);
                        return res.status(500).json({ error: 'Failed to update station dates' });
                    }

                    if (dateChanged) {
                        db.run(
                            `INSERT INTO resets (station_id, previous_last_injury_date, new_last_injury_date, reset_date) VALUES (?, ?, ?, ?)`,
                            [stationId, previousDate, last_injury_date, todayIST],
                            function(err) {
                                if (err) {
                                    db.run(`ROLLBACK`);
                                    return res.status(500).json({ error: 'Failed to record log' });
                                }
                                db.run(`COMMIT`);
                                res.json({ success: true, campaign_start_date, last_injury_date });
                            }
                        );
                    } else {
                        db.run(`COMMIT`);
                        res.json({ success: true, campaign_start_date, last_injury_date });
                    }
                }
            );
        });
    });
});

// Reset Station
app.post('/api/admin/stations/:id/reset', authenticateAdmin, (req, res) => {
    const stationId = req.params.id;
    const todayIST = getISTDate();

    db.get(`SELECT last_injury_date FROM stations WHERE id = ?`, [stationId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Station not found' });

        const previousDate = row.last_injury_date;

        db.serialize(() => {
            db.run(`BEGIN TRANSACTION`);

            db.run(`UPDATE stations SET last_injury_date = ? WHERE id = ?`, [todayIST, stationId], function(err) {
                if (err) {
                    db.run(`ROLLBACK`);
                    return res.status(500).json({ error: 'Update failed' });
                }
            });

            db.run(`INSERT INTO resets (station_id, previous_last_injury_date, new_last_injury_date, reset_date) VALUES (?, ?, ?, ?)`, 
                [stationId, previousDate, todayIST, todayIST], function(err) {
                if (err) {
                    db.run(`ROLLBACK`);
                    return res.status(500).json({ error: 'History update failed' });
                }
                db.run(`COMMIT`);
                res.json({ success: true, last_injury_date: todayIST });
            });
        });
    });
});

// Change Password
app.post('/api/admin/change-password', authenticateAdmin, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    db.get(`SELECT password_hash FROM admin WHERE id = ?`, [req.user.id], async (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'User not found' });

        const match = await bcrypt.compare(currentPassword, row.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        const saltRounds = 10;
        const newHash = await bcrypt.hash(newPassword, saltRounds);

        db.run(`UPDATE admin SET password_hash = ? WHERE id = ?`, [newHash, req.user.id], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to update password' });
            res.json({ success: true });
        });
    });
});

// Get Paginated Logs
app.get('/api/admin/logs', authenticateAdmin, (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) AS total FROM resets`;
    const dataQuery = `
        SELECT resets.id, stations.station_code, resets.previous_last_injury_date, resets.new_last_injury_date, resets.reset_timestamp 
        FROM resets 
        JOIN stations ON resets.station_id = stations.id 
        ORDER BY resets.reset_timestamp DESC 
        LIMIT ? OFFSET ?
    `;

    db.get(countQuery, [], (err, countRow) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const total = countRow ? countRow.total : 0;
        const totalPages = Math.ceil(total / limit) || 1;

        db.all(dataQuery, [limit, offset], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({
                logs: rows,
                total,
                page,
                totalPages,
                limit
            });
        });
    });
});

// Catch-all to serve index.html for unknown routes (for SPA-like behavior if needed, but we will use separate HTML files)
app.get('/station/:code', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'station.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
