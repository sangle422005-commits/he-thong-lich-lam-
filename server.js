const express = require('express');
const path = require('path');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getAnalytics } = require('firebase/analytics');
const { getFirestore, doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

// Your Firebase web configuration
const firebaseConfig = {
  apiKey: "AIzaSyBf6TJtBGQ1CRI3VtCaLRdkencJxwq8SQw",
  authDomain: "sanglexd.firebaseapp.com",
  projectId: "sanglexd",
  storageBucket: "sanglexd.firebasestorage.app",
  messagingSenderId: "190582840708",
  appId: "1:190582840708:web:05f4e179bd94ce346351d1",
  measurementId: "G-2471QSQVZM"
};

// Initialize Firebase App
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (Browser environment check)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(firebaseApp);
}

// Initialize Cloud Firestore
const db = getFirestore(firebaseApp);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serves index.html from root folder

const defaultSuggestions = [
    { id: 1, text: 'Tập thể dục 30 phút', icon: 'fa-person-running', priority: 'high' },
    { id: 2, text: 'Uống đủ nước', icon: 'fa-glass-water', priority: 'medium' },
    { id: 3, text: 'Đọc tài liệu chuyên môn', icon: 'fa-book-open', priority: 'low' }
];

/* --- REST API ENDPOINTS --- */

// Login or auto-create account by Username
app.post('/api/login', async (req, res) => {
    const { username } = req.body;
    if (!username || !username.trim()) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const userRef = doc(db, "users", cleanUsername);

    try {
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // Return existing user data
            return res.json(userSnap.data());
        } else {
            // Register new user
            const newUser = {
                username: cleanUsername,
                tasks: [],
                suggestions: defaultSuggestions,
                theme: 'dark'
            };
            await setDoc(userRef, newUser);
            return res.json(newUser);
        }
    } catch (err) {
        console.error("Firestore Login Error:", err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get user data
app.get('/api/user/:username', async (req, res) => {
    const cleanUsername = req.params.username.trim().toLowerCase();
    const userRef = doc(db, "users", cleanUsername);

    try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(userSnap.data());
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Sync/Save user state
app.post('/api/sync', async (req, res) => {
    const { username, tasks, suggestions, theme } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const userRef = doc(db, "users", cleanUsername);

    try {
        await updateDoc(userRef, {
            tasks: tasks || [],
            suggestions: suggestions || [],
            theme: theme || 'dark',
            updatedAt: new Date().toISOString()
        });
        res.json({ success: true });
    } catch (err) {
        console.error("Firestore Sync Error:", err);
        res.status(500).json({ error: 'Failed to sync data' });
    }
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
