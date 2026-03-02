/* =========================================================
   auth.js — Authentication logic
   ========================================================= */
'use strict';

const Auth = {
    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const doc = await db.collection('users').doc(userCredential.user.uid).get();
            if (!doc.exists) return { ok: false, msg: 'Error: Datos de usuario no encontrados en base de datos.' };

            const userData = { id: userCredential.user.uid, ...doc.data() };
            DB.setSession(userData);
            return { ok: true, user: userData };
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                return { ok: false, msg: 'Correo o contraseña incorrectos.' };
            }
            return { ok: false, msg: 'Error al iniciar sesión: ' + error.message };
        }
    },

    async register(name, phone, email, password, address, colonia) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            const userData = {
                name: name.trim(),
                phone: phone.trim(),
                email: email.toLowerCase().trim(),
                address: address.trim(),
                colonia: colonia.trim(),
                role: email.toLowerCase().trim() === 'admin@pozole.mx' ? 'admin' : 'client',
                createdAt: new Date().toISOString()
            };

            await db.collection('users').doc(uid).set(userData);
            userData.id = uid;
            DB.setSession(userData);
            return { ok: true, user: userData };
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                return { ok: false, msg: 'Este correo ya está registrado.' };
            }
            return { ok: false, msg: 'Error al registrar: ' + error.message };
        }
    },

    async logout() {
        await auth.signOut();
        DB.clearSession();
    },

    async recoverPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { ok: true, msg: `Se envió un enlace de recuperación a ${email}` };
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                return { ok: false, msg: 'No existe una cuenta con ese correo.' };
            }
            return { ok: false, msg: 'Error al enviar recuperación.' };
        }
    },

    getCurrentUser() {
        return DB.getSession(); // We still use session storage for fast sync reads across the app
    },

    async updateProfile(name, phone, address, colonia) {
        let user = this.getCurrentUser();
        if (!user) return { ok: false };

        try {
            const data = {
                name: name.trim(),
                phone: phone.trim(),
                address: address.trim(),
                colonia: colonia.trim()
            };
            await db.collection('users').doc(user.id).update(data);

            // Update session
            user = { ...user, ...data };
            DB.setSession(user);
            return { ok: true, user };
        } catch (error) {
            console.error(error);
            return { ok: false };
        }
    },

    isAdmin() {
        const u = DB.getSession();
        return u && u.role === 'admin';
    }
};
