/* =========================================================
   ui.js — All rendering functions
   ========================================================= */
'use strict';

const UI = {
  /* ── TOAST ── */
  toast(msg, type = 'default', duration = 3000) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️', default: '🔔' };
    t.innerHTML = `<span>${icons[type] || icons.default}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => t.remove(), 300);
    }, duration);
  },

  /* ── MODAL ── */
  openModal(htmlContent) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-body').innerHTML = htmlContent;
    overlay.classList.add('open');
  },
  closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
  },

  /* ── CART BADGE ── */
  updateCartBadge() {
    const count = Cart.getCount();
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  /* ── MENU ── */
  async renderMenu(filterCategory = 'all') {
    const user = Auth.getCurrentUser();
    if (user) document.getElementById('menu-user-name').textContent = `¡Hola, ${user.name.split(' ')[0]}! 👋`;

    const grid = document.getElementById('products-grid');
    grid.innerHTML = '<div style="text-align:center;padding:40px;width:100%;color:var(--text-light)"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Cargando menú...</p></div>';

    const products = await DB.getActiveProducts(); // Async call to Firestore
    const filtered = filterCategory === 'all' ? products : products.filter(p => p.category === filterCategory);

    if (!filtered.length) {
      grid.innerHTML = '<div style="text-align:center;padding:40px;width:100%;color:var(--text-light)">No hay productos en esta categoría.</div>';
    } else {
      grid.innerHTML = filtered.map(p => {
        const cartItem = Cart.getItems().find(i => i.productId === p.id);
        const count = cartItem ? cartItem.qty : 0;
        return `
          <div class="product-card" data-product-id="${p.id}">
            <span class="product-emoji">${p.emoji}</span>
            <div class="product-body">
              <div class="product-name">${p.name}</div>
              <div class="product-desc">${p.description}</div>
              <div class="product-footer">
                <span class="product-price">$${p.price}</span>
                ${count > 0
            ? `<div class="qty-control-inline">
                       <button class="qty-btn minus" data-action="decrease" data-id="${p.id}">−</button>
                       <span class="qty-value">${count}</span>
                       <button class="qty-btn plus" data-action="increase" data-id="${p.id}">+</button>
                     </div>`
            : `<button class="btn-add" data-action="add" data-id="${p.id}"><i class="fa-solid fa-plus"></i></button>`
          }
              </div>
            </div>
          </div>`;
      }).join('');
    }

    this.updateCartBadge();
  },

  /* ── PROFILE ── */
  renderProfile() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    document.getElementById('profile-greeting').textContent = `Hola, ${user.name.split(' ')[0]}`;
    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-phone').value = user.phone || '';
    document.getElementById('profile-address').value = user.address || '';
    document.getElementById('profile-colonia').value = user.colonia || '';
    document.getElementById('profile-email').value = user.email || '';
  },

  /* ── CART ── */
  renderCart() {
    const items = Cart.getItems();
    const cartEmpty = document.getElementById('cart-empty');
    const cartItems = document.getElementById('cart-items-list');
    const cartSummary = document.getElementById('cart-summary');
    const confirmBtn = document.getElementById('btn-confirm-order');

    if (items.length === 0) {
      cartEmpty.classList.remove('hidden');
      cartItems.classList.add('hidden');
      cartSummary.classList.add('hidden');
    } else {
      cartEmpty.classList.add('hidden');
      cartItems.classList.remove('hidden');
      cartSummary.classList.remove('hidden');

      cartItems.innerHTML = items.map(item => `
        <div class="cart-item">
          <span class="cart-item-emoji">${item.emoji}</span>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${item.price} c/u</div>
          </div>
          <div class="qty-control">
            <button class="qty-btn minus" data-action="cart-decrease" data-id="${item.productId}">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn plus" data-action="cart-increase" data-id="${item.productId}">+</button>
          </div>
          <div class="cart-item-subtotal">$${item.price * item.qty}</div>
        </div>`).join('');

      const total = Cart.getTotal();
      document.getElementById('cart-subtotal').textContent = `$${total}`;
      document.getElementById('cart-total').textContent = `$${total}`;
    }
    this.updateCartBadge();
  },

  /* ── TRACKING ── */
  async renderTracking() {
    const order = window._currentUserOrder;
    if (!order) return;

    const fresh = order;

    document.getElementById('tracking-order-num').textContent = fresh.id;
    document.getElementById('tracking-eta').textContent =
      fresh.status === 'delivered' ? '¡Tu pedido ha llegado!' : 'Tiempo estimado: 30-45 min';

    const steps = [
      { key: 'received', title: 'Pedido Recibido', desc: 'Tu pedido fue confirmado.', icon: 'fa-clipboard-check' },
      { key: 'preparing', title: 'En Preparación', desc: 'El equipo está cocinando.', icon: 'fa-fire-burner' },
      { key: 'onway', title: 'En Camino', desc: 'El repartidor va en ruta.', icon: 'fa-motorcycle' },
      { key: 'delivered', title: 'Entregado', desc: '¡Buen provecho!', icon: 'fa-house-circle-check' },
    ];
    const currentIdx = Orders.getStatusIndex(fresh.status);
    const stepper = document.getElementById('tracking-stepper');
    stepper.innerHTML = steps.map((s, idx) => {
      const state = idx < currentIdx ? 'done' : idx === currentIdx ? 'active' : 'pending';
      return `
      <div class="step-item ${state}">
        <div class="step-icon"><i class="fa-solid ${s.icon}"></i></div>
        <div class="step-content">
          <div class="step-title">${s.title}</div>
          <div class="step-desc">${s.desc}</div>
        </div>
      </div>`;
    }).join('');

    // Order summary
    document.getElementById('tracking-items').innerHTML =
      fresh.items.map(i => `
        <div class="tracking-item-row">
          <span>${i.emoji} ${i.name} ×${i.qty}</span>
          <span>$${i.price * i.qty}</span>
        </div>`).join('');
    document.getElementById('tracking-total').textContent = `$${fresh.total}`;
    document.getElementById('tracking-address').textContent = fresh.address;
  },

  /* ── CLIENT ORDERS HISTORY ── */
  async renderClientOrders() {
    const list = document.getElementById('client-orders-list');
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light)"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Cargando pedidos...</p></div>';

    const user = Auth.getCurrentUser();
    if (!user) return;

    const orders = await Orders.getByUser(user.id);
    if (!orders.length) {
      list.innerHTML = `<div class="empty-state">
        <div style="font-size:3rem;text-align:center;opacity:.3;padding:40px 0">📋</div>
        <p style="text-align:center;color:var(--text-muted)">Aún no tienes pedidos</p></div>`;
      return;
    }
    list.innerHTML = orders.map(o => {
      const info = Orders.getStatusInfo(o.status);
      const time = new Date(o.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      return `
      <div class="order-card status-${o.status}" data-action="view-client-order" data-id="${o.id}">
        <div class="order-card-header">
          <span class="order-id">${o.id}</span>
          <span class="order-time">${time}</span>
        </div>
        <div class="order-detail-item-row" style="margin-top:5px; margin-bottom: 10px; font-size: 0.9em; opacity: 0.8">
            ${o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
        </div>
        <div class="order-card-footer">
          <span class="order-total">$${o.total}</span>
          <span class="status-badge ${o.status}">${info.label}</span>
        </div>
      </div>`;
    }).join('');
  },

  /* ── ADMIN ORDERS ── */
  async renderAdminOrders() {
    const list = document.getElementById('admin-orders-list');
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light)"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Cargando pedidos...</p></div>';

    const orders = await Orders.getAll();
    if (!orders.length) {
      list.innerHTML = `<div class="empty-state">
        <div style="font-size:3rem;text-align:center;opacity:.3;padding:40px 0">📋</div>
        <p style="text-align:center;color:var(--text-muted)">No hay pedidos aún</p></div>`;
      return;
    }
    list.innerHTML = orders.map(o => {
      const info = Orders.getStatusInfo(o.status);
      const time = new Date(o.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      return `
      <div class="order-card status-${o.status}" data-action="view-order" data-id="${o.id}">
        <div class="order-card-header">
          <span class="order-id">${o.id}</span>
          <span class="order-time">${time}</span>
        </div>
        <div class="order-customer"><i class="fa-solid fa-user"></i> ${o.userName} &nbsp;|&nbsp; <i class="fa-solid fa-phone"></i> ${o.userPhone}</div>
        <div class="order-card-footer">
          <span class="order-total">$${o.total}</span>
          <span class="status-badge ${o.status}">${info.label}</span>
        </div>
      </div>`;
    }).join('');
  },

  /* ── ADMIN ORDER DETAIL MODAL ── */
  async openOrderDetail(orderId) {
    const order = await Orders.getById(orderId);
    if (!order) return;
    window._currentAdminOrder = order;

    const info = Orders.getStatusInfo(order.status);
    const statusOptions = Orders.getAllStatuses().map(s =>
      `<option value="${s}" ${s === order.status ? 'selected' : ''}>${Orders.getStatusInfo(s).label}</option>`
    ).join('');

    const itemsHtml = order.items.map(i =>
      `<div class="order-detail-item-row"><span>${i.emoji} ${i.name} ×${i.qty}</span><span>$${i.price * i.qty}</span></div>`
    ).join('');

    this.openModal(`
      <div class="order-detail-section">
        <div class="order-detail-label">Cliente</div>
        <div class="order-detail-value"><b>${order.userName}</b><br>${order.userPhone}<br>${order.userEmail}</div>
      </div>
      <div class="order-detail-section">
        <div class="order-detail-label">Dirección</div>
        <div class="order-detail-value">${order.address}<br><small style="color:var(--text-light)">${order.reference || 'Sin referencia'}</small></div>
      </div>
      <div class="order-detail-section">
        <div class="order-detail-label" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span>Ubicación en Mapa</span>
          ${order.coords ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${order.coords.lat},${order.coords.lng}" target="_blank" class="btn btn-primary btn-sm" style="padding:6px 12px;font-size:0.75rem;text-decoration:none;"><i class="fa-solid fa-location-arrow"></i> Navegar</a>` : ''}
        </div>
        <div id="admin-order-map"></div>
      </div>
      <div class="order-detail-section">
        <div class="order-detail-label">Productos</div>
        ${itemsHtml}
        <div class="order-total-row"><b>Total: $${order.total}</b></div>
      </div>
      <div class="order-detail-section">
        <div class="order-detail-label">Cambiar Estado</div>
        <select class="status-select" id="status-select-modal">
          ${statusOptions}
        </select>
      </div>
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button class="btn btn-primary" id="btn-save-status" style="flex:1">Guardar Estado</button>
        <button class="btn btn-success btn-sm" id="btn-mark-delivered" style="color:white;background:var(--success-dark);border:none;padding:12px 16px;border-radius:12px;font-weight:700;cursor:pointer;white-space:nowrap">✅ Entregado</button>
      </div>
    `);

    // Initialize admin map
    if (order.coords) {
      MapManager.initAdminMap(order.coords.lat, order.coords.lng);
    }
  },

  /* ── ADMIN PRODUCTS ── */
  async renderAdminProducts() {
    const list = document.getElementById('admin-products-list');
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light)"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Cargando productos...</p></div>';

    const products = await Products.getAll();
    list.innerHTML = products.map(p => `
      <div class="prod-manage-card ${p.active ? '' : 'prod-inactive'}" data-product-id="${p.id}">
        <span class="prod-manage-emoji">${p.emoji}</span>
        <div class="prod-manage-info">
          <div class="prod-manage-name">${p.name}</div>
          <div class="prod-manage-price">$${p.price}</div>
          <div class="prod-manage-cat">${Products.getCategoryLabel(p.category)}</div>
        </div>
        <div class="prod-manage-actions">
          <button class="btn btn-ghost btn-sm" data-action="edit-product" data-id="${p.id}" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <label class="toggle-switch" title="${p.active ? 'Desactivar' : 'Activar'}">
            <input type="checkbox" ${p.active ? 'checked' : ''} data-action="toggle-product" data-id="${p.id}">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>`).join('');
  },

  /* ── ADMIN SUMMARY ── */
  async renderAdminSummary() {
    const todayOrders = await Orders.getTodayOrders();
    const total = await Orders.getTodayTotal();
    const topProducts = await Orders.getTopProducts();
    const delivered = todayOrders.filter(o => o.status === 'delivered').length;

    document.getElementById('summary-total').textContent = `$${total}`;
    document.getElementById('summary-orders').textContent = todayOrders.length;
    document.getElementById('summary-delivered').textContent = delivered;
    document.getElementById('summary-pending').textContent = todayOrders.length - delivered;

    const topList = document.getElementById('summary-top-products');
    topList.innerHTML = topProducts.length
      ? topProducts.map(p => `
          <div class="top-item-row">
            <span>${p.name}</span>
            <span class="text-primary font-bold">${p.qty} pzas</span>
          </div>`).join('')
      : '<p style="color:var(--text-muted);font-size:.85rem;text-align:center;padding:12px 0">Sin ventas hoy todavía</p>';
  },

  /* ── PRODUCT FORM MODAL ── */
  openProductForm(productId = null) {
    const p = productId ? Products.getById(productId) : null;
    const catOptions = Products.CATEGORIES.map(c =>
      `<option value="${c.id}" ${p?.category === c.id ? 'selected' : ''}>${c.emoji} ${c.label}</option>`
    ).join('');

    this.openModal(`
      <h3 style="margin-bottom:20px">${p ? 'Editar Producto' : 'Agregar Producto'}</h3>
      <input type="hidden" id="edit-product-id" value="${productId || ''}">
      <div class="form-group">
        <label class="form-label">Nombre</label>
        <input class="form-input" id="prod-name" value="${p?.name || ''}" placeholder="Nombre del producto">
      </div>
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <input class="form-input" id="prod-desc" value="${p?.description || ''}" placeholder="Descripción breve">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Precio ($)</label>
          <input class="form-input" id="prod-price" type="number" value="${p?.price || ''}" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">Emoji</label>
          <input class="form-input" id="prod-emoji" value="${p?.emoji || '🍽️'}" placeholder="🍽️">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Categoría</label>
        <select class="form-input status-select" id="prod-category">${catOptions}</select>
      </div>
      <button class="btn btn-primary" id="btn-save-product" style="margin-top:8px">
        <i class="fa-solid fa-floppy-disk"></i> ${p ? 'Guardar Cambios' : 'Agregar Producto'}
      </button>
    `);
  },
};
