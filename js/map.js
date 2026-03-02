/* =========================================================
   map.js — Leaflet.js integration
   ========================================================= */
'use strict';

const MapManager = {
    _deliveryMap: null,
    _deliveryMarker: null,
    _adminMap: null,
    _adminMarker: null,

    // Default center: Mexico City
    DEFAULT_LAT: 19.4326,
    DEFAULT_LNG: -99.1332,

    initDeliveryMap() {
        if (this._deliveryMap) {
            this._deliveryMap.invalidateSize();
            return;
        }
        const map = L.map('delivery-map', { zoomControl: true }).setView([this.DEFAULT_LAT, this.DEFAULT_LNG], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', maxZoom: 19
        }).addTo(map);

        const icon = L.divIcon({
            html: '<div style="font-size:2rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">📍</div>',
            className: '', iconAnchor: [16, 36]
        });
        const marker = L.marker([this.DEFAULT_LAT, this.DEFAULT_LNG], { draggable: true, icon }).addTo(map);
        marker.bindPopup('<b>Arrástralo a tu ubicación</b>').openPopup();
        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            document.getElementById('coord-display').textContent = `📍 Lat: ${pos.lat.toFixed(5)}, Lng: ${pos.lng.toFixed(5)}`;
        });

        this._deliveryMap = map;
        this._deliveryMarker = marker;
    },

    getDeliveryCoords() {
        if (!this._deliveryMarker) return { lat: this.DEFAULT_LAT, lng: this.DEFAULT_LNG };
        const pos = this._deliveryMarker.getLatLng();
        return { lat: pos.lat, lng: pos.lng };
    },

    resetDeliveryMap() {
        if (this._deliveryMarker) {
            this._deliveryMarker.setLatLng([this.DEFAULT_LAT, this.DEFAULT_LNG]);
        }
    },

    initAdminMap(lat, lng) {
        const target = [lat || this.DEFAULT_LAT, lng || this.DEFAULT_LNG];
        if (this._adminMap) {
            this._adminMap.setView(target, 15);
            this._adminMarker.setLatLng(target);
            this._adminMap.invalidateSize();
            return;
        }
        setTimeout(() => {
            const map = L.map('admin-order-map').setView(target, 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors', maxZoom: 19
            }).addTo(map);
            const icon = L.divIcon({
                html: '<div style="font-size:2rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">🏠</div>',
                className: '', iconAnchor: [16, 36]
            });
            const marker = L.marker(target, { icon }).addTo(map);
            marker.bindPopup('<b>Ubicación del cliente</b>').openPopup();
            this._adminMap = map;
            this._adminMarker = marker;
        }, 100);
    },
};
