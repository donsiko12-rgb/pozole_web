/* =========================================================
   auth.js — Authentication logic
   ========================================================= */
'use strict';

const Auth = {
    login(email, password) {
        const user = DB.getUserByEmail(email);
        if (!user) return { ok: false, msg: 'Correo no registrado.' };
        if (user.password !== btoa(password)) return { ok: false, msg: 'Contraseña incorrecta.' };
        DB.setSession(user);
        return { ok: true, user };
    },

    register(name, phone, email, password) {
        if (DB.getUserByEmail(email)) return { ok: false, msg: 'Este correo ya está registrado.' };
        const user = {
            id: 'u_' + Date.now(),
            name: name.trim(),
            phone: phone.trim(),
            email: email.toLowerCase().trim(),
            password: btoa(password),
            role: 'client',
            createdAt: new Date().toISOString(),
        };
        DB.addUser(user);
        DB.setSession(user);
        return { ok: true, user };
    },

    logout() {
        DB.clearSession();
    },

    recoverPassword(email) {
        const user = DB.getUserByEmail(email);
        if (!user) return { ok: false, msg: 'No existe una cuenta con ese correo.' };
        // Simulated: in a real app, send an email
        return { ok: true, msg: `Se envió un enlace de recuperación a ${email}` };
    },

    getCurrentUser() {
        return DB.getSession();
    },

    updateProfile(name, phone) {
        let user = this.getCurrentUser();
        if (!user) return { ok: false };
        const updated = DB.updateUser(user.id, { name, phone });
        if (updated) {
            DB.setSession(updated);
            return { ok: true, user: updated };
        }
        return { ok: false };
    },

    isAdmin() {
        const u = DB.getSession();
        return u && u.role === 'admin';
    },
};
