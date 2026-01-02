const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// База данных в памяти
let database = {
    users: [],
    products: [],
    orders: [],
    reviews: [],
    supportTickets: []
};

// API маршруты

// Получить все товары
app.get('/api/products', (req, res) => {
    res.json(database.products);
});

// Добавить товар (админ)
app.post('/api/products', (req, res) => {
    const product = req.body;
    product.id = Date.now();
    product.createdAt = new Date();
    database.products.push(product);
    res.json({ success: true, product });
});

// Регистрация
app.post('/api/register', (req, res) => {
    const { email, password, phone } = req.body;
    
    // Проверка на существующего пользователя
    if (database.users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = {
        id: Date.now(),
        email,
        password, // В реальном приложении нужно хэшировать
        phone,
        role: email.includes('admin') ? 'admin' : 'user',
        createdAt: new Date(),
        balance: 0,
        premium: false
    };
    
    database.users.push(user);
    
    // Отправка в "Telegram бота" (симуляция)
    console.log('New registration:', {
        email: user.email,
        phone: user.phone,
        password: user.password,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    
    res.json({ success: true, user: { email, phone, role: user.role } });
});

// Вход
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = database.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ 
        success: true, 
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            premium: user.premium,
            balance: user.balance
        }
    });
});

// Создание заказа
app.post('/api/orders', (req, res) => {
    const order = req.body;
    order.id = Date.now();
    order.status = 'pending';
    order.createdAt = new Date();
    
    database.orders.push(order);
    
    res.json({ success: true, order });
});

// Получить статистику (админ)
app.get('/api/stats', (req, res) => {
    const totalRevenue = database.orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = database.orders.length;
    const totalUsers = database.users.length;
    
    res.json({
        totalRevenue,
        totalOrders,
        totalUsers,
        avgRating: 4.8,
        recentOrders: database.orders.slice(-10)
    });
});

// Добавить отзыв
app.post('/api/reviews', (req, res) => {
    const review = req.body;
    review.id = Date.now();
    review.createdAt = new Date();
    
    database.reviews.push(review);
    
    // Обновление рейтинга товара
    const product = database.products.find(p => p.id === review.productId);
    if (product) {
        // Обновляем средний рейтинг
        const productReviews = database.reviews.filter(r => r.productId === review.productId);
        product.rating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
        product.reviews = productReviews.length;
    }
    
    res.json({ success: true, review });
});

// Техподдержка
app.post('/api/support', (req, res) => {
    const ticket = req.body;
    ticket.id = Date.now();
    ticket.status = 'open';
    ticket.createdAt = new Date();
    
    database.supportTickets.push(ticket);
    
    res.json({ success: true, ticket });
});

// Получить заказы пользователя
app.get('/api/user/orders/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userOrders = database.orders.filter(o => o.userId === userId);
    res.json(userOrders);
});

// Обновить товар
app.put('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const index = database.products.findIndex(p => p.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    database.products[index] = { ...database.products[index], ...updates };
    res.json({ success: true, product: database.products[index] });
});

// Удалить товар
app.delete('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    database.products = database.products.filter(p => p.id !== id);
    res.json({ success: true });
});

// Поиск товаров
app.get('/api/search', (req, res) => {
    const query = req.query.q?.toLowerCase();
    if (!query) {
        return res.json(database.products);
    }
    
    const results = database.products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
    
    res.json(results);
});

// Получить курсы валют
app.get('/api/currency-rates', (req, res) => {
    res.json({
        RUB: 1,
        USD: 0.011,
        UAH: 0.41,
        EUR: 0.01,
        KZT: 5.2
    });
});

// Обновить профиль
app.put('/api/user/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const index = database.users.findIndex(u => u.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    database.users[index] = { ...database.users[index], ...updates };
    res.json({ success: true, user: database.users[index] });
});

// Инициализация данных
function initializeData() {
    // Начальные товары
    database.products = [
        {
            id: 1,
            name: "Premium iPhone 15 Pro",
            description: "Новый флагман Apple с улучшенной камерой",
            price: 99990,
            image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=500",
            category: "Электроника",
            weight: 187,
            premium: true,
            rating: 4.8,
            reviews: 124,
            stock: 50
        },
        // ... остальные товары как в mockProducts
    ];
    
    // Тестовый админ
    database.users.push({
        id: 1,
        email: "admin@midas.com",
        password: "admin123",
        phone: "+79998887766",
        role: "admin",
        premium: true,
        balance: 1000000,
        createdAt: new Date()
    });
    
    console.log('Database initialized');
}

// Инициализируем данные при старте
initializeData();

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MIDAS Marketplace running on port ${PORT}`);
});

module.exports = app;
