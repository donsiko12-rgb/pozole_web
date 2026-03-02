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

    async init() {
        // Seed products if collection is empty
        try {
            const snapshot = await db.collection('products').limit(1).get();
            if (snapshot.empty) {
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

                const batch = db.batch();
                products.forEach(p => {
                    const ref = db.collection('products').doc();
                    p.id = ref.id; // Assign Firestore ID
                    batch.set(ref, p);
                });
                await batch.commit();
            }
        } catch (e) {
            console.warn('Could not seed products (verify Firestore Rules):', e);
        }
    },

    /* ── USERS (Firebase Admin handles auth, Firestore handles profile) ── */
    async getUserById(id) {
        const doc = await db.collection('users').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    async updateUser(id, d) {
        await db.collection('users').doc(id).update(d);
        return { id, ...d };
    },

    /* ── PRODUCTS ── */
    async getProducts() {
        const snapshot = await db.collection('products').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async getActiveProducts() {
        const snapshot = await db.collection('products').where('active', '==', true).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async getProductById(id) {
        const doc = await db.collection('products').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    async addProduct(p) {
        const ref = await db.collection('products').add(p);
        return { id: ref.id, ...p };
    },
    async updateProduct(id, d) {
        await db.collection('products').doc(id).update(d);
        return { id, ...d };
    },

    /* ── ORDERS ── */
    async getOrders() {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async getOrderById(id) {
        const doc = await db.collection('orders').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    async getOrdersByUser(uid) {
        // Removed .orderBy to avoid requiring a composite index in Firestore
        const snapshot = await db.collection('orders').where('userId', '==', uid).get();
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort locally by date descending
        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async addOrder(o) {
        const ref = await db.collection('orders').add(o);
        o.id = ref.id;
        // Optionally update the doc with its own ID (Firestore creates the ID first)
        await ref.update({ id: ref.id });
        return o;
    },
    async updateOrder(id, d) {
        await db.collection('orders').doc(id).update(d);
        return { id, ...d };
    },

    /* ── SESSION (Local sync fallback for fast UI rendering) ── */
    getSession() { return JSON.parse(sessionStorage.getItem(this.KEYS.SESSION) || 'null'); },
    setSession(u) { sessionStorage.setItem(this.KEYS.SESSION, JSON.stringify(u)); },
    clearSession() { sessionStorage.removeItem(this.KEYS.SESSION); },
};
