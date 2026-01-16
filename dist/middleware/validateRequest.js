"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: result.error.format(),
        });
    }
    req.body = result.data; // sanitized
    next();
};
exports.validateRequest = validateRequest;
