import jwt from "jsonwebtoken";
import { admin } from "../Config/firebase.js";
import { ApiError } from "../Utils/ApiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";

const JWT_SECRET = process.env.JWT_SECRET || 'righttutor_secret_key_123';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split("Bearer ")[1];

        if (!token) {
            throw new ApiError(401, "Unauthorized request: No token provided");
        }

        // 1. Check for Standard JWT (Dashboard Auth)
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded) {
                req.user = decoded;
                return next();
            }
        } catch (jwtError) {
            // Not a standard JWT, proceed to Firebase check
        }

        // 2. Check for Firebase ID Token (Mobile/Legacy Auth)
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            if (decodedToken) {
                req.user = decodedToken;
                return next();
            }
        } catch (firebaseError) {
            throw new ApiError(401, "Invalid access token: " + firebaseError.message);
        }
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid access token");
    }
});
