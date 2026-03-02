/* =========================================================
   app.js — Main app: initialization + all event binding
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    DB.init();

    // Restore session
    const user = Auth.getCurrentUser();
    if (user) {
        Router.navigate(user.role === 'admin' ? 'admin' : 'menu');
    } else {
        Router.navigate('login');
    }

    /* ─────────────────────────────────────
       CART EVENTS
    ───────────────────────────────────── */
    document.addEventListener('cart:updated', () => {
        UI.updateCartBadge();
        if (Router.getCurrent() === 'cart') UI.renderCart();
        if (Router.getCurrent() === 'menu') UI.renderMenu(_currentCategory);
    });

    /* ─────────────────────────────────────
       AUTH EVENTS
    ───────────────────────────────────── */
    // Login
    document.getElementById('btn-login').addEventListener('click', () => {
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-pass').value;
        clearErrors('login-form');
        let ok = true;
        if (!email) { showError('login-email-err', 'Ingresa tu correo'); ok = false; }
        if (!pass) { showError('login-pass-err', 'Ingresa tu contraseña'); ok = false; }
        if (!ok) return;
        const res = Auth.login(email, pass);
        if (!res.ok) { UI.toast(res.msg, 'error'); return; }
        document.getElementById('login-email').value = '';
        document.getElementById('login-pass').value = '';
        Router.navigate(res.user.role === 'admin' ? 'admin' : 'menu');
        UI.toast(`¡Bienvenido, ${res.user.name.split(' ')[0]}! 🌮`, 'success');
    });

    // Register
    document.getElementById('btn-register').addEventListener('click', () => {
        const name = document.getElementById('reg-name').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-pass').value;
        const pass2 = document.getElementById('reg-pass2').value;
        clearErrors('register-form');
        let ok = true;
        if (!name) { showError('reg-name-err', 'Ingresa tu nombre'); ok = false; }
        if (!phone) { showError('reg-phone-err', 'Ingresa tu teléfono'); ok = false; }
        if (!email || !email.includes('@')) { showError('reg-email-err', 'Correo inválido'); ok = false; }
        if (pass.length < 6) { showError('reg-pass-err', 'Mínimo 6 caracteres'); ok = false; }
        if (pass !== pass2) { showError('reg-pass2-err', 'Las contraseñas no coinciden'); ok = false; }
        if (!ok) return;
        const res = Auth.register(name, phone, email, pass);
        if (!res.ok) { UI.toast(res.msg, 'error'); return; }
        Router.navigate('menu');
        UI.toast('¡Cuenta creada exitosamente! 🎉', 'success');
    });

    // Recover Password
    document.getElementById('btn-recover').addEventListener('click', () => {
        const email = document.getElementById('recover-email').value.trim();
        if (!email) { showError('recover-email-err', 'Ingresa tu correo'); return; }
        const res = Auth.recoverPassword(email);
        if (!res.ok) { UI.toast(res.msg, 'error'); return; }
        UI.toast(res.msg, 'success', 5000);
        Router.navigate('login');
    });

    // Screen nav links
    on('go-register', 'click', () => Router.navigate('register'));
    on('go-login', 'click', () => Router.navigate('login'));
    on('go-recover', 'click', () => Router.navigate('recover'));
    on('go-recover-back', 'click', () => Router.navigate('login'));

    /* ─────────────────────────────────────
       MENU EVENTS (event delegation)
    ───────────────────────────────────── */
    let _currentCategory = 'all';

    document.getElementById('products-grid').addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'add') { Cart.add(id); UI.toast('Agregado al carrito 🛒'); }
        if (action === 'increase') { const item = Cart.getItems().find(i => i.productId === id); Cart.update(id, (item?.qty || 0) + 1); }
        if (action === 'decrease') { const item = Cart.getItems().find(i => i.productId === id); Cart.update(id, (item?.qty || 1) - 1); }
    });

    document.getElementById('category-tabs').addEventListener('click', e => {
        const tab = e.target.closest('.cat-tab');
        if (!tab) return;
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        _currentCategory = tab.dataset.cat;
        UI.renderMenu(_currentCategory);
    });

    on('btn-go-profile', 'click', () => Router.navigate('profile'));
    on('btn-go-cart', 'click', () => Router.navigate('cart'));
    on('menu-logout', 'click', handleLogout);

    /* ─────────────────────────────────────
       PROFILE EVENTS
    ───────────────────────────────────── */
    on('profile-back', 'click', () => Router.navigate('menu'));

    on('btn-save-profile', 'click', () => {
        const name = document.getElementById('profile-name').value.trim();
        const phone = document.getElementById('profile-phone').value.trim();
        if (!name || !phone) { UI.toast('Por favor completa todos los campos', 'warning'); return; }

        const res = Auth.updateProfile(name, phone);
        if (res.ok) {
            UI.toast('Perfil actualizado correctamente ✅', 'success');
            Router.navigate('menu');
        } else {
            UI.toast('Error al actualizar', 'error');
        }
    });

    /* ─────────────────────────────────────
       CART EVENTS
    ───────────────────────────────────── */
    on('cart-back', 'click', () => Router.navigate('menu'));

    document.getElementById('cart-items-list').addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'cart-increase') { const item = Cart.getItems().find(i => i.productId === id); Cart.update(id, (item?.qty || 0) + 1); }
        if (action === 'cart-decrease') { const item = Cart.getItems().find(i => i.productId === id); Cart.update(id, (item?.qty || 1) - 1); }
    });

    on('btn-confirm-order', 'click', () => {
        if (Cart.isEmpty()) { UI.toast('Tu carrito está vacío', 'warning'); return; }
        Router.navigate('delivery');
    });

    /* ─────────────────────────────────────
       DELIVERY EVENTS
    ───────────────────────────────────── */
    on('delivery-back', 'click', () => Router.navigate('cart'));

    on('btn-place-order', 'click', () => {
        const address = document.getElementById('delivery-address').value.trim();
        const ref = document.getElementById('delivery-ref').value.trim();
        if (!address) { UI.toast('Por favor ingresa tu dirección', 'warning'); return; }
        const coords = MapManager.getDeliveryCoords();
        const order = Orders.create(Cart.getItems(), address, coords, ref);
        window._currentUserOrder = order;
        Cart.clear();
        document.getElementById('delivery-address').value = '';
        document.getElementById('delivery-ref').value = '';
        Router.navigate('tracking');
        UI.toast('¡Pedido enviado! 🎉', 'success');
    });

    /* ─────────────────────────────────────
       TRACKING EVENTS
    ───────────────────────────────────── */
    on('tracking-back', 'click', () => Router.navigate('menu'));
    on('tracking-logout', 'click', handleLogout);

    // Auto-refresh tracking every 10s
    setInterval(() => {
        if (Router.getCurrent() === 'tracking') UI.renderTracking();
    }, 10000);

    /* ─────────────────────────────────────
       ADMIN EVENTS
    ───────────────────────────────────── */
    on('admin-logout', 'click', handleLogout);

    // Admin tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.querySelectorAll('.admin-panel-screen').forEach(p => p.classList.remove('active-sub'));
            document.getElementById('admin-panel-' + target).classList.add('active-sub');
            if (target === 'orders') UI.renderAdminOrders();
            if (target === 'products') UI.renderAdminProducts();
            if (target === 'summary') UI.renderAdminSummary();
        });
    });

    // Admin orders list click
    document.getElementById('admin-orders-list').addEventListener('click', e => {
        const card = e.target.closest('[data-action="view-order"]');
        if (!card) return;
        UI.openOrderDetail(card.dataset.id);
    });

    // Admin products list events
    document.getElementById('admin-products-list').addEventListener('click', e => {
        const btn = e.target.closest('[data-action="edit-product"]');
        if (btn) { UI.openProductForm(btn.dataset.id); return; }
    });
    document.getElementById('admin-products-list').addEventListener('change', e => {
        const chk = e.target.closest('[data-action="toggle-product"]');
        if (chk) { Products.toggle(chk.dataset.id); UI.renderAdminProducts(); UI.toast('Producto actualizado', 'info'); }
    });

    // FAB — add product
    on('fab-add-product', 'click', () => UI.openProductForm());

    // Modal events (delegated from modal body)
    document.getElementById('modal-body').addEventListener('click', e => {
        // Save order status
        if (e.target.closest('#btn-save-status')) {
            const status = document.getElementById('status-select-modal').value;
            const order = window._currentAdminOrder;
            if (!order) return;
            Orders.updateStatus(order.id, status);
            UI.closeModal();
            UI.renderAdminOrders();
            UI.toast('Estado actualizado', 'success');
        }
        // Mark as delivered
        if (e.target.closest('#btn-mark-delivered')) {
            const order = window._currentAdminOrder;
            if (!order) return;
            Orders.updateStatus(order.id, 'delivered');
            UI.closeModal();
            UI.renderAdminOrders();
            UI.toast('¡Pedido marcado como entregado! ✅', 'success');
        }
        // Save product
        if (e.target.closest('#btn-save-product')) {
            const productId = document.getElementById('edit-product-id').value;
            const data = {
                name: document.getElementById('prod-name').value.trim(),
                description: document.getElementById('prod-desc').value.trim(),
                price: document.getElementById('prod-price').value,
                emoji: document.getElementById('prod-emoji').value.trim(),
                category: document.getElementById('prod-category').value,
            };
            if (!data.name || !data.price) { UI.toast('Completa nombre y precio', 'warning'); return; }
            if (productId) {
                Products.update(productId, data);
                UI.toast('Producto actualizado', 'success');
            } else {
                Products.add(data);
                UI.toast('Producto agregado ✅', 'success');
            }
            UI.closeModal();
            UI.renderAdminProducts();
        }
    });

    // Close modal
    on('modal-close', 'click', () => UI.closeModal());
    on('modal-overlay', 'click', e => { if (e.target.id === 'modal-overlay') UI.closeModal(); });

    /* ─────────────────────────────────────
       HELPERS
    ───────────────────────────────────── */
    function on(id, event, fn) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    }

    function handleLogout() {
        Auth.logout();
        Cart.clear();
        window._currentUserOrder = null;
        Router.navigate('login');
        UI.toast('Sesión cerrada', 'info');
    }

    function showError(id, msg) {
        const el = document.getElementById(id);
        if (el) { el.textContent = msg; el.classList.add('show'); }
    }

    function clearErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        form.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
    }
});
