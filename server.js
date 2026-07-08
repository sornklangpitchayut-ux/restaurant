const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
app.use(express.json());

// รายการอาหารเริ่มต้นในระบบ
const menuItems = [
    { id: 1, name: "เนื้อวัวสไลด์ (Beef)", price: 89 },
    { id: 2, name: "หมูสามชั้นสไลด์ (Pork Belly)", price: 69 },
    { id: 3, name: "สันคอหมูสไลด์ (Pork Shoulder)", price: 69 },
    { id: 4, name: "กุ้งสด (Shrimp)", price: 79 },
    { id: 5, name: "ปลาหมึกสด (Squid)", price: 59 },
    { id: 6, name: "ชุดผักรวม (Veggies)", price: 49 },
    { id: 7, name: "ลูกชิ้นปลา (Fish Balls)", price: 39 },
    { id: 8, name: "บะหมี่หยก (Noodles)", price: 20 }
];

// 1. ฟังก์ชันสร้างหน้าเว็บสำหรับแต่ละโต๊ะแบบ Dynamic (ไม่ต้องพึ่งไฟล์ HTML แยก)
function getTableHTML(tableNum) {
    return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ชาบู มียู - โต๊ะ ${tableNum}</title>
        <style>
            :root { --primary: #e74c3c; --secondary: #c0392b; --bg: #f8f9fa; --card: #ffffff; --text: #2c3e50; }
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 10px; }
            h1 { color: var(--primary); font-size: 1.4rem; text-align: center; margin: 10px 0 5px; }
            .table-banner { text-align: center; font-size: 1.1rem; font-weight: bold; color: #fff; background: var(--secondary); padding: 6px; border-radius: 4px; margin-bottom: 15px; }
            .container { display: flex; flex-direction: column; gap: 15px; max-width: 500px; margin: 0 auto; }
            .menu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
            .menu-item { background: var(--card); border-radius: 6px; padding: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #eee; display: flex; flex-direction: column; justify-content: space-between; }
            .item-name { font-size: 0.85rem; font-weight: bold; margin-bottom: 4px; }
            .item-price { color: var(--secondary); font-weight: bold; margin-bottom: 8px; font-size: 0.85rem; }
            .btn { background: var(--primary); color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; font-size: 0.85rem; }
            .cart-section { background: var(--card); padding: 12px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .cart-list { list-style: none; padding: 0; margin: 0 0 12px 0; }
            .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 0.85rem; }
            .quantity-controls { display: flex; align-items: center; gap: 4px; }
            .btn-sm { padding: 4px 8px; font-size: 0.85rem; background: #e2e8f0; color: #333; border-radius: 3px; border: none; font-weight: bold; }
            .btn-delete { background: #fee2e2; color: #ef4444; }
            .total-section { border-top: 1px solid #eee; padding-top: 8px; font-size: 0.95rem; font-weight: bold; margin-bottom: 12px; }
            .total-row { display: flex; justify-content: space-between; margin-top: 4px; }
            .btn-send { background: #2ecc71; font-size: 1rem; padding: 10px; }
        </style>
        <script src="/socket.io/socket.io.js"><\/script>
    </head>
    <body>
        <h1>♨️ เมนูชาบูบุฟเฟ่ต์</h1>
        <div class="container">
            <div class="table-banner">คุณกำลังสั่งอาหารสำหรับ: โต๊ะ ${tableNum}</div>
            <div class="menu-section"><div class="menu-grid" id="menu-grid"></div></div>
            <div class="cart-section">
                <h3>รายการที่เลือก (Your Order)</h3>
                <ul class="cart-list" id="cart-list"></ul>
                <div class="total-section">
                    <div class="total-row"><span>หมายเลขโต๊ะ:</span><span style="color:var(--primary);">โต๊ะ ${tableNum}</span></div>
                    <div class="total-row"><span>รวมทั้งหมด:</span><span id="total-price">0 บาท</span></div>
                </div>
                <button class="btn btn-send" onclick="sendOrder()">ส่งรายการอาหาร 🚀</button>
            </div>
        </div>
        <script>
            const socket = io();
            const CURRENT_TABLE = "โต๊ะ ${tableNum}";
            const menuItems = ${JSON.stringify(menuItems)};
            let cart = {};

            function displayMenu() {
                document.getElementById('menu-grid').innerHTML = menuItems.map(item => \`
                    <div class="menu-item">
                        <div class="item-name">\${item.name}</div>
                        <div class="item-price">\${item.price} บ.</div>
                        <button class="btn" onclick="addToCart(\${item.id})">เพิ่ม ➕</button>
                    </div>
                \`).join('');
            }
            function addToCart(id) {
                if (cart[id]) { cart[id].quantity += 1; } 
                else { cart[id] = { ...menuItems.find(p => p.id === id), quantity: 1 }; }
                updateCartUI();
            }
            function changeQuantity(id, delta) {
                if (!cart[id]) return;
                cart[id].quantity += delta;
                if (cart[id].quantity <= 0) delete cart[id];
                updateCartUI();
            }
            function deleteItem(id) { delete cart[id]; updateCartUI(); }
            function updateCartUI() {
                const cartList = document.getElementById('cart-list');
                cartList.innerHTML = ''; let total = 0;
                Object.values(cart).forEach(item => {
                    total += item.price * item.quantity;
                    const li = document.createElement('li');
                    li.className = 'cart-item';
                    li.innerHTML = \`
                        <div><strong>\${item.name}</strong><br><small style="color:#7f8c8d;">\${item.price} บ. x \${item.quantity}</small></div>
                        <div class="quantity-controls">
                            <button class="btn btn-sm" onclick="changeQuantity(\${item.id}, -1)">-</button>
                            <span>\${item.quantity}</span>
                            <button class="btn btn-sm" onclick="changeQuantity(\${item.id}, 1)">+</button>
                            <button class="btn btn-sm btn-delete" onclick="deleteItem(\${item.id})">🗑️</button>
                        </div>\`;
                    cartList.appendChild(li);
                });
                document.getElementById('total-price').innerText = \`\${total} บาท\`;
            }
            function sendOrder() {
                const items = Object.values(cart);
                if (items.length === 0) { alert("กรุณาเลือกอาหารก่อนครับ!"); return; }
                const order = { id: Date.now(), table: CURRENT_TABLE, foods: items, time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) };
                
                // ส่งผ่านเซิร์ฟเวอร์แบบ Real-time
                socket.emit('new_order', order);
                alert("ส่งออเดอร์เข้าครัวเรียบร้อย! 🎉");
                cart = {}; updateCartUI();
            }
            displayMenu(); updateCartUI();
        <\/script>
    </body>
    </html>`;
}

// 2. หน้าเว็บสำหรับห้องครัว (Kitchen.html) แบบ built-in ในโค้ด
const kitchenHTML = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ระบบรับออเดอร์ห้องครัว</title>
    <style>
        :root { --primary-color: #2c3e50; --accent-color: #e67e22; --bg-color: #ecf0f1; --card-bg: #ffffff; }
        body { font-family: sans-serif; background-color: var(--bg-color); margin: 0; padding: 20px; }
        h1 { text-align: center; color: var(--primary-color); }
        .orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto; }
        .order-card { background: var(--card-bg); border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-top: 5px solid var(--accent-color); padding: 15px; display: flex; flex-direction: column; justify-content: space-between; }
        .order-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #eee; padding-bottom: 10px; margin-bottom: 10px; }
        .table-num { font-size: 1.4rem; font-weight: bold; color: #c0392b; }
        .food-list { list-style: none; padding: 0; margin: 0 0 15px 0; flex-grow: 1; }
        .food-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f1f1f1; }
        .food-qty { font-weight: bold; color: #2e7d32; font-size: 1.1rem; }
        .btn-complete { background-color: #2ecc71; color: white; border: none; padding: 10px; border-radius: 5px; font-weight: bold; cursor: pointer; width: 100%; }
    </style>
    <script src="/socket.io/socket.io.js"><\/script>
</head>
<body>
    <h1>👨‍🍳 รายการส่งอาหารเข้าครัว (Live Tracker)</h1>
    <div class="orders-grid" id="orders-container"></div>
    <script>
        const socket = io();
        let localOrders = [];

        function renderOrders() {
            const container = document.getElementById('orders-container');
            if (localOrders.length === 0) {
                container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#7f8c8d; padding:40px;">📭 ไม่มีออเดอร์ค้างในระบบ...</div>';
                return;
            }
            container.innerHTML = localOrders.map(order => \`
                <div class="order-card">
                    <div>
                        <div class="order-header">
                            <span class="table-num">📍 \${order.table}</span>
                            <span style="color:#7f8c8d;">🕒 \${order.time} น.</span>
                        </div>
                        <ul class="food-list">
                            \${order.foods.map(food => \`<li class="food-item"><span>\${food.name}</span><span class="food-qty">x \${food.quantity}</span></li>\`).join('')}
                        </ul>
                    </div>
                    <button class="btn-complete" onclick="completeOrder(\${order.id})">เสิร์ฟแล้ว / เคลียร์ออเดอร์ ✅</button>
                </div>\`).join('');
        }

        function completeOrder(orderId) {
            localOrders = localOrders.filter(o => o.id !== orderId);
            renderOrders();
        }

        socket.on('kitchen_receive', (orderData) => {
            localOrders.push(orderData);
            renderOrders();
        });

        renderOrders();
    <\/script>
</body>
</html>`;

// --- การจัดการเส้นทาง (Routing) ---

// หน้าแรกสุด ให้เข้าหน้าของโต๊ะ 1
app.get('/', (req, res) => res.send(getTableHTML(1)));

// หน้าครัวเจาะจง
app.get('/Kitchen.html', (req, res) => res.send(kitchenHTML));
app.get('/Kitchen', (req, res) => res.send(kitchenHTML));

// หน้าโต๊ะแบบ Dynamic (รองรับ /table1.html ถึง /table10.html)
app.get('/table:num.html', (req, res) => res.send(getTableHTML(req.params.num)));
app.get('/table:num', (req, res) => res.send(getTableHTML(req.params.num)));

// ระบบเชื่อมต่อแบบ Real-time ของ Socket.io
io.on('connection', (socket) => {
    console.log('⚡ มีผู้ใช้งานเชื่อมต่อเข้ามา:', socket.id);
    socket.on('new_order', (orderData) => {
        io.emit('kitchen_receive', orderData);
    });
});

server.listen(PORT, () => {
    console.log(`🍲 เซิร์ฟเวอร์ชาบูพร้อมทำงานที่พอร์ต: ${PORT}`);
});
