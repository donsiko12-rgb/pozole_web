/* =========================================================
   db.js — LocalStorage data layer (mirrors future REST API)
   ========================================================= */
'use strict';

const DB = {
    KEYS: {
        USERS: 'pozole_users',
        PRODUCTS: 'pozole_products',
        ORDERS: 'pozole_orders',
        SESSION: 'pozole_session',
    },

    init() {
        if (!localStorage.getItem(this.KEYS.USERS)) {
            const admin = {
                id: 'u_admin', name: 'Administrador', email: 'admin@pozole.mx',
                phone: '5500000000', password: btoa('admin123'), role: 'admin',
                createdAt: new Date().toISOString()
            };
            localStorage.setItem(this.KEYS.USERS, JSON.stringify([admin]));
        }

        if (!localStorage.getItem(this.KEYS.PRODUCTS)) {
            const products = [
                { id: 'p01', name: 'Pozole Chico', description: 'Ideal para una persona', price: 65, category: 'pozole', emoji: '🍲', active: true },
                { id: 'p02', name: 'Pozole Mediano', description: 'Para compartir con alguien', price: 110, category: 'pozole', emoji: '🍲', active: true },
                { id: 'p03', name: 'Pozole Grande', description: 'Para 3-4 personas', price: 180, category: 'pozole', emoji: '🫕', active: true },
                { id: 'p04', name: 'Pozole Familiar', description: 'Para toda la familia', price: 320, category: 'pozole', emoji: '🫕', active: true },
                { id: 'p05', name: 'Tostadas ×3', description: 'Doradas y crujientes', price: 20, category: 'extras', emoji: '🫓', active: true },
                { id: 'p06', name: 'Limones', description: 'Bolsita de limones', price: 10, category: 'extras', emoji: '🍋', active: true },
                { id: 'p07', name: 'Chile y Orégano', description: 'Condimentos extra', price: 15, category: 'extras', emoji: '🌶️', active: true },
                { id: 'p08', name: 'Agua de Horchata', description: 'Vaso 500 ml', price: 25, category: 'bebidas', emoji: '🥛', active: true },
                { id: 'p09', name: 'Agua de Jamaica', description: 'Vaso 500 ml', price: 25, category: 'bebidas', emoji: '🧃', active: true },
                { id: 'p10', name: 'Refresco', description: 'Lata 355 ml', price: 20, category: 'bebidas', emoji: '🥤', active: true },
            ];
            localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products));
        }

        if (!localStorage.getItem(this.KEYS.ORDERS)) {
            localStorage.setItem(this.KEYS.ORDERS, JSON.stringify([]));
        }
    },

    /* ── USERS ── */
    getUsers() { return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]'); },
    saveUsers(u) { localStorage.setItem(this.KEYS.USERS, JSON.stringify(u)); },
    getUserByEmail(e) { return this.getUsers().find(u => u.email === e.toLowerCase()); },
    getUserById(id) { return this.getUsers().find(u => u.id === id); },
    addUser(u) { const arr = this.getUsers(); arr.push(u); this.saveUsers(arr); },

    /* ── PRODUCTS ── */
    getProducts() { return JSON.parse(localStorage.getItem(this.KEYS.PRODUCTS) || '[]'); },
    saveProducts(p) { localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(p)); },
    getActiveProducts() { return this.getProducts().filter(p => p.active); },
    getProductById(id) { return this.getProducts().find(p => p.id === id); },
    addProduct(p) { const arr = this.getProducts(); arr.push(p); this.saveProducts(arr); },
    updateProduct(id, d) {
        const arr = this.getProducts(), i = arr.findIndex(p => p.id === id);
        if (i !== -1) { arr[i] = { ...arr[i], ...d }; this.saveProducts(arr); return arr[i]; }
        return null;
    },

    /* ── ORDERS ── */
    getOrders() { return JSON.parse(localStorage.getItem(this.KEYS.ORDERS) || '[]'); },
    saveOrders(o) { localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(o)); },
    getOrderById(id) { return this.getOrders().find(o => o.id === id); },
    getOrdersByUser(uid) { return this.getOrders().filter(o => o.userId === uid); },
    addOrder(o) { const arr = this.getOrders(); arr.unshift(o); this.saveOrders(arr); return o; },
    updateOrder(id, d) {
        const arr = this.getOrders(), i = arr.findIndex(o => o.id === id);
        if (i !== -1) { arr[i] = { ...arr[i], ...d }; this.saveOrders(arr); return arr[i]; }
        return null;
    },

    /* ── SESSION ── */
    getSession() { return JSON.parse(sessionStorage.getItem(this.KEYS.SESSION) || 'null'); },
    setSession(u) { sessionStorage.setItem(this.KEYS.SESSION, JSON.stringify(u)); },
    clearSession() { sessionStorage.removeItem(this.KEYS.SESSION); },
};
