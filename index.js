import 'dotenv/config';
import http from 'http';
import { initSocket } from './socket.js';
import app from "./app.js";
import syncService from './Services/syncService.js';

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);
const io = initSocket(server);

// Start Bidirectional Sync Polling (Every 25 seconds)
const SYNC_INTERVAL = 25 * 1000;
setInterval(() => {
    syncService.syncFromSheets(io).catch(err => console.error("Sync loop error:", err));
}, SYNC_INTERVAL);

// Initial sync on startup
syncService.syncFromSheets(io).catch(err => console.error("Initial sync error:", err));

server.listen(PORT, () => console.log("APP IS Running on: ", `http://localhost:${PORT}`));


