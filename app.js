import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import consultationRoutes from "./Routes/consultation.routes.js";
import contactRoutes from "./Routes/contact.routes.js";
import manualMatchRoutes from "./Routes/manualMatch.routes.js";
import repositoryRoutes from "./Routes/repository.routes.js";
import dashboardRoutes from "./Routes/dashboard.routes.js";
import authRoutes from "./Routes/auth.routes.js";
import { errorHandler } from "./Middleware/errorHandler.js";
import { validateEnv } from "./Config/envValidation.js";
import { cleanObject } from "./Utils/dataUtils.js";

// Validate environment before anything else
validateEnv();

const app = express();

// Security Middlewares
app.use(helmet());

const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_DASHBOARD_URL,
    "https://right-tutor-admin-g5ie98fa2-akshay-kumars-projects-a1de1509.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080"
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            origin.includes('localhost') ||
            process.env.NODE_ENV === "development";

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(limiter);

// Limits to prevent large payload attacks
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Clean all request bodies for Firestore compatibility (strips undefined)
app.use((req, res, next) => {
    if (req.body) req.body = cleanObject(req.body);
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: "UP",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routing 
app.use("/api/v1/consultation", consultationRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/manual-match", manualMatchRoutes);
app.use("/api/v1/repository", repositoryRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/auth", authRoutes);

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RightTutor API | Documentation</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --primary: #FF850A;
                    --secondary: #212121;
                    --background: #0A0A0A;
                    --card: #141414;
                    --text: #E0E0E0;
                    --text-dim: #A0A0A0;
                    --border: rgba(255, 255, 255, 0.05);
                    --code-bg: #1e1e1e;
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Outfit', sans-serif;
                    background-color: var(--background);
                    color: var(--text);
                    line-height: 1.6;
                }
                .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
                header {
                    text-align: center;
                    padding: 4rem 0 2rem;
                    background: radial-gradient(circle at center, rgba(255, 133, 10, 0.1) 0%, transparent 70%);
                }
                .logo {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    color: var(--primary);
                }
                h1 { font-size: 1.5rem; color: var(--text-dim); font-weight: 400; margin-bottom: 1rem; }
                .summary { max-width: 700px; margin: 0 auto; color: var(--text-dim); text-align: center; font-size: 1.1rem; }
                
                h2 { font-size: 1.25rem; color: var(--primary); margin: 3rem 0 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }

                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .card {
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 1.25rem;
                    padding: 1.5rem;
                    transition: all 0.3s ease;
                }
                .card:hover {
                    border-color: var(--primary);
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(255, 133, 10, 0.1);
                }
                .tag {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    border-radius: 2rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-bottom: 1rem;
                }
                .tag-post { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .tag-get { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .tag-put { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                
                .path { font-family: monospace; color: var(--primary); font-weight: 600; margin-bottom: 0.5rem; display: block; }
                .desc { color: var(--text-dim); font-size: 0.9rem; }
                
                .model-card {
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 1.25rem;
                    padding: 1.5rem;
                }
                .model-title { color: var(--text); font-weight: 600; margin-bottom: 1rem; }
                pre {
                    background: var(--code-bg);
                    padding: 1rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 0.85rem;
                    color: #d4d4d4;
                }
                .key { color: #9cdcfe; }
                .string { color: #ce9178; }
                .number { color: #b5cea8; }

                footer {
                    text-align: center;
                    padding: 3rem;
                    margin-top: 3rem;
                    border-top: 1px solid var(--border);
                }
                .status { 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 0.5rem; 
                    font-size: 0.875rem; 
                    color: #10b981; 
                    background: rgba(16, 185, 129, 0.1);
                    padding: 0.5rem 1rem;
                    border-radius: 2rem;
                    margin-top: 1rem;
                }
                .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
            </style>
        </head>
        <body>
            <header>
                <div class="container">
                    <div class="logo">RightTutor API v1.0</div>
                    <h1>Centralized Educational Management Ecosystem</h1>
                    <p class="summary">
                        This API serves as the backend backbone for the RightTutor platform, orchestrating real-time student enrollments, 
                        tutor matching, and intelligent dashboard analytics. It leverages Firestore for persistence and 
                        Google's Gemini AI for deep data insights.
                    </p>
                    <div class="status">
                        <span class="dot"></span> System Operational
                    </div>
                </div>
            </header>

            <div class="container">
                <h2>Explore Endpoints</h2>
                <div class="grid">
                    <div class="card">
                        <span class="tag tag-post">Post</span>
                        <span class="path">/api/v1/consultation</span>
                        <p class="desc">Schedules professional consultations and creates initial contact records.</p>
                    </div>
                    <div class="card">
                        <span class="tag tag-get">Get</span>
                        <span class="path">/api/v1/dashboard/stats</span>
                        <p class="desc">Returns cached (5min) analytics for enrollment counts and resolution rates.</p>
                    </div>
                    <div class="card">
                        <span class="tag tag-post">Post</span>
                        <span class="path">/api/v1/dashboard/chat</span>
                        <p class="desc">AI Chat interface with full access to Contact, Booking, and Match databases.</p>
                    </div>
                    <div class="card">
                        <span class="tag tag-get">Get</span>
                        <span class="path">/api/v1/repository</span>
                        <p class="desc">Triggers sync operations between Firestore and Google Sheets.</p>
                    </div>
                </div>

                <h2>Key Data Models</h2>
                <div class="grid">
                    <div class="model-card">
                        <div class="model-title">Contact / Inquiry Object</div>
                        <pre>
{
  <span class="key">"name"</span>: <span class="string">"Jane Doe"</span>,
  <span class="key">"email"</span>: <span class="string">"jane@example.com"</span>,
  <span class="key">"subject"</span>: <span class="string">"Mathematics"</span>,
  <span class="key">"message"</span>: <span class="string">"Looking for grade 10 tutor..."</span>,
  <span class="key">"status"</span>: <span class="string">"Resolved"</span>,
  <span class="key">"createdAt"</span>: <span class="string">"2024-03-15T10:00:00Z"</span>
}</pre>
                    </div>
                    
                    <div class="model-card">
                        <div class="model-title">Booking Object</div>
                        <pre>
{
  <span class="key">"studentName"</span>: <span class="string">"Alex Smith"</span>,
  <span class="key">"tutorName"</span>: <span class="string">"Dr. Sarah Brown"</span>,
  <span class="key">"subject"</span>: <span class="string">"Physics"</span>,
  <span class="key">"classTime"</span>: <span class="string">"2024-03-20T14:30:00Z"</span>,
  <span class="key">"status"</span>: <span class="string">"Scheduled"</span>
}</pre>
                    </div>
                </div>

                <footer>
                    <p class="desc">© 2026 RightTutor Ecosystem. All rights reserved.</p>
                    <p class="desc" style="margin-top: 0.5rem; font-size: 0.75rem;">Proprietary & Confidential</p>
                </footer>
            </div>
        </body>
        </html>
    `);
});

// Global error handler
app.use(errorHandler);

export default app;
