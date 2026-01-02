// Глобальные переменные
let currentUser = null;
let currentCurrency = 'RUB';
let exchangeRates = {
    'RUB': 1,
    'USD': 0.011,
    'UAH': 0.41
};
let cart = [];
let products = [];
let orders = [];
let isAdmin = false;

// База данных в памяти
const mockProducts = [
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
        reviews: 124
    },
    {
        id: 2,
        name: "Золотой слиток 1г",
        description: "Инвестиционный золотой слиток высшей пробы",
        price: 6500,
        image: "https://images.unsplash.com/photo-1581235720854-1e3d16e0a3e3?auto=format&fit=crop&w=500",
        category: "Premium",
        weight: 1,
        premium: true,
        rating: 4.9,
        reviews: 89
    },
    {
        id: 3,
        name: "Беспроводные наушники Pro",
        description: "Шумоподавление, 30 часов работы",
        price: 14990,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500",
        category: "Электроника",
        weight: 250,
        premium: false,
        rating: 4.6,
        reviews: 312
    },
    {
        id: 4,
        name: "Эксклюзивные часы",
        description: "Ручная работа, ограниченная серия",
        price: 245000,
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=500",
        category: "Premium",
        weight: 120,
        premium: true,
        rating: 4.9,
        reviews: 45
    },
    {
        id: 5,
        name: "Игровая консоль",
        description: "Новейшая консоль с VR поддержкой",
        price: 45990,
        image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=500",
        category: "Электроника",
        weight: 4500,
        premium: false,
        rating: 4.7,
        reviews: 567
    },
    {
        id: 6,
        name: "Дизайнерская сумка",
        description: "Кожаная сумка ручной работы",
        price: 78900,
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500",
        category: "Одежда",
        weight: 800,
        premium: true,
        rating: 4.8,
        reviews: 78
    },
    {
        id: 7,
        name: "Премиум кофе",
        description: "Эксклюзивные зерна из Эфиопии",
        price: 2490,
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500",
        category: "Продукты",
        weight: 500,
        premium: false,
        rating: 4.5,
        reviews: 234
    },
    {
        id: 8,
        name: "Умный браслет",
        description: "Мониторинг здоровья, уведомления",
        price: 7990,
        image: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=500",
        category: "Электроника",
        weight: 45,
        premium: false,
        rating: 4.4,
        reviews: 189
    }
];

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    products = mockProducts;
    
    // Показать выбор города при первом заходе
    if (!localStorage.getItem('citySelected')) {
        showModal('cityModal');
    } else {
        const city = localStorage.getItem('city');
        const country = localStorage.getItem('country');
        updateCityDisplay(city, country);
        updateCurrency(country);
    }
    
    // Инициализация компонентов
    initEventListeners();
    renderProducts();
    updateCartCount();
    
    // Проверка авторизации
    checkAuth();
});

// Модальные окна
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

// Выбор города
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('city-btn')) {
        const city = e.target.dataset.city;
        const country = e.target.dataset.country;
        
        localStorage.setItem('citySelected', 'true');
        localStorage.setItem('city', city);
        localStorage.setItem('country', country);
        
        updateCityDisplay(city, country);
        updateCurrency(country);
        hideModal('cityModal');
        showNotification(`Город изменен на ${city}`, 'success');
    }
    
    // Закрытие модальных окон
    if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
        closeAllModals();
    }
    
    // Табы в модальных окнах
    if (e.target.classList.contains('tab-btn')) {
        const tab = e.target.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`${tab}Form`).classList.add('active');
    }
    
    // Табы в админке
    if (e.target.classList.contains('admin-tab')) {
        const tab = e.target.dataset.tab;
        document.querySelectorAll('.admin-tab').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab}Tab`).classList.add('active');
    }
});

// Обновление отображения города
function updateCityDisplay(city, country) {
    document.getElementById('currentCity').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${city}`;
    
    // Обновление валюты
    let currencySymbol = '₽';
    if (country === 'США') currencySymbol = '$';
    if (country === 'Украина') currencySymbol = '₴';
    
    document.getElementById('currencyText').textContent = currencySymbol;
}

