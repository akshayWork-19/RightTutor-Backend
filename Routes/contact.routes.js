import express from "express";
import { submitContact, getContacts, updateContact, deleteContact } from "../Controllers/contact.controller.js";
import { validate } from "../Middleware/validate.middleware.js";
import { contactSchema } from "../Validations/contact.schema.js";
import { verifyJWT } from "../Middleware/auth.middleware.js";

const router = express.Router();

router.post("/", validate(contactSchema), submitContact);

// Protected routes
router.get("/", verifyJWT, getContacts);
router.put("/:id", verifyJWT, validate(contactSchema), updateContact);
router.delete("/:id", verifyJWT, deleteContact);

export default router;
