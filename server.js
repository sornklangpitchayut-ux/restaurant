const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // อนุญาตให้อุปกรณ์อื่นๆ (เช่น มือถือลูกค้า) เข้าถึงได้
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

app.use(express.json());

// เสิร์ฟไฟล์หน้าเว็บ (ถ้าคุณเอาไฟล์ html ไปใส่ในโฟลเดอร์ public)
app.use(express.static(path.join(__dirname, 'public')));

// สแตนด์บายรับการเชื่อมต่อจากลูกค้าและห้องครัว
io.on('connection', (socket) => {
    console.log('⚡ มีผู้ใช้งานเชื่อมต่อเข้ามา:', socket.id);

    // เมื่อมีออเดอร์ใหม่ส่งมาจากฝั่งลูกค้า
    socket.on('new_order', (orderData) => {
        console.log(`📦 ออเดอร์ใหม่จาก ${orderData.table}!`);
        // ส่งออเดอร์นั้นต่อไปให้หน้าจอฝั่งห้องครัวทันที
        io.emit('kitchen_receive', orderData);
    });

    socket.on('disconnect', () => {
        console.log('❌ ผู้ใช้งานตัดการเชื่อมต่อ');
    });
});

// เริ่มต้นเซิร์ฟเวอร์
server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🍲 ระบบชาบู มียู พร้อมใช้งานแล้ว!`);
    console.log(`🚀 เซิร์ฟเวอร์ทำงานที่: http://localhost:${PORT}`);
    console.log(`==================================================`);
});
