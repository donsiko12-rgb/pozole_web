/* =========================================================
   orders.js — Order lifecycle
   ========================================================= */
'use strict';

const STATUS_LABELS = {
    received: { label: 'Pedido Recibido', icon: 'fa-check-circle', color: '#3498DB' },
    preparing: { label: 'En Preparación', icon: 'fa-fire', color: '#F39C12' },
    onway: { label: 'En Camino', icon: 'fa-motorcycle', color: '#F5A623' },
    delivered: { label: 'Entregado', icon: 'fa-house-circle-check', color: '#27AE60' },
};

const STATUSES = ['received', 'preparing', 'onway', 'delivered'];

const Orders = {
    create(cartItems, address, coords, reference) {
        const user = Auth.getCurrentUser();
        const order = {
            id: 'ORD-' + Date.now().toString().slice(-6),
            userId: user.id,
            userName: user.name,
            userPhone: user.phone,
            userEmail: user.email,
            items: cartItems,
            address,
            coords,
            reference,
            status: 'received',
            total: cartItems.reduce((s, i) => s + i.price * i.qty, 0),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return DB.addOrder(order);
    },

    updateStatus(orderId, newStatus) {
        if (!STATUSES.includes(newStatus)) return null;
        return DB.updateOrder(orderId, { status: newStatus, updatedAt: new Date().toISOString() });
    },

    getAll() { return DB.getOrders(); },
    getById(id) { return DB.getOrderById(id); },
    getByUser(uid) { return DB.getOrdersByUser(uid); },

    getStatusInfo(status) { return STATUS_LABELS[status] || STATUS_LABELS.received; },
    getAllStatuses() { return STATUSES; },

    getStatusIndex(status) { return STATUSES.indexOf(status); },

    // Daily summary helpers
    getTodayOrders() {
        const today = new Date().toDateString();
        return this.getAll().filter(o => new Date(o.createdAt).toDateString() === today);
    },

    getTodayTotal() {
        return this.getTodayOrders().reduce((s, o) => s + o.total, 0);
    },

    getTopProducts() {
        const counts = {};
        this.getTodayOrders().forEach(o => {
            o.items.forEach(item => {
                counts[item.name] = (counts[item.name] || 0) + item.qty;
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, qty]) => ({ name, qty }));
    },
};
