import express from "express";
import { addRepo, getRepos, updateRepo, deleteRepo } from "../Controllers/repository.controller.js";
import { verifyJWT } from "../Middleware/auth.middleware.js";
import { validate } from "../Middleware/validate.middleware.js";
import { repositorySchema } from "../Validations/repository.schema.js";

const router = express.Router();

// Admin routes - protected by JWT
router.use(verifyJWT);

router.post("/", validate(repositorySchema), addRepo);
router.get("/", getRepos);
router.put("/:id", validate(repositorySchema), updateRepo);
router.delete("/:id", deleteRepo);

export default router;
