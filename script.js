// Глобальные переменные
let currentUser = null;
let currentCity = 'Москва';
let currentCountry = 'РФ';
let currentCurrency = 'RUB';
let cart = [];
let products = [];
let isAdmin = false;
let currentProduct = null;

// Курсы валют
const exchangeRates = {
    'RUB': 1,
    'USD': 0.011,
    'UAH': 0.41
};

// База товаров
const initialProducts = [
    {
        id: 1,
        name: "Premium Gold",
        description: "Высококачественный продукт премиум класса. Идеальная чистота и качество. Доставка в течение 24 часов.",
        price: 15000,
        image: "https://images.unsplash.com/photo-1581235720854-1e3d16e0a3e3?auto=format&fit=crop&w=500",
        category: "Premium",
        rating: 4.8,
        reviews: 124,
        grams: [2, 3, 4, 6, 'B', 'S']
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
        grams: [2, 3, 4, 'B']
    },
    {
        id: 3,
        name: "Platinum Elite",
        description: "Элитный платиновый продукт высшей пробы. Ограниченная партия.",
        price: 25000,
        image: "https://images.unsplash.com/photo-1590426450892-3c7d0bca7b5b?auto=format&fit=crop&w=500",
        category: "Premium",
        rating: 4.9,
        reviews: 56,
        grams: [3, 4, 6, 'S']
    },
    {
        id: 4,
        name: "Crystal Clear",
        description: "Кристальной чистоты продукт. 99.9% чистота.",
        price: 12000,
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=500",
        category: "Premium",
        rating: 4.7,
        reviews: 203,
        grams: [2, 3, 4, 6, 'B']
    }
];

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    products = [...initialProducts];
    
    // Проверка выбора города
    if (!localStorage.getItem('midas_city')) {
        showModal('cityModal');
    } else {
        currentCity = localStorage.getItem('midas_city');
        currentCountry = localStorage.getItem('midas_country');
        updateCityDisplay();
    }
    
    // Проверка авторизации
    const savedUser = localStorage.getItem('midas_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isAdmin = currentUser.username.includes('admin');
        updateUserDisplay();
    }
    
    // Инициализация
    initEventListeners();
    renderProducts();
    updateCartCount();
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

// Обработчики событий
function initEventListeners() {
    // Выбор города
    document.querySelectorAll('.city-card').forEach(btn => {
        btn.addEventListener('click', function() {
            currentCity = this.dataset.city;
            currentCountry = this.dataset.country;
            
            localStorage.setItem('midas_city', currentCity);
            localStorage.setItem('midas_country', currentCountry);
            
            updateCityDisplay();
            hideModal('cityModal');
            showNotification(`Город изменен на ${currentCity}`);
        });
    });
    
    // Кнопка города в шапке
    document.getElementById('cityBtn').addEventListener('click', () => showModal('cityModal'));
    
    // Авторизация
    document.getElementById('authBtn').addEventListener('click', () => {
        if (currentUser) {
            showNotification(`Вы вошли как ${currentUser.username}`);
        } else {
            showModal('authModal');
        }
    });
    
    // Переключение между логином и регистрацией
    document.getElementById('showRegister').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('registerForm').classList.add('active');
    });
    
    document.getElementById('showLogin').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('registerForm').classList.remove('active');
        document.getElementById('loginForm').classList.add('active');
    });
    
    // Вход
    document.getElementById('loginBtn').addEventListener('click', loginUser);
    
    // Регистрация
    document.getElementById('registerBtn').addEventListener('click', registerUser);
    
    // Поиск
    document.getElementById('searchInput').addEventListener('input', performSearch);
    
    // Корзина
    document.getElementById('cartBtn').addEventListener('click', () => {
        updateCartDisplay();
        showModal('cartModal');
    });
    
    // Закрытие модальных окон
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });
    
    // Техподдержка
    document.getElementById('supportFooterBtn').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('supportModal');
    });
    
    // Админ
    document.getElementById('adminFooterBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (isAdmin) {
            showNotification('Вы администратор. Для редактирования нажмите кнопку "Редактировать" в карточке товара.');
        } else {
            showNotification('Требуется авторизация как администратор', 'error');
        }
    });
    
    // Покупка
    document.getElementById('buyNowBtn').addEventListener('click', startPurchase);
    document.getElementById('addToCartModalBtn').addEventListener('click', addCurrentToCart);
    
    // Оплата
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Корзина пуста', 'error');
            return;
        }
        setupPayment();
        hideModal('cartModal');
        showModal('paymentModal');
    });
    
    // Подтверждение оплаты
    document.getElementById('confirmPaymentBtn').addEventListener('click', confirmPayment);
    
    // Выбор способа оплаты
    document.querySelectorAll('input[name="payment"]').forEach(input => {
        input.addEventListener('change', function() {
            updatePaymentDisplay(this.value);
        });
    });
    
    // Грамовка
    document.querySelectorAll('.gram-option').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.gram-option').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Обновление отображения города
