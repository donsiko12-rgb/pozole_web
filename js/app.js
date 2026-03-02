/* =========================================================
   app.js — Main app: initialization + all event binding
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await DB.init();
    } catch (e) {
        console.error("DB init failed:", e);
    }

    // Listen to Firebase Auth state changes
    auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
            // User is logged into Firebase, refetch latest data from Firestore
            try {
                const doc = await db.collection('users').doc(firebaseUser.uid).get();
                if (doc.exists) {
                    const userData = { id: firebaseUser.uid, ...doc.data() };
                    DB.setSession(userData); // Keep local sync copy

                    // If they are on a public screen or haven't loaded one, redirect them in
                    const currentScreen = Router.getCurrent();
                    if (!currentScreen || ['login', 'register', 'recover'].includes(currentScreen)) {
                        Router.navigate(userData.role === 'admin' ? 'admin' : 'menu');
                    }
                } else {
                    DB.clearSession();
                    if (Router.getCurrent() !== 'login') Router.navigate('login');
                }
            } catch (err) {
                console.error("Error fetching user session", err);
                DB.clearSession();
                UI.toast('Error conectando a la base de datos (Verifica los permisos).', 'error');
                if (Router.getCurrent() !== 'login') Router.navigate('login');
            }
        } else {
            // User is signed out
            DB.clearSession();
            if (Router.getCurrent() !== 'login' && Router.getCurrent() !== 'register' && Router.getCurrent() !== 'recover') {
                Router.navigate('login');
            }
        }
    });

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
    document.getElementById('btn-login').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-pass').value;
        const btn = document.getElementById('btn-login');

        clearErrors('login-form');
        let ok = true;
        if (!email) { showError('login-email-err', 'Ingresa tu correo'); ok = false; }
        if (!pass) { showError('login-pass-err', 'Ingresa tu contraseña'); ok = false; }
        if (!ok) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...';

        const res = await Auth.login(email, pass);

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar';

        if (!res.ok) { UI.toast(res.msg, 'error'); return; }

        document.getElementById('login-email').value = '';
        document.getElementById('login-pass').value = '';
        Router.navigate(res.user.role === 'admin' ? 'admin' : 'menu');
        UI.toast(`¡Bienvenido, ${res.user.name.split(' ')[0]}! 🌮`, 'success');
    });

    // Register
    document.getElementById('btn-register').addEventListener('click', async () => {
        const name = document.getElementById('reg-name').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-pass').value;
        const pass2 = document.getElementById('reg-pass2').value;
        const address = document.getElementById('reg-address').value.trim();
        const colonia = document.getElementById('reg-colonia').value.trim();
        const btn = document.getElementById('btn-register');

        clearErrors('register-form');
        let ok = true;
        if (!name) { showError('reg-name-err', 'Ingresa tu nombre'); ok = false; }
        if (!phone) { showError('reg-phone-err', 'Ingresa tu teléfono'); ok = false; }
        if (!email || !email.includes('@')) { showError('reg-email-err', 'Correo inválido'); ok = false; }
        if (!address) { showError('reg-address-err', 'Ingresa tu dirección'); ok = false; }
        if (!colonia) { showError('reg-colonia-err', 'Ingresa tu colonia'); ok = false; }
        if (pass.length < 6) { showError('reg-pass-err', 'Mínimo 6 caracteres'); ok = false; }
        if (pass !== pass2) { showError('reg-pass2-err', 'Las contraseñas no coinciden'); ok = false; }
        if (!ok) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creando...';

        const res = await Auth.register(name, phone, email, pass, address, colonia);

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Crear cuenta';

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

    document.getElementById('products-grid').addEventListener('click', async e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'add') {
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;
            const ok = await Cart.add(id);
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            if (ok) UI.toast('Agregado al carrito 🛒');
        }
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
    on('btn-go-orders', 'click', () => Router.navigate('client-orders'));
    on('btn-go-cart', 'click', () => Router.navigate('cart'));
    on('menu-logout', 'click', handleLogout);

    /* ─────────────────────────────────────
       CLIENT ORDERS EVENTS
    ───────────────────────────────────── */
    on('client-orders-back', 'click', () => Router.navigate('menu'));

    document.getElementById('client-orders-list').addEventListener('click', e => {
        const card = e.target.closest('[data-action="view-client-order"]');
        if (!card) return;
        window.startTrackingListener(card.dataset.id);
        Router.navigate('tracking');
    });

    /* ─────────────────────────────────────
       PROFILE EVENTS
    ───────────────────────────────────── */
    on('profile-back', 'click', () => Router.navigate('menu'));

    on('btn-save-profile', async () => {
        const name = document.getElementById('profile-name').value.trim();
        const phone = document.getElementById('profile-phone').value.trim();
        const address = document.getElementById('profile-address').value.trim();
        const colonia = document.getElementById('profile-colonia').value.trim();

        if (!name || !phone || !address || !colonia) {
            UI.toast('Por favor completa todos los campos', 'warning');
            return;
        }

        const btn = document.getElementById('btn-save-profile');
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        const res = await Auth.updateProfile(name, phone, address, colonia);

        btn.disabled = false;
        btn.innerHTML = originalHtml;

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

    on('btn-place-order', 'click', async () => {
        const address = document.getElementById('delivery-address').value.trim();
        const ref = document.getElementById('delivery-ref').value.trim();
        if (!address) { UI.toast('Por favor ingresa tu dirección', 'warning'); return; }

        const btn = document.getElementById('btn-place-order');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

        const coords = MapManager.getDeliveryCoords();
        const order = await Orders.create(Cart.getItems(), address, coords, ref);

        btn.disabled = false;
        btn.innerHTML = 'Enviar pedido <i class="fa-solid fa-arrow-right"></i>';

        window._currentUserOrder = order;
        Cart.clear();
        document.getElementById('delivery-address').value = '';
        document.getElementById('delivery-ref').value = '';

        window.startTrackingListener(order.id);
        Router.navigate('tracking');
        UI.toast('¡Pedido enviado! 🎉', 'success');
    });

    /* ─────────────────────────────────────
       TRACKING EVENTS
    ───────────────────────────────────── */
    on('tracking-back', 'click', () => Router.navigate('menu'));
    on('tracking-logout', 'click', handleLogout);

    // Real-time tracking using Firestore onSnapshot
    let trackingUnsubscribe = null;

    // Call this when entering tracking screen
    window.startTrackingListener = (orderId) => {
        if (trackingUnsubscribe) trackingUnsubscribe();

        trackingUnsubscribe = db.collection('orders').doc(orderId).onSnapshot(doc => {
            if (doc.exists && Router.getCurrent() === 'tracking') {
                const fresh = { id: doc.id, ...doc.data() };
                window._currentUserOrder = fresh;
                UI.renderTracking();
            }
        });
    };

    /* ─────────────────────────────────────
       ADMIN EVENTS
    ───────────────────────────────────── */
    on('admin-logout', 'click', handleLogout);

    // Admin real-time orders listener
    let adminOrdersUnsubscribe = null;

    // Admin tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.querySelectorAll('.admin-panel-screen').forEach(p => p.classList.remove('active-sub'));
            document.getElementById('admin-panel-' + target).classList.add('active-sub');

            if (target === 'orders') {
                if (!adminOrdersUnsubscribe) {
                    adminOrdersUnsubscribe = db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(() => {
                        if (Router.getCurrent() === 'admin' && target === 'orders') {
                            UI.renderAdminOrders();
                        }
                    });
                }
                UI.renderAdminOrders();
            } else {
                if (adminOrdersUnsubscribe) {
                    adminOrdersUnsubscribe();
                    adminOrdersUnsubscribe = null;
                }
            }
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
