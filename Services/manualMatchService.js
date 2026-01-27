import { db, admin } from "../Config/firebase.js";
import syncService from "./syncService.js";

class ManualMatchServices {

    constructor() {
        this.manualMatchCollection = db.collection("manualMatches");
    }

    async addManualMatch(match) {
        try {
            const matchWithTimestamps = {
                ...match,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            const docReference = await this.manualMatchCollection.add(matchWithTimestamps);
            const result = { id: docReference.id, ...matchWithTimestamps };
            // Push to Google Sheets
            await syncService.pushToSheet('Matches', result, 'add');
            return result;
        } catch (error) {
            console.error("Error inside addManualMatch method!", error);
            throw error;
        }
    }

    async getAllMatches() {
        try {
            const snapshot = await this.manualMatchCollection.orderBy('createdAt', 'desc').get();
            if (snapshot.empty) {
                return [];
            }
            const matches = [];
            snapshot.forEach(doc => {
                matches.push({ id: doc.id, ...doc.data() });
            });
            return matches;
        } catch (error) {
            console.error("Error inside getAllMatches method!", error);
            throw error;
        }
    }

    async updateManualMatch(id, data) {
        try {
            const updateData = {
                ...data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await this.manualMatchCollection.doc(id).update(updateData);
            const result = { id, ...updateData };
            // Push to Google Sheets
            await syncService.pushToSheet('Matches', result, 'update');
            return result;
        } catch (error) {
            console.error("Error inside updateManualMatch method!", error);
            throw error;
        }
    }

    async deleteManualMatch(id) {
        try {
            await this.manualMatchCollection.doc(id).delete();
            // Push to Google Sheets
            await syncService.pushToSheet('Matches', { id }, 'delete');
            return { id };
        } catch (error) {
            console.error("Error inside deleteManualMatch method!", error);
            throw error;
        }
    }
}

export default ManualMatchServices;