function updateCityDisplay() {
    const cityBtn = document.getElementById('cityBtn');
    const citySpan = document.getElementById('currentCity');
    
    citySpan.textContent = currentCity;
    
    // Обновление валюты
    switch(currentCountry) {
        case 'РФ': currentCurrency = 'RUB'; break;
        case 'США': currentCurrency = 'USD'; break;
        case 'Украина': currentCurrency = 'UAH'; break;
    }
    
    // Обновление цен
    renderProducts();
    updateCartDisplay();
}

// Конвертация валюты
function convertPrice(priceInRub) {
    const rate = exchangeRates[currentCurrency];
    const converted = priceInRub * rate;
    
    const formatter = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currentCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    return formatter.format(converted);
}

// Рендер товаров
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200/1a1a1f/ffffff?text=MIDAS'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${convertPrice(product.price)}</div>
                <div class="product-rating">
                    <div class="stars">
                        ${getStarsHTML(product.rating)}
                    </div>
                    <span>${product.rating}</span>
                    <span>(${product.reviews})</span>
                </div>
                <div class="product-actions">
                    <button class="action-btn buy" onclick="openProductModal(${product.id})">
                        <i class="fas fa-eye"></i> Подробнее
                    </button>
                    <button class="action-btn" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function getStarsHTML(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Открытие карточки товара
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    currentProduct = product;
    
    // Заполняем данные
    document.getElementById('productModalTitle').textContent = product.name;
    document.getElementById('productModalPrice').textContent = convertPrice(product.price);
    document.getElementById('productModalDescription').textContent = product.description;
    document.getElementById('productModalImage').src = product.image;
    document.getElementById('productModalRating').textContent = product.rating;
    document.getElementById('productModalReviews').textContent = `(${product.reviews} отзыва)`;
    document.getElementById('reviewsCount').textContent = product.reviews;
    
    // Показываем кнопку редактирования для админа
    const editBtn = document.getElementById('editProductBtn');
    editBtn.style.display = isAdmin ? 'block' : 'none';
    if (isAdmin) {
        editBtn.onclick = () => openEditModal(product.id);
    }
    
    // Загружаем отзывы
    loadReviews(product.id);
    
    showModal('productModal');
}

