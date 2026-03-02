/* =========================================================
   cart.js — Shopping cart state
   ========================================================= */
'use strict';

const Cart = {
    _items: [], // [{ productId, name, price, emoji, qty }]

    async add(productId) {
        const product = await DB.getProductById(productId);
        if (!product || !product.active) return false;
        const existing = this._items.find(i => i.productId === productId);
        if (existing) {
            existing.qty++;
        } else {
            this._items.push({ productId, name: product.name, price: product.price, emoji: product.emoji, qty: 1 });
        }
        this._notify();
        return true;
    },

    remove(productId) {
        this._items = this._items.filter(i => i.productId !== productId);
        this._notify();
    },

    update(productId, qty) {
        const item = this._items.find(i => i.productId === productId);
        if (!item) return;
        if (qty <= 0) { this.remove(productId); return; }
        item.qty = qty;
        this._notify();
    },

    getItems() { return [...this._items]; },
    getCount() { return this._items.reduce((s, i) => s + i.qty, 0); },
    getTotal() { return this._items.reduce((s, i) => s + i.price * i.qty, 0); },
    isEmpty() { return this._items.length === 0; },
    clear() { this._items = []; this._notify(); },

    _notify() {
        document.dispatchEvent(new CustomEvent('cart:updated'));
    },
};
