import express from "express";
import { getDashboardStats, analyzeInquiry, getAIChat } from "../Controllers/dashboard.controller.js";
import { verifyJWT } from "../Middleware/auth.middleware.js";

const router = express.Router();

// All dashboard routes are protected
router.use(verifyJWT);

router.get("/stats", getDashboardStats);
router.post("/analyze", analyzeInquiry);
router.post("/chat", getAIChat);

export default router;