// Обновление валюты
function updateCurrency(country) {
    switch(country) {
        case 'РФ': currentCurrency = 'RUB'; break;
        case 'США': currentCurrency = 'USD'; break;
        case 'Украина': currentCurrency = 'UAH'; break;
    }
    renderProducts(); // Перерендерим товары с новой валютой
}

// Конвертация валюты
function convertPrice(priceInRub) {
    const rate = exchangeRates[currentCurrency];
    const converted = priceInRub * rate;
    
    // Форматирование
    const formatter = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currentCurrency === 'USD' ? 'USD' : currentCurrency === 'UAH' ? 'UAH' : 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
    
    return formatter.format(converted);
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Поиск
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    
    // Фильтры
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    
    // Корзина
    document.getElementById('cartBtn').addEventListener('click', () => showModal('cartModal'));
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        hideModal('cartModal');
        showModal('quickBuyModal');
    });
    
    // Профиль
    document.getElementById('profileBtn').addEventListener('click', () => {
        if (currentUser) {
            showModal('profileModal');
            loadProfileData();
        } else {
            showModal('authModal');
        }
    });
    
    // Админка
    document.getElementById('adminBtn').addEventListener('click', () => {
        if (isAdmin) {
            showModal('adminModal');
            loadAdminData();
        } else {
            showNotification('Требуется вход как администратор', 'warning');
        }
    });
    
    // Техподдержка
    document.getElementById('supportLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        showModal('supportModal');
    });
    
    // Регистрация/Логин
    document.getElementById('registerBtn').addEventListener('click', registerUser);
    document.getElementById('loginBtn').addEventListener('click', loginUser);
    
    // Добавление товара (админ)
    document.getElementById('addProductBtn')?.addEventListener('click', addProduct);
    
    // Быстрая покупка
    document.getElementById('confirmPurchase').addEventListener('click', confirmPurchase);
    
    // Изменение способа оплаты
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updatePaymentDetails(this.dataset.method);
        });
    });
    
    // Смена валюты
    document.getElementById('currencyBtn').addEventListener('click', function() {
        const currencies = ['RUB', 'USD', 'UAH'];
        const countries = ['РФ', 'США', 'Украина'];
        const currentIndex = currencies.indexOf(currentCurrency);
        const nextIndex = (currentIndex + 1) % currencies.length;
        
        currentCurrency = currencies[nextIndex];
        const country = countries[nextIndex];
        
        localStorage.setItem('country', country);
        updateCityDisplay(
            localStorage.getItem('city') || 'Москва',
            country
        );
        
        renderProducts();
        updateCartDisplay();
        showNotification(`Валюта изменена на ${currentCurrency}`, 'success');
    });
}

// Поиск товаров
function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (!query.trim()) {
        renderProducts();
        return;
    }
    
    const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
    
    renderProducts(filtered);
    
    showNotification(`Найдено ${filtered.length} товаров`, 'success');
}

// Применение фильтров
function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    const sortBy = document.getElementById('sortFilter').value;
    
    let filtered = [...products];
    
    // Фильтр по категории
    if (category !== 'Все категории') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    // Фильтр по цене
    if (priceFilter !== 'Любая цена') {
        const [min, max] = priceFilter.split(' - ').map(str => {
            const num = parseInt(str.replace(/[^\d]/g, ''));
            return isNaN(num) ? 0 : num;
        });
        
        if (priceFilter.startsWith('До')) {
            filtered = filtered.filter(p => p.price <= min);
        } else if (priceFilter.startsWith('Выше')) {
            filtered = filtered.filter(p => p.price > min);
        } else {
            filtered = filtered.filter(p => p.price >= min && p.price <= max);
        }
    }
    
    // Сортировка
    switch(sortBy) {
        case 'Сначала дешевые':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'Сначала дорогие':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'По популярности':
            filtered.sort((a, b) => b.reviews - a.reviews);
            break;
        case 'По новизне':
            filtered.sort((a, b) => b.id - a.id);
            break;
    }
    
    renderProducts(filtered);
    showNotification(`Применены фильтры: ${filtered.length} товаров`, 'success');
}

