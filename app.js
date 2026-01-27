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

// Validate environment before anything else
validateEnv();

const app = express();

// Security Middlewares
app.use(helmet());

const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_DASHBOARD_URL,
    "http://localhost:3000",
    "http://localhost:5173"
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development") {
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
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

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
    res.status(200).json({ message: "RightTutor API is Working!" });
});

// Global error handler
app.use(errorHandler);

export default app;
