const express = require('express');
const path = require('path');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getAnalytics } = require('firebase/analytics');
const { getFirestore, doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');
const { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} = require('firebase/auth');

const app = express();
const PORT = process.env.PORT || 3000;

const firebaseConfig = {
  apiKey: "AIzaSyBf6TJtBGQ1CRI3VtCaLRdkencJxwq8SQw",
  authDomain: "sanglexd.firebaseapp.com",
  projectId: "sanglexd",
  storageBucket: "sanglexd.firebasestorage.app",
  messagingSenderId: "190582840708",
  appId: "1:190582840708:web:05f4e179bd94ce346351d1",
  measurementId: "G-2471QSQVZM"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(firebaseApp);
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const defaultSuggestions = [
    { id: 1, text: 'Tập thể dục 30 phút', icon: 'fa-person-running', priority: 'high' },
    { id: 2, text: 'Uống đủ nước', icon: 'fa-glass-water', priority: 'medium' },
    { id: 3, text: 'Đọc tài liệu chuyên môn', icon: 'fa-book-open', priority: 'low' }
];

function usernameToEmail(username) {
    return `${username.trim().toLowerCase()}@app.local`;
}

/* --- REST API ENDPOINTS --- */

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !username.trim() || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const authEmail = usernameToEmail(cleanUsername);

    try {
        await signInWithEmailAndPassword(auth, authEmail, password);
        const userRef = doc(db, "users", cleanUsername);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            return res.json({
                username: userData.username,
                tasks: userData.tasks || [],
                suggestions: userData.suggestions || defaultSuggestions,
                theme: userData.theme || 'dark'
            });
        } else {
            return res.status(404).json({ error: 'Dữ liệu tài khoản không tồn tại!' });
        }
    } catch (err) {
        console.error("Firebase Auth Login Error:", err.code);
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng!' });
        }
        res.status(500).json({ error: 'Đăng nhập thất bại. Vui lòng thử lại!' });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !username.trim() || !password || password.length < 6) {
        return res.status(400).json({ error: 'Tên người dùng và mật khẩu (tối thiểu 6 ký tự) là bắt buộc!' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const authEmail = usernameToEmail(cleanUsername);
    const userRef = doc(db, "users", cleanUsername);

    try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return res.status(400).json({ error: 'Tên người dùng này đã được sử dụng!' });
        }

        await createUserWithEmailAndPassword(auth, authEmail, password);

        const newUser = {
            username: cleanUsername,
            tasks: [],
            suggestions: defaultSuggestions,
            theme: 'dark',
            createdAt: new Date().toISOString()
        };

        await setDoc(userRef, newUser);

        return res.json({
            username: cleanUsername,
            tasks: [],
            suggestions: defaultSuggestions,
            theme: 'dark'
        });
    } catch (err) {
        console.error("Firebase Auth Register Error:", err.code);
        if (err.code === 'auth/email-already-in-use') {
            return res.status(400).json({ error: 'Tên người dùng đã tồn tại!' });
        }
        res.status(500).json({ error: 'Tạo tài khoản thất bại. Vui lòng thử lại!' });
    }
});

app.get('/api/user/:username', async (req, res) => {
    const cleanUsername = req.params.username.trim().toLowerCase();
    const userRef = doc(db, "users", cleanUsername);

    try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userData = userSnap.data();
        res.json({
            username: userData.username,
            tasks: userData.tasks || [],
            suggestions: userData.suggestions || defaultSuggestions,
            theme: userData.theme || 'dark'
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// --- API ĐỔI MẬT KHẨU ---
app.post('/api/change-password', (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    
    // Tìm kiếm người dùng trong hệ thống (biến users của bạn)
    const user = users.find(u => u.username === username);
    
    if (!user) {
        return res.status(404).json({ error: 'Không tìm thấy tài khoản!' });
    }
    
    // Kiểm tra mật khẩu cũ
    if (user.password !== oldPassword) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác!' });
    }
    
    // Cập nhật mật khẩu mới và lưu lại
    user.password = newPassword;
    
    // LƯU Ý: Đừng quên lưu mảng users vào file (nếu bạn có dùng fs.writeFileSync)
    // fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