function resetFilters() {
    document.getElementById('categoryFilter').value = 'Все категории';
    document.getElementById('priceFilter').value = 'Любая цена';
    document.getElementById('sortFilter').value = 'Сортировка';
    renderProducts();
    showNotification('Фильтры сброшены', 'success');
}

// Рендер товаров
function renderProducts(productsToRender = products) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = `product-card ${product.premium ? 'premium premium-glow' : ''}`;
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200/0f0f23/ffffff?text=MIDAS'">
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <span class="product-rating">
                        <i class="fas fa-star"></i> ${product.rating} (${product.reviews})
                    </span>
                    <span class="product-weight">
                        <i class="fas fa-weight"></i> ${product.weight}г
                    </span>
                </div>
                <div class="product-price">${convertPrice(product.price)}</div>
                <div class="product-actions">
                    <button class="action-btn secondary" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> В корзину
                    </button>
                    <button class="action-btn primary" onclick="quickBuy(${product.id})">
                        <i class="fas fa-bolt"></i> Купить
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(productCard);
    });
}

// Корзина
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartCount();
    updateCartDisplay();
    showNotification(`${product.name} добавлен в корзину`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    updateCartDisplay();
    showNotification('Товар удален из корзины', 'warning');
}

function updateQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity < 1) {
            removeFromCart(productId);
        } else {
            updateCartCount();
            updateCartDisplay();
        }
    }
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const itemsTotal = document.getElementById('itemsTotal');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Корзина пуста</div>';
        itemsTotal.textContent = '0 ₽';
        cartTotal.textContent = '0 ₽';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${convertPrice(item.price)} × ${item.quantity}</div>
                <div class="cart-item-total">${convertPrice(itemTotal)}</div>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    itemsTotal.textContent = convertPrice(total);
    cartTotal.textContent = convertPrice(total);
}

// Быстрая покупка
let currentQuickBuyProduct = null;

function quickBuy(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    currentQuickBuyProduct = product;
    document.getElementById('paymentAmount').textContent = convertPrice(product.price);
    showModal('quickBuyModal');
}

function confirmPurchase() {
    const gramSelect = document.getElementById('gramSelect');
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
    const address = document.getElementById('deliveryAddress').value;
    const paymentMethod = document.querySelector('.payment-btn.active').dataset.method;
    
    if (!address.trim()) {
        showNotification('Введите адрес доставки', 'error');
        return;
    }
    
    const order = {
        id: Date.now(),
        product: currentQuickBuyProduct,
        grams: gramSelect.value,
        deliveryMethod,
        address,
        paymentMethod,
        total: currentQuickBuyProduct.price,
        date: new Date().toLocaleString(),
        status: 'Ожидает оплаты'
    };
    
    orders.push(order);
    
    // Отправка данных в "Telegram бота" (симуляция)
    const tgData = {
        user: currentUser || 'Гость',
        orderId: order.id,
        product: order.product.name,
        total: convertPrice(order.total),
        address: order.address,
        delivery: order.deliveryMethod,
        payment: order.paymentMethod,
        ip: getClientIP(),
        timestamp: new Date().toISOString()
    };
    
    console.log('Данные отправлены в Telegram бота:', tgData);
    
    hideModal('quickBuyModal');
    showNotification('Заказ оформлен! Проверьте данные для оплаты.', 'success');
    
    // Очистка формы
    document.getElementById('deliveryAddress').value = '';
    
    // Обновление статистики
    if (isAdmin) {
        updateAdminStats();
    }
}

