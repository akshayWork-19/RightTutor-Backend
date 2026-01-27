import { db, admin } from "../Config/firebase.js";
import syncService from "./syncService.js";

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
            await syncService.pushToSheet('Inquiries', result, 'add');

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { type: 'inquiry', action: 'add', data: result });
            } catch (err) {
                console.error("Socket emit failed", err.message);
            }

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
            await syncService.pushToSheet('Inquiries', result, 'update');
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
            await syncService.pushToSheet('Inquiries', { id }, 'delete');
            return { id };
        } catch (error) {
            console.error("Error inside deleteContact method!", error);
            throw error;
        }
    }
}

export default ContactServices;
