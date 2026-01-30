import { db, admin } from "../Config/firebase.js";
import syncService from "./syncService.js";
import { cache } from "../Utils/cache.js";

class ContactServices {

    constructor() {
        this.contactCollection = db.collection("contacts");
    }

    async addContact(contact) {
        try {
            const contactWithTimestamps = {
                ...contact,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            const docReference = await this.contactCollection.add(contactWithTimestamps);
            const result = { id: docReference.id, ...contactWithTimestamps };

            // Push to Google Sheets
            try {
                await syncService.pushToSheet('Inquiries', result, 'add');
            } catch (sheetError) {
                console.warn("⚠️ Google Sheets Sync Failed (Inquiry was saved):", sheetError.message);
            }

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'contacts', action: 'add', data: result });
            } catch (err) {
                console.error("Socket emit failed", err.message);
            }

            // Invalidate dashboard stats cache
            cache.delete("dashboard_stats");

            return result;
        } catch (error) {
            console.error("Error inside addContact method!", error);
            throw error;
        }
    }

    async getAllContacts() {
        try {
            const snapshot = await this.contactCollection.orderBy('createdAt', 'desc').get();
            if (snapshot.empty) {
                return [];
            }
            const contacts = [];
            snapshot.forEach(doc => {
                contacts.push({ id: doc.id, ...doc.data() });
            });
            return contacts;
        } catch (error) {
            console.error("Error inside getAllContacts method!", error);
            throw error;
        }
    }

    async updateContact(id, data) {
        try {
            const updateData = {
                ...data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await this.contactCollection.doc(id).update(updateData);
            const result = { id, ...updateData };
            // Push to Google Sheets
            try {
                await syncService.pushToSheet('Inquiries', result, 'update');
            } catch (sheetError) {
                console.warn("⚠️ Google Sheets Sync Failed (Contact update):", sheetError.message);
            }
            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'contacts', action: 'update', data: result });
            } catch (err) { }

            // Invalidate dashboard stats cache
            cache.delete("dashboard_stats");

            return result;
        } catch (error) {
            console.error("Error inside updateContact method!", error);
            throw error;
        }
    }

    async deleteContact(id) {
        try {
            await this.contactCollection.doc(id).delete();
            // Push to Google Sheets
            try {
                await syncService.pushToSheet('Inquiries', { id }, 'delete');
            } catch (sheetError) {
                console.warn("⚠️ Google Sheets Sync Failed (Contact deletion):", sheetError.message);
            }

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'contacts', action: 'delete', id });
            } catch (err) { }

            // Invalidate dashboard stats cache
            cache.delete("dashboard_stats");

            return { id };
        } catch (error) {
            console.error("Error inside deleteContact method!", error);
            throw error;
        }
    }
}

export default ContactServices;
