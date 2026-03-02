/* =========================================================
   products.js — Product management
   ========================================================= */
'use strict';

const Products = {
    getAll() { return DB.getProducts(); },
    getActive() { return DB.getActiveProducts(); },
    getById(id) { return DB.getProductById(id); },

    add(data) {
        const product = {
            id: 'p_' + Date.now(),
            name: data.name.trim(),
            description: data.description.trim(),
            price: parseFloat(data.price),
            category: data.category,
            emoji: data.emoji || '🍽️',
            active: true,
        };
        DB.addProduct(product);
        return product;
    },

    update(id, data) {
        return DB.updateProduct(id, {
            name: data.name?.trim(),
            description: data.description?.trim(),
            price: data.price ? parseFloat(data.price) : undefined,
            category: data.category,
            emoji: data.emoji,
        });
    },

    toggle(id) {
        const p = DB.getProductById(id);
        if (!p) return null;
        return DB.updateProduct(id, { active: !p.active });
    },

    CATEGORIES: [
        { id: 'pozole', label: 'Pozoles', emoji: '🍲' },
        { id: 'extras', label: 'Extras', emoji: '🫓' },
        { id: 'bebidas', label: 'Bebidas', emoji: '🥤' },
    ],

    getCategoryLabel(id) {
        return this.CATEGORIES.find(c => c.id === id)?.label || id;
    },
};
