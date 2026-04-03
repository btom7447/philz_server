"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObjectId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Middleware to validate that route params are valid MongoDB ObjectIds.
 * Usage: validateObjectId("id") or validateObjectId("id", "propertyId")
 */
const validateObjectId = (...paramNames) => (req, res, next) => {
    for (const param of paramNames) {
        const value = req.params[param];
        if (value && !mongoose_1.default.isValidObjectId(value)) {
            return res
                .status(400)
                .json({ message: `Invalid ${param}: ${value}` });
        }
    }
    next();
};
exports.validateObjectId = validateObjectId;
