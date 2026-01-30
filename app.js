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
                    padding: 4rem 0;
                    background: radial-gradient(circle at center, rgba(255, 133, 10, 0.1) 0%, transparent 70%);
                }
                .logo {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    color: var(--primary);
                }
                h1 { font-size: 1.5rem; color: var(--text-dim); font-weight: 400; }
                
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-top: 3rem;
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
                .tag-delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

                .path { font-family: monospace; color: var(--primary); font-weight: 600; margin-bottom: 0.5rem; display: block; }
                .desc { color: var(--text-dim); font-size: 0.9rem; }
                
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
                .dot { width: 8px; hieght: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
            </style>
        </head>
        <body>
            <header>
                <div class="container">
                    <div class="logo">RightTutor Backend v1.0.0</div>
                    <h1>Centralized Educational Management Ecosystem API</h1>
                    <div class="status">
                        <span class="dot"></span> System Operational
                    </div>
                </div>
            </header>

            <div class="container">
                <div class="grid">
                    <div class="card">
                        <span class="tag tag-post">Post</span>
                        <span class="path">/api/v1/consultation</span>
                        <p class="desc">Engine for scheduling professional consultations and tutor match requests.</p>
                    </div>
                    <div class="card">
                        <span class="tag tag-get">Get</span>
                        <span class="path">/api/v1/dashboard/stats</span>
                        <p class="desc">Aggegrated real-time analytics for enrollment, inquiries, and throughput.</p>
                    </div>
                    <div class="card">
                        <span class="tag tag-post">Post</span>
                        <span class="path">/api/v1/dashboard/chat</span>
                        <p class="desc">AI-Powered insights using Gemini 1.5 Flash for child progress analysis.</p>
                    </div>
                    <div class="card">
                        <span class="tag tag-get">Get</span>
                        <span class="path">/api/v1/repository</span>
                        <p class="desc">Bi-directional Google Sheets synchronization and data persistence layer.</p>
                    </div>
                    <div class="card">
                        <span class="tag tag-post">Post</span>
                        <span class="path">/api/v1/auth/login</span>
                        <p class="desc">Secure JWT-based authentication for Administrative access.</p>
                    </div>
                    <div class="card">
                        <span class="tag tag-put">Put</span>
                        <span class="path">/api/v1/manual-match</span>
                        <p class="desc">Advanced tutor-to-student relationship management and tracking.</p>
                    </div>
                </div>

                <footer>
                    <p class="desc">© 2026 RightTutor Ecosystem. All rights reserved.</p>
                    <p class="desc" style="margin-top: 0.5rem; font-size: 0.75rem;">Proprietary & Confidential • Developed for Advanced Agentic Coding</p>
                </footer>
            </div>
        </body>
        </html>
    `);
});

// Global error handler
app.use(errorHandler);

export default app;
