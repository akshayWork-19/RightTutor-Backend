import express from "express";
import { addMatch, getMatches, updateMatch, deleteMatch } from "../Controllers/manualMatch.controller.js";
import { verifyJWT } from "../Middleware/auth.middleware.js";
import { validate } from "../Middleware/validate.middleware.js";
import { manualMatchSchema } from "../Validations/manualMatch.schema.js";

const router = express.Router();

// Admin routes - protected by JWT
router.use(verifyJWT);

router.post("/", validate(manualMatchSchema), addMatch);
router.get("/", getMatches);
router.put("/:id", validate(manualMatchSchema), updateMatch);
router.delete("/:id", deleteMatch);

export default router;
