import googleSheetsService from "./googleSheetsService.js";
import { db } from "../Config/firebase.js";

class SyncService {
    /**
     * Get the linked Google Sheet URL for a specific module
     */
    async getLinkedSheet(moduleName) {
        try {
            const snapshot = await db.collection("repositories").get();
            if (snapshot.empty) return null;

            // Priority 1: Match by explicit category field
            let repo = snapshot.docs.find(doc => {
                const data = doc.data();
                return data.category && data.category.toLowerCase() === moduleName.toLowerCase();
            });

            // Priority 2: Fallback to fuzzy name match
            if (!repo) {
                repo = snapshot.docs.find(doc => {
                    const name = doc.data().name.toLowerCase();
                    return name.includes(moduleName.toLowerCase());
                });
            }

            return repo ? repo.data().url : null;
        } catch (error) {
            console.error(`Error finding sheet for ${moduleName}:`, error.message);
            return null;
        }
    }

    /**
     * Normalize module name to handle variations
     */
    normalizeModule(moduleName) {
        if (!moduleName) return 'generic';
        const m = moduleName.toLowerCase().trim();
        if (m.includes('match') || m.includes('manual match')) return 'manual matches';
        if (m.includes('inquiry') || m.includes('inquires') || m.includes('contact')) return 'inquiries';
        if (m.includes('booking') || m.includes('consultation')) return 'bookings';
        return m;
    }

    /**
     * Mapping Firestore data to Google Sheet row (Array)
     * Dynamic Fallback: If not hardcoded, it uses headers to map fields.
     */
    mapToRow(moduleName, data, headers = null) {
        const id = data.id || '';
        const module = this.normalizeModule(moduleName);

        // 1. Try hardcoded mappings first for legacy support/preferred order
        switch (module) {
            case 'manual matches':
                return [id, data.parentName || data.name || '', data.phoneNumber || data.phone || '', data.subject || '', data.gradeLevel || '', data.status || 'Pending', data.dateAdded || data.createdAt || new Date().toLocaleString()];
            case 'inquiries':
                return [id, data.name || data.parentName || '', data.email || '', data.phone || data.phoneNumber || '', data.subject || '', data.message || '', data.date || data.createdAt || new Date().toLocaleString(), data.status || 'Pending'];
            case 'bookings':
                return [id, data.parentName || data.name || '', data.childName || '', data.email || '', data.phone || data.phoneNumber || '', data.date || '', data.time || '', data.topic || '', data.status || 'Pending'];
        }

        // 2. Dynamic Fallback: If headers are provided, map data to columns
        if (headers && headers.length > 0) {
            return headers.map(header => {
                if (header.toLowerCase() === 'id') return id;
                // Try to find a field that matches the header (case-insensitive)
                const fieldKey = Object.keys(data).find(k => k.toLowerCase() === header.toLowerCase().replace(/\s+/g, ''));
                if (fieldKey) return data[fieldKey] !== undefined ? data[fieldKey] : '';

                // Fallback: try common mappings
                if (header.toLowerCase().includes('name')) return data.name || data.parentName || '';
                if (header.toLowerCase().includes('phone')) return data.phone || data.phoneNumber || '';
                if (header.toLowerCase().includes('date')) return data.date || data.createdAt || '';

                return '';
            });
        }

        // 3. Last Resort: Just ID and Stringified JSON
        return [id, JSON.stringify(data)];
    }

    /**
     * Mapping Google Sheet row back to Firestore object
     */
    mapFromRow(moduleName, row, headers = null) {
        if (!row || row.length === 0) return null;
        const id = row[0];
        const module = this.normalizeModule(moduleName);

        // 1. Hardcoded support
        switch (module) {
            case 'manual matches':
                return { id, parentName: row[1] || '', phoneNumber: row[2] || '', subject: row[3] || '', gradeLevel: row[4] || '', status: row[5] || 'Pending', dateAdded: row[6] || new Date().toLocaleString() };
            case 'inquiries':
                return { id, name: row[1] || '', email: row[2] || '', phone: row[3] || '', subject: row[4] || '', message: row[5] || '', date: row[6] || new Date().toLocaleString(), status: row[7] || 'Pending' };
            case 'bookings':
                return { id, parentName: row[1] || '', childName: row[2] || '', email: row[3] || '', phone: row[4] || '', date: row[5] || '', time: row[6] || '', topic: row[7] || '', status: row[8] || 'Pending' };
        }

        // 2. Dynamic Fallback: Map columns to keys based on headers
        if (headers && headers.length > 0) {
            const obj = { id };
            headers.forEach((header, index) => {
                if (header.toLowerCase() === 'id') return;
                const key = header.toLowerCase().replace(/\s+/g, ''); // "Parent Name" -> "parentname"
                obj[key] = row[index] || '';
            });
            return obj;
        }

        return { id, rawData: row.slice(1) };
    }

