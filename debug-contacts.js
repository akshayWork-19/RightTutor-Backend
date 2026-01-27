import 'dotenv/config';
import googleSheetsService from './Services/googleSheetsService.js';
import { google } from 'googleapis';

const spreadsheetId = '1gtdlg5hcK7FTcMzAPwcvEt9tLkmvV7mGN0ov8tB_4Zk';

async function debugSheet() {
    console.log(`🔍 Debugging Spreadsheet: ${spreadsheetId}`);
    try {
        const auth = googleSheetsService._getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Get Spreadsheet Metadata
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        console.log(`📘 Spreadsheet Title: "${spreadsheet.data.properties.title}"`);
        console.log(`📑 Sheets found in this spreadsheet:`);
        spreadsheet.data.sheets.forEach((sheet, index) => {
            console.log(`${index}: ${sheet.properties.title} (ID: ${sheet.properties.sheetId})`);
        });

        const firstSheetName = spreadsheet.data.sheets[0].properties.title;
        console.log(`\n📊 Attempting to read from first sheet: "${firstSheetName}"`);

        // 2. Get Data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: firstSheetName,
        });

        const values = response.data.values || [];
        console.log(`✅ Retrieved ${values.length} rows.`);

        if (values.length > 0) {
            console.log("📝 First row (headers):", values[0]);
            if (values.length > 1) {
                console.log("📝 Second row (first data):", values[1]);
            }
        } else {
            console.log("❌ The sheet appears to be empty.");
        }

    } catch (error) {
        console.error("❌ Debug failed:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

debugSheet();