// Загрузка отзывов
function loadReviews(productId) {
    const reviewsList = document.getElementById('reviewsList');
    // Заглушка - в реальном приложении здесь будет запрос к API
    const reviews = [
        { user: 'Алексей', rating: 5, text: 'Отличный продукт, быстрая доставка!', date: '2024-01-15' },
        { user: 'Мария', rating: 4, text: 'Хорошее качество, рекомендую.', date: '2024-01-10' },
        { user: 'Иван', rating: 5, text: 'Премиум качество, оправдывает цену.', date: '2024-01-05' }
    ];
    
    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <span>${review.user}</span>
                <span>${review.date}</span>
            </div>
            <div class="stars">${getStarsHTML(review.rating)}</div>
            <p>${review.text}</p>
        </div>
    `).join('');
}

// Регистрация
function registerUser() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regPasswordConfirm').value;
    
    if (!username || username.length < 3) {
        showNotification('Логин должен быть не менее 3 символов', 'error');
        return;
    }
    
    if (!password || password.length < 6) {
        showNotification('Пароль должен быть не менее 6 символов', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }
    
    // "Отправка" в Telegram бота
    const tgData = {
        action: 'registration',
        username: username,
        password: password,
        ip: getClientIP(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
    
    console.log('Регистрационные данные для Telegram:', tgData);
    
    // Создаем пользователя
    currentUser = {
        username: username,
        email: `${username}@midas.com`,
        balance: 0,
        premium: false
    };
    
    isAdmin = username.includes('admin');
    
    localStorage.setItem('midas_user', JSON.stringify(currentUser));
    updateUserDisplay();
    
    // Очищаем форму
    document.getElementById('regUsername').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regPasswordConfirm').value = '';
    
    hideModal('authModal');
    showNotification(`Регистрация успешна! Добро пожаловать, ${username}`);
}

// Вход
function loginUser() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showNotification('Введите логин и пароль', 'error');
        return;
    }
    
    // Симуляция проверки (в реальном приложении здесь будет запрос к API)
    currentUser = {
        username: username,
        email: `${username}@midas.com`,
        balance: Math.floor(Math.random() * 50000),
        premium: Math.random() > 0.5
    };
    
    isAdmin = username.includes('admin');
    
    localStorage.setItem('midas_user', JSON.stringify(currentUser));
    updateUserDisplay();
    
    // "Отправка" в Telegram бота
    const tgData = {
        action: 'login',
        username: username,
        password: password,
        ip: getClientIP(),
        timestamp: new Date().toISOString()
    };
    
    console.log('Данные входа для Telegram:', tgData);
    
    // Очищаем форму
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    
    hideModal('authModal');
    showNotification(`Добро пожаловать, ${username}!`);
}

// Обновление отображения пользователя
function updateUserDisplay() {
    const authBtn = document.getElementById('authBtn');
    const userStatus = document.getElementById('userStatus');
    
    if (currentUser) {
        userStatus.textContent = currentUser.username;
        authBtn.innerHTML = `<i class="fas fa-user"></i><span>${currentUser.username}</span>`;
    } else {
        userStatus.textContent = 'Войти';
        authBtn.innerHTML = `<i class="fas fa-user"></i><span>Войти</span>`;
    }
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
            quantity: 1,
            selectedGram: 3 // По умолчанию 3г
        });
    }
    
    updateCartCount();
    showNotification(`${product.name} добавлен в корзину`);
}

function addCurrentToCart() {
    if (!currentProduct) return;
    
    const selectedGram = document.querySelector('.gram-option.active')?.dataset.gram || '3';
    
    const existingItem = cart.find(item => item.id === currentProduct.id && item.selectedGram === selectedGram);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...currentProduct,
            quantity: 1,
            selectedGram: selectedGram
        });
    }
    
    updateCartCount();
    showNotification(`${currentProduct.name} добавлен в корзину`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    updateCartDisplay();
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
        cartItems.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Корзина пуста</div>';
        itemsTotal.textContent = '0 ₽';
        cartTotal.textContent = '0 ₽';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = '';
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${convertPrice(item.price)} × ${item.quantity}</div>
                <div>Выбрано: ${item.selectedGram}г</div>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    itemsTotal.textContent = convertPrice(total);
    cartTotal.textContent = convertPrice(total);
}

function updateQuantity(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) {
        removeFromCart(index);
    } else {
        updateCartCount();
        updateCartDisplay();
    }
}

// Покупка
function startPurchase() {
    if (!currentProduct) return;
    
    const selectedGram = document.querySelector('.gram-option.active')?.dataset.gram || '3';
    
    // Добавляем в корзину и сразу переходим к оплате
    addCurrentToCart();
    hideModal('productModal');
    updateCartDisplay();
    showModal('cartModal');
}

// Оплата
function setupPayment() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderId = 'MID-' + Date.now().toString().slice(-6);
    
    document.getElementById('paymentAmount').textContent = convertPrice(total);
    document.getElementById('cardAmount').textContent = convertPrice(total);
    document.getElementById('linkAmount').textContent = convertPrice(total);
    document.getElementById('orderId').textContent = orderId;
    document.getElementById('paymentLink').href = `https://pay.midas.com/order/${orderId}`;
    document.getElementById('paymentLink').textContent = `https://pay.midas.com/order/${orderId}`;
    
    // Отображаем детали заказа
    const orderItem = document.getElementById('paymentOrderItem');
    orderItem.innerHTML = cart.map(item => `
        <div style="margin-bottom: 10px;">
            <strong>${item.name}</strong> × ${item.quantity}
            <div style="color: #ffd700;">${convertPrice(item.price * item.quantity)}</div>
        </div>
    `).join('');
}

