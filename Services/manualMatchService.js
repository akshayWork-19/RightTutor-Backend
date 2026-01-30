import { db, admin } from "../Config/firebase.js";
import syncService from "./syncService.js";
import { cache } from "../Utils/cache.js";

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
            try {
                await syncService.pushToSheet('Matches', result, 'add');
            } catch (sheetError) {
                console.warn("⚠️ Google Sheets Sync Failed (Match was saved):", sheetError.message);
            }

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'manualMatches', action: 'add', data: result });
            } catch (err) { }

            // Invalidate dashboard stats cache
            cache.delete("dashboard_stats");
            cache.delete("full_database_context");

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
            try {
                await syncService.pushToSheet('Matches', result, 'update');
            } catch (sheetError) {
                console.warn("⚠️ Google Sheets Sync Failed (Match update):", sheetError.message);
            }

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'manualMatches', action: 'update', data: result });
            } catch (err) { }

            // Invalidate dashboard stats cache
            cache.delete("dashboard_stats");
            cache.delete("full_database_context");

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
            try {
                await syncService.pushToSheet('Matches', { id }, 'delete');
            } catch (sheetError) {
                console.warn("⚠️ Google Sheets Sync Failed (Match deletion):", sheetError.message);
            }

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'manualMatches', action: 'delete', id });
            } catch (err) { }

            // Invalidate dashboard stats cache
            cache.delete("dashboard_stats");
            cache.delete("full_database_context");

            return { id };
        } catch (error) {
            console.error("Error inside deleteManualMatch method!", error);
            throw error;
        }
    }
}

export default ManualMatchServices;