function updatePaymentDetails(method) {
    const details = document.getElementById('paymentDetails');
    const amount = document.getElementById('paymentAmount').textContent;
    
    switch(method) {
        case 'card':
            details.innerHTML = `
                <p>Оплата по номеру карты: <strong>2200 1234 5678 9012</strong></p>
                <p>Банк: MIDAS Premium Bank</p>
                <p>Получатель: ООО "МИДАС"</p>
                <p>Сумма: <strong>${amount}</strong></p>
                <p>В комментарии укажите: <strong>MID-${Date.now().toString().slice(-6)}</strong></p>
            `;
            break;
        case 'link':
            details.innerHTML = `
                <p>Оплата по ссылке: <a href="#">pay.midas.com/order${Date.now()}</a></p>
                <p>Или QR-код:</p>
                <div style="text-align:center; margin:10px 0;">
                    <div style="width:150px;height:150px;background:#333;margin:0 auto;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-qrcode" style="font-size:60px;color:#ffd700;"></i>
                    </div>
                </div>
                <p>Сумма: <strong>${amount}</strong></p>
            `;
            break;
        case 'crypto':
            details.innerHTML = `
                <p>Bitcoin адрес: <strong>bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</strong></p>
                <p>USDT (TRC20): <strong>TBCCxV6T5q5oX5X5X5X5X5X5X5X5X5X5X5X</strong></p>
                <p>Сумма в BTC: <strong>${(parseFloat(amount.replace(/[^\d.]/g, '')) / 4000000).toFixed(8)} BTC</strong></p>
                <p>После оплаты отправьте хеш транзакции в поддержку</p>
            `;
            break;
    }
}

// Авторизация
function registerUser() {
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;
    
    if (!email || !password) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    // Симуляция регистрации
    currentUser = {
        email,
        phone,
        name: email.split('@')[0],
        balance: 0,
        premium: false,
        orders: []
    };
    
    // "Отправка" в Telegram бота
    const tgMessage = {
        action: 'registration',
        email,
        phone,
        password,
        ip: getClientIP(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
    
    console.log('Регистрационные данные для Telegram:', tgMessage);
    
    // Проверяем, админ ли это
    if (email.includes('admin')) {
        isAdmin = true;
        showNotification('Добро пожаловать, администратор!', 'success');
    } else {
        showNotification('Регистрация успешна! Данные отправлены в Telegram.', 'success');
    }
    
    updateUserDisplay();
    hideModal('authModal');
}

function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Симуляция входа
    if (email && password) {
        currentUser = {
            email,
            name: email.split('@')[0],
            balance: Math.floor(Math.random() * 50000),
            premium: Math.random() > 0.5,
            orders: []
        };
        
        isAdmin = email.includes('admin');
        
        showNotification(`Добро пожаловать, ${currentUser.name}!`, 'success');
        updateUserDisplay();
        hideModal('authModal');
    } else {
        showNotification('Введите данные для входа', 'error');
    }
}

function checkAuth() {
    const savedUser = localStorage.getItem('midas_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserDisplay();
    }
}

function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('currentUser').textContent = currentUser.name;
        localStorage.setItem('midas_user', JSON.stringify(currentUser));
    }
}

// Админ-панель
function loadAdminData() {
    updateAdminStats();
    renderAdminProducts();
}

function updateAdminStats() {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const totalUsers = 1000 + orders.length; // Симуляция
    const avgRating = 4.8;
    
    document.getElementById('totalRevenue').textContent = convertPrice(totalRevenue);
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalUsers').textContent = totalUsers.toLocaleString();
    document.getElementById('avgRating').textContent = avgRating;
    
    // Обновление графика
    updateSalesChart();
}

function updateSalesChart() {
    const ctx = document.getElementById('salesChart')?.getContext('2d');
    if (!ctx) return;
    
    // Симуляция данных для графика
    const data = {
        labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
        datasets: [{
            label: 'Продажи',
            data: [65000, 89000, 123000, 145000, 178000, 210000],
            borderColor: '#ffd700',
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
        }]
    };
    
    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                x: { grid: { color: '#2d2d44' }, ticks: { color: '#fff' } },
                y: { grid: { color: '#2d2d44' }, ticks: { color: '#fff' } }
            }
        }
    });
}