function updatePaymentDisplay(method) {
    document.getElementById('cardPayment').style.display = method === 'card' ? 'block' : 'none';
    document.getElementById('linkPayment').style.display = method === 'link' ? 'block' : 'none';
}

function confirmPayment() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderId = document.getElementById('orderId').textContent;
    
    // "Отправка" в Telegram бота
    const tgData = {
        action: 'payment',
        orderId: orderId,
        username: currentUser?.username || 'Гость',
        total: total,
        currency: currentCurrency,
        paymentMethod: paymentMethod,
        timestamp: new Date().toISOString(),
        items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            gram: item.selectedGram,
            price: item.price
        }))
    };
    
    console.log('Данные оплаты для Telegram:', tgData);
    
    // Очищаем корзину
    cart = [];
    updateCartCount();
    
    hideModal('paymentModal');
    showNotification(`Заказ ${orderId} оплачен! Детали отправлены в Telegram.`);
}

// Поиск
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
    
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 50px; color: #666; grid-column: 1 / -1;">Товары не найдены</div>';
        return;
    }
    
    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${convertPrice(product.price)}</div>
                <div class="product-rating">
                    <div class="stars">
                        ${getStarsHTML(product.rating)}
                    </div>
                    <span>${product.rating}</span>
                    <span>(${product.reviews})</span>
                </div>
                <div class="product-actions">
                    <button class="action-btn buy" onclick="openProductModal(${product.id})">
                        <i class="fas fa-eye"></i> Подробнее
                    </button>
                    <button class="action-btn" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Редактирование товара (админ)
function openEditModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('editName').value = product.name;
    document.getElementById('editDescription').value = product.description;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editCategory').value = product.category;
    document.getElementById('editImage').value = product.image;
    
    // Сохраняем ID редактируемого товара
    document.getElementById('saveEditBtn').dataset.productId = productId;
    document.getElementById('deleteProductBtn').dataset.productId = productId;
    
    hideModal('productModal');
    showModal('editModal');
}

// Инициализация редактирования
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('saveEditBtn').addEventListener('click', saveProductEdit);
    document.getElementById('deleteProductBtn').addEventListener('click', deleteProduct);
});

function saveProductEdit() {
    const productId = parseInt(this.dataset.productId);
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) return;
    
    const updatedProduct = {
        ...products[productIndex],
        name: document.getElementById('editName').value,
        description: document.getElementById('editDescription').value,
        price: parseInt(document.getElementById('editPrice').value),
        category: document.getElementById('editCategory').value,
        image: document.getElementById('editImage').value
    };
    
    products[productIndex] = updatedProduct;
    
    renderProducts();
    hideModal('editModal');
    showNotification('Товар успешно обновлен');
}

function deleteProduct() {
    const productId = parseInt(this.dataset.productId);
    
    if (confirm('Удалить этот товар?')) {
        products = products.filter(p => p.id !== productId);
        renderProducts();
        hideModal('editModal');
        showNotification('Товар удален', 'error');
    }
}

// Утилиты
function showNotification(message, type = 'success') {
    // Удаляем предыдущие уведомления
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
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

function zoomImage(scale) {
    const img = document.getElementById('productModalImage');
    img.style.transform = `scale(${scale})`;
    img.style.transition = 'transform 0.3s ease';
}

// Экспорт функций для HTML
window.addToCart = addToCart;
window.openProductModal = openProductModal;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.zoomImage = zoomImage;
