import logger from "../Utils/logger.js";

const FATAL_ENV_VARS = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "FRONTEND_URL"
];

const OPTIONAL_ENV_VARS = [
    "GEMINI_API_KEY",
    "ADMIN_DASHBOARD_URL"
];

export const validateEnv = () => {
    const missingFatal = FATAL_ENV_VARS.filter(key => !process.env[key]);
    const missingOptional = OPTIONAL_ENV_VARS.filter(key => !process.env[key]);

    if (missingFatal.length > 0) {
        logger.error(`FATAL: Missing critical environment variables: ${missingFatal.join(", ")}`);
        process.exit(1);
    }

    if (missingOptional.length > 0) {
        logger.warn(`NOTICE: Some optional features are disabled because these variables are missing: ${missingOptional.join(", ")}`);
        logger.warn("-> AI Analysis will fail without GEMINI_API_KEY");
        logger.warn("-> Admin Dashboard CORS might fail without ADMIN_DASHBOARD_URL (defaulting to allow localhost)");
    } else {
        logger.info("Environment variables validated successfully.");
    }
};
