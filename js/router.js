/* =========================================================
   router.js — Screen navigation
   ========================================================= */
'use strict';

const Router = {
    _current: null,

    _publicScreens: ['login', 'register', 'recover'],
    _clientScreens: ['menu', 'cart', 'delivery', 'tracking', 'profile'],
    _adminScreens: ['admin'],

    navigate(screenId, force = false) {
        const user = Auth.getCurrentUser();

        // Auth guard
        if (!user && !this._publicScreens.includes(screenId)) {
            return this.navigate('login');
        }
        // Role guard: clients can't access admin
        if (user && user.role === 'client' && this._adminScreens.includes(screenId)) {
            return this.navigate('menu');
        }
        // Role guard: admins go to admin panel
        if (user && user.role === 'admin' && this._clientScreens.includes(screenId)) {
            return this.navigate('admin');
        }

        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        const screen = document.getElementById('screen-' + screenId);
        if (!screen) return;
        screen.classList.add('active');
        this._current = screenId;
        window.scrollTo(0, 0);

        // Lifecycle hooks
        if (screenId === 'menu') UI.renderMenu();
        if (screenId === 'cart') UI.renderCart();
        if (screenId === 'delivery') { setTimeout(() => MapManager.initDeliveryMap(), 200); }
        if (screenId === 'tracking') UI.renderTracking();
        if (screenId === 'profile') UI.renderProfile();
        if (screenId === 'admin') UI.renderAdminOrders();

        window.location.hash = screenId;
    },

    getCurrent() { return this._current; },
};
