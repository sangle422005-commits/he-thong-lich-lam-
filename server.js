const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize SQLite Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                tasks TEXT DEFAULT '[]',
                suggestions TEXT DEFAULT '[]',
                theme TEXT DEFAULT 'dark',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
});

// Default suggestions template for new users
const defaultSuggestions = [
    { id: 1, text: 'Tập thể dục 30 phút', icon: 'fa-person-running', priority: 'high' },
    { id: 2, text: 'Uống đủ nước', icon: 'fa-glass-water', priority: 'medium' },
    { id: 3, text: 'Đọc tài liệu chuyên môn', icon: 'fa-book-open', priority: 'low' }
];

/* --- REST API ENDPOINTS --- */

// Login or auto-create account by Username
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    if (!username || !username.trim()) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.trim().toLowerCase();

    db.get('SELECT * FROM users WHERE username = ?', [cleanUsername], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (row) {
            // Existing user
            return res.json({
                username: row.username,
                tasks: JSON.parse(row.tasks),
                suggestions: JSON.parse(row.suggestions),
                theme: row.theme
            });
        } else {
            // New user registration
            const defaultTasks = [];
            const defaultTheme = 'dark';
            const jsonSuggestions = JSON.stringify(defaultSuggestions);
            const jsonTasks = JSON.stringify(defaultTasks);

            db.run(
                'INSERT INTO users (username, tasks, suggestions, theme) VALUES (?, ?, ?, ?)',
                [cleanUsername, jsonTasks, jsonSuggestions, defaultTheme],
                (insertErr) => {
                    if (insertErr) {
                        return res.status(500).json({ error: 'Failed to create user' });
                    }
                    res.json({
                        username: cleanUsername,
                        tasks: defaultTasks,
                        suggestions: defaultSuggestions,
                        theme: defaultTheme
                    });
                }
            );
        }
    });
});

// Get user data
app.get('/api/user/:username', (req, res) => {
    const cleanUsername = req.params.username.trim().toLowerCase();

    db.get('SELECT * FROM users WHERE username = ?', [cleanUsername], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            username: row.username,
            tasks: JSON.parse(row.tasks),
            suggestions: JSON.parse(row.suggestions),
            theme: row.theme
        });
    });
});

// Sync/Save user state (Tasks, Suggestions, Theme)
app.post('/api/sync', (req, res) => {
    const { username, tasks, suggestions, theme } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const jsonTasks = JSON.stringify(tasks || []);
    const jsonSuggestions = JSON.stringify(suggestions || []);

    db.run(
        `UPDATE users SET tasks = ?, suggestions = ?, theme = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?`,
        [jsonTasks, jsonSuggestions, theme || 'dark', cleanUsername],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to sync data' });
            }
            res.json({ success: true });
        }
    );
});

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
