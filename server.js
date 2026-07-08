const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// ใช้พอร์ตที่ Render กำหนดให้ หรือใช้ 3000 เป็นค่าเริ่มต้นสำหรับรันในเครื่อง (Local)
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 1. ตรวจสอบให้มั่นใจว่าโฟลเดอร์ชื่อ 'public' อยู่ระดับเดียวกับ server.js 
app.use(express.static(path.join(__dirname, 'public')));

// 2. เพิ่ม Route สำหรับหน้าจอห้องครัวโดยเจาะจง (แก้ปัญหา Cannot GET /Kitchen.html)
app.get('/Kitchen.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Kitchen.html'));
});

// 3. เพิ่ม Route สำหรับหน้าโต๊ะอาหารต่างๆ (เลือกทำแบบ Dynamic รองรับ table1.html ถึง table10.html)
app.get('/table:num.html', (req, res) => {
    const tableNum = req.params.num;
    res.sendFile(path.join(__dirname, 'public', `table${tableNum}.html`));
});

// 4. หน้าแรกสุด (http://localhost:3000/) เผื่อกรณีเข้าลิงก์หลัก ให้ส่งหน้าโต๊ะ 1 หรือหน้าต้อนรับไปก่อน
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'table1.html'));
});

// ระบบ Socket.io สำหรับสื่อสารแบบ Real-time
io.on('connection', (socket) => {
    console.log('⚡ มีผู้ใช้งานเชื่อมต่อเข้ามา:', socket.id);

    socket.on('new_order', (orderData) => {
        console.log(`📦 ออเดอร์ใหม่จาก ${orderData.table}!`);
        io.emit('kitchen_receive', orderData);
    });

    socket.on('disconnect', () => {
        console.log('❌ ผู้ใช้งานตัดการเชื่อมต่อ');
    });
});

// เริ่มต้นเซิร์ฟเวอร์
server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🍲 ระบบชาบู มียู บน Render พร้อมใช้งานแล้ว!`);
    console.log(`🚀 เซิร์ฟเวอร์ทำงานที่พอร์ต: ${PORT}`);
    console.log(`==================================================`);
});