    getHeaders(moduleName, firstDataItem = null) {
        const module = this.normalizeModule(moduleName);
        switch (module) {
            case 'manual matches':
                return ['ID', 'Parent Name', 'Phone Number', 'Subject', 'Grade Level', 'Status', 'Date Added'];
            case 'inquiries':
                return ['ID', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Date', 'Status'];
            case 'bookings':
                return ['ID', 'Parent Name', 'Child Name', 'Email', 'Phone', 'Date', 'Time', 'Topic', 'Status'];
        }

        // Dynamic Header Generation from Data
        if (firstDataItem) {
            const keys = Object.keys(firstDataItem).filter(k => k !== 'id');
            return ['ID', ...keys.map(k => k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1').trim())];
        }

        return ['ID', 'Created At', 'Data'];
    }

    getCollectionName(moduleOrRepo) {
        const category = (moduleOrRepo.category || '').toLowerCase().trim();
        const name = (moduleOrRepo.name || '').toLowerCase().trim();

        if (category.includes('inquiry') || category.includes('contact')) return 'contacts';
        if (category.includes('booking') || category.includes('consultation')) return 'bookings';
        if (category.includes('match')) return 'manualMatches';

        if (name.includes('inquiry') || name.includes('contact')) return 'contacts';
        if (name.includes('booking') || name.includes('consultation')) return 'bookings';
        if (name.includes('match') || name.includes('manual match')) return 'manualMatches';

        // Robust Fallback: Use the category or name directly as the collection name if it doesn't match known patterns
        return category || name || null;
    }

    async syncFromSheets(io) {
        try {
            const repositories = await db.collection("repositories").get();
            if (repositories.empty) return;

            for (const doc of repositories.docs) {
                const repo = doc.data();
                const spreadsheetId = googleSheetsService.extractSpreadsheetId(repo.url);
                if (!spreadsheetId) continue;

                const collectionName = this.getCollectionName(repo);
                if (!collectionName) continue;


                let sheetData = await googleSheetsService.getSheetData(spreadsheetId);

                // Get sample from firestore to generate headers if sheet is empty
                const firestoreSample = await db.collection(collectionName).limit(1).get();
                const sampleData = !firestoreSample.empty ? firestoreSample.docs[0].data() : null;
                const headers = this.getHeaders(repo.category || repo.name, sampleData);

                const currentRows = (sheetData && sheetData.length > 0) ? sheetData : [headers];
                const activeHeaders = currentRows[0];
                const rows = currentRows.slice(1);
                const sheetIds = new Set(rows.map(row => row[0]).filter(id => id && id.trim() !== ""));

                // Phase 1: Sheet -> db
                if (sheetData && sheetData.length > 1) {
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        const rowIndex = i + 2;
                        let rowId = row[0];

                        if (!rowId || rowId.trim() === "") {
                            const docRef = db.collection(collectionName).doc();
                            rowId = docRef.id;
                            row[0] = rowId;
                            const rowObj = this.mapFromRow(repo.category || repo.name, row, activeHeaders);
                            if (!rowObj) continue;
                            await docRef.set({ ...rowObj, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() });
                            await googleSheetsService.updateRowByIndex(spreadsheetId, rowIndex, row);
                            sheetIds.add(rowId);
                            if (io) io.emit("data_updated", { module: collectionName, action: 'add', data: { ...rowObj, id: rowId } });
                            continue;
                        }

                        const rowObj = this.mapFromRow(repo.category || repo.name, row, activeHeaders);
                        const docRef = db.collection(collectionName).doc(rowId);
                        const existingDoc = await docRef.get();

                        if (existingDoc.exists) {
                            const existingData = existingDoc.data();
                            const hasChanged = Object.keys(rowObj).some(key => key !== 'id' && JSON.stringify(existingData[key]) !== JSON.stringify(rowObj[key]));
                            if (hasChanged) {
                                await docRef.update({ ...rowObj, updatedAt: new Date().toISOString() });
                                if (io) io.emit("data_updated", { module: collectionName, action: 'update', data: { ...rowObj, id: rowId } });
                            }
                        } else {
                            await docRef.set({ ...rowObj, updatedAt: new Date().toISOString() });
                            if (io) io.emit("data_updated", { module: collectionName, action: 'add', data: { ...rowObj, id: rowId } });
                        }
                    }
                }

                // Phase 2: db -> Sheet
                const firestoreSnapshot = await db.collection(collectionName).get();
                if (!firestoreSnapshot.empty) {
                    await googleSheetsService.ensureHeader(spreadsheetId, headers);
                    for (const fsDoc of firestoreSnapshot.docs) {
                        if (!sheetIds.has(fsDoc.id)) {
                            const fsData = { id: fsDoc.id, ...fsDoc.data() };
                            const rowData = this.mapToRow(repo.category || repo.name, fsData, headers);
                            await googleSheetsService.appendRow(spreadsheetId, rowData);
                            sheetIds.add(fsDoc.id);
                        }
                    }
                }
                await doc.ref.update({ lastSync: new Date().toISOString() });
            }
        } catch (error) {
            console.error("❌ Sync Error:", error);
        }
    }

    /**
     * Push a single document change to the linked Google Sheet
     */
    async pushToSheet(moduleName, data, action) {
        try {
            const url = await this.getLinkedSheet(moduleName);
            if (!url) {
                console.warn(`⚠️ No sheet linked for module: ${moduleName}`);
                return;
            }

            const spreadsheetId = googleSheetsService.extractSpreadsheetId(url);
            if (!spreadsheetId) {
                console.error(`❌ Invalid Spreadsheet URL for ${moduleName}: ${url}`);
                return;
            }

            const headers = this.getHeaders(moduleName, data);
            const rowData = this.mapToRow(moduleName, data, headers);

            switch (action) {
                case 'add':
                    // Use updateRow instead of appendRow to prevent duplication if ID already exists
                    await googleSheetsService.updateRow(spreadsheetId, data.id, rowData);
                    break;
                case 'update':
                    await googleSheetsService.updateRow(spreadsheetId, data.id, rowData);
                    break;
                case 'delete':
                    await googleSheetsService.deleteRow(spreadsheetId, data.id);
                    break;
                default:
                    console.warn(`⚠️ Unknown action type: ${action}`);
            }
        } catch (error) {
            console.error(`❌ Push to sheet failed for ${moduleName}:`, error.message);
            // We don't throw to prevent crashing the main DB operation
        }
    }
}

export default new SyncService();
