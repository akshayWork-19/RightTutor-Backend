import express from "express";
import { adminLogin, adminSignup } from "../Controllers/auth.controller.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/signup", adminSignup);

export default router;
