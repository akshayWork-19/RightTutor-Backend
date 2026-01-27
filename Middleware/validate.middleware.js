import { ApiError } from "../Utils/ApiError.js";

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        console.error("Validation Error:", error.errors || error.message);
        const errorMessage = (error.errors || [])
            .map((details) => details.message)
            .join(", ") || error.message;
        return next(new ApiError(400, errorMessage));
    }
};

export { validate };
