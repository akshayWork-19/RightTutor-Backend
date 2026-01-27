import express from "express";
import { submitBooking, getBookings, updateBooking, deleteBooking } from "../Controllers/consultation.controller.js";
import { validate } from "../Middleware/validate.middleware.js";
import { consultationSchema } from "../Validations/consultation.schema.js";
import { verifyJWT } from "../Middleware/auth.middleware.js";

const router = express.Router();

router.post("/", validate(consultationSchema), submitBooking);

// Protected routes
router.get("/", verifyJWT, getBookings);
router.put("/:id", verifyJWT, validate(consultationSchema), updateBooking);
router.delete("/:id", verifyJWT, deleteBooking);

export default router;