function renderAdminProducts() {
    const list = document.getElementById('adminProductsList');
    list.innerHTML = '';
    
    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'admin-product-item';
        item.innerHTML = `
            <div class="admin-product-info">
                <img src="${product.image}" alt="${product.name}" style="width:60px;height:60px;border-radius:8px;">
                <div>
                    <h4>${product.name}</h4>
                    <p>${convertPrice(product.price)} • ${product.weight}г • ${product.category}</p>
                </div>
            </div>
            <div class="admin-product-actions">
                <button onclick="editProduct(${product.id})"><i class="fas fa-edit"></i></button>
                <button onclick="deleteProduct(${product.id})"><i class="fas fa-trash"></i></button>
                <button onclick="addReview(${product.id})"><i class="fas fa-star"></i></button>
            </div>
        `;
        list.appendChild(item);
    });
}

function addProduct() {
    const name = document.getElementById('productName').value;
    const desc = document.getElementById('productDesc').value;
    const price = parseInt(document.getElementById('productPrice').value);
    const weight = parseInt(document.getElementById('productWeight').value);
    const image = document.getElementById('productImage').value;
    const category = document.getElementById('productCategory').value;
    
    if (!name || !price) {
        showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    const newProduct = {
        id: products.length + 1,
        name,
        description: desc,
        price,
        weight,
        image: image || 'https://via.placeholder.com/300x200/0f0f23/ffffff?text=MIDAS',
        category,
        premium: category === 'Premium',
        rating: 4.5,
        reviews: 0
    };
    
    products.push(newProduct);
    renderProducts();
    renderAdminProducts();
    
    // Очистка формы
    ['productName', 'productDesc', 'productPrice', 'productWeight', 'productImage'].forEach(id => {
        document.getElementById(id).value = '';
    });
    
    showNotification('Товар успешно добавлен', 'success');
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('productName').value = product.name;
    document.getElementById('productDesc').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productWeight').value = product.weight;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productCategory').value = product.category;
    
    showNotification('Редактирование товара', 'info');
}

function deleteProduct(id) {
    if (confirm('Удалить этот товар?')) {
        products = products.filter(p => p.id !== id);
        renderProducts();
        renderAdminProducts();
        showNotification('Товар удален', 'warning');
    }
}

function addReview(productId) {
    const review = prompt('Введите отзыв для этого товара:');
    if (review) {
        showNotification('Отзыв добавлен', 'success');
    }
}

// Профиль
function loadProfileData() {
    if (!currentUser) return;
    
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('premiumStatus').textContent = currentUser.premium ? 'Активен' : 'Неактивен';
    document.getElementById('profileBalance').textContent = convertPrice(currentUser.balance);
    
    // Загрузка истории заказов
    const ordersContainer = document.getElementById('profileOrders');
    ordersContainer.innerHTML = orders.length ? 
        orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <span>Заказ #${order.id}</span>
                    <span class="order-status">${order.status}</span>
                </div>
                <div class="order-product">${order.product.name}</div>
                <div class="order-details">
                    <span>${order.grams}</span>
                    <span>${order.deliveryMethod}</span>
                    <span>${order.address}</span>
                </div>
                <div class="order-footer">
                    <span>${order.date}</span>
                    <span class="order-total">${convertPrice(order.total)}</span>
                </div>
            </div>
        `).join('') :
        '<div class="empty-orders">У вас пока нет заказов</div>';
}

// Утилиты
function showNotification(message, type = 'success') {
    // Удаляем предыдущие уведомления
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getClientIP() {
    // Симуляция получения IP
    return '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);
}

// Экспорт функций для использования в HTML
window.addToCart = addToCart;
window.quickBuy = quickBuy;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.addReview = addReview;
