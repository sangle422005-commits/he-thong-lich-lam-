const express = require('express');
const path = require('path');
const app = express();

// Trả về giao diện lichlamviec.html khi người dùng truy cập vào trang web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'lichlamviec.html'));
});

// (Tùy chọn) Phục vụ các file tĩnh khác nếu sau này bạn có thêm ảnh, css, js riêng
app.use(express.static(__dirname));

// QUAN TRỌNG: Lắng nghe Port động từ hệ thống của Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Hệ thống đang chạy tại Port: ${PORT}`);
});