import express from "express";
import { getDashboardStats, analyzeInquiry } from "../Controllers/dashboard.controller.js";
import { verifyJWT } from "../Middleware/auth.middleware.js";

const router = express.Router();

// All dashboard routes are protected
router.use(verifyJWT);

router.get("/stats", getDashboardStats);
router.post("/analyze", analyzeInquiry);

export default router;
