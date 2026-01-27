import 'dotenv/config'; // Load env vars first
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

class GoogleSheetsService {
    constructor() {
        this.auth = null;
        this.sheets = null;
    }

    _getAuth() {
        if (this.auth) return this.auth;

        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '');
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

        if (!clientEmail || !privateKey) {
            throw new Error('Missing Google Sheets credentials in environment variables');
        }

        this.auth = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: SCOPES
        });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });

        return this.auth;
    }

    extractSpreadsheetId(url) {
        if (!url) return null;
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : null;
    }

    async getFirstSheetName(spreadsheetId) {
        this._getAuth();
        try {
            const spreadsheet = await this.sheets.spreadsheets.get({
                spreadsheetId,
            });
            return spreadsheet.data.sheets[0].properties.title;
        } catch (error) {
            console.error('Error fetching spreadsheet metadata:', error.message);
            throw error;
        }
    }

    async getSheetData(spreadsheetId, range) {
        this._getAuth();
        try {
            const finalRange = range || await this.getFirstSheetName(spreadsheetId);
            console.log(`📊 Fetching data from [${spreadsheetId}] Range: [${finalRange}]`);
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: finalRange,
            });
            const values = response.data.values || [];
            console.log(`✅ Retrieved ${values.length} rows from sheet.`);
            return values;
        } catch (error) {
            console.error(`Error fetching sheet data:`, error.message);
            throw error;
        }
    }

    async appendRow(spreadsheetId, rowData, range) {
        this._getAuth();
        try {
            const sheetName = range || await this.getFirstSheetName(spreadsheetId);
            // Using !A1 ensures it searches starting from the first column
            await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${sheetName}!A1`,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: [rowData],
                },
            });
        } catch (error) {
            console.error('Error appending row:', error.message);
            throw error;
        }
    }

    async updateRow(spreadsheetId, id, updatedRowData, range) {
        this._getAuth();
        try {
            const sheetName = range || await this.getFirstSheetName(spreadsheetId);
            const data = await this.getSheetData(spreadsheetId, sheetName);
            const rowIndex = data.findIndex(row => row[0] === id);

            if (rowIndex !== -1) {
                const sheetRowNumber = rowIndex + 1;
                await this.updateRowByIndex(spreadsheetId, sheetRowNumber, updatedRowData, sheetName);
            } else {
                await this.appendRow(spreadsheetId, updatedRowData, sheetName);
            }
        } catch (error) {
            console.error('Error updating row:', error.message);
            throw error;
        }
    }

    /**
     * Update a specific row by its 1-based index (e.g. 2 for the second row)
     */
    async updateRowByIndex(spreadsheetId, rowNumber, rowData, range) {
        this._getAuth();
        try {
            const sheetName = range || await this.getFirstSheetName(spreadsheetId);
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A${rowNumber}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [rowData],
                },
            });
        } catch (error) {
            console.error(`Error updating row by index ${rowNumber}:`, error.message);
            throw error;
        }
    }

    async deleteRow(spreadsheetId, id, range) {
        this._getAuth();
        try {
            const sheetName = range || await this.getFirstSheetName(spreadsheetId);
            const data = await this.getSheetData(spreadsheetId, sheetName);
            const rowIndex = data.findIndex(row => row[0] === id);

            if (rowIndex !== -1) {
                const sheetRowNumber = rowIndex + 1;
                await this.sheets.spreadsheets.values.clear({
                    spreadsheetId,
                    range: `${sheetName}!A${sheetRowNumber}:Z${sheetRowNumber}`,
                });
            }
        } catch (error) {
            console.error('Error clearing row:', error.message);
        }
    }

    async ensureHeader(spreadsheetId, headers) {
        this._getAuth();
        try {
            const sheetName = await this.getFirstSheetName(spreadsheetId);
            const data = await this.getSheetData(spreadsheetId, `${sheetName}!A1:1`);
            if (data.length === 0 || data[0].length === 0) {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetName}!A1`,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [headers],
                    },
                });
            }
        } catch (error) {
            console.error('Error ensuring header:', error.message);
            throw error;
        }
    }
}

export default new GoogleSheetsService();



