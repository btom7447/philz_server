"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tourRequestSchema = exports.inquirySchema = exports.contactSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    email: zod_1.z.string().email("Invalid email"),
    phone: zod_1.z.string().min(6, "Phone number is required"),
    password: passwordSchema,
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(1, "Password is required"),
    rememberMe: zod_1.z.boolean().optional(),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email"),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Token is required"),
    newPassword: passwordSchema,
});
exports.contactSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    email: zod_1.z.string().email("Invalid email"),
    phone: zod_1.z.string().optional(),
    subject: zod_1.z.string().optional(),
    message: zod_1.z.string().min(10, "Message must be at least 10 characters"),
});
exports.inquirySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    email: zod_1.z.string().email("Invalid email"),
    phone: zod_1.z.string().min(6, "Phone number is required"),
    message: zod_1.z.string().min(10, "Message must be at least 10 characters"),
    propertyId: zod_1.z.string().optional(),
});
exports.tourRequestSchema = zod_1.z.object({
    propertyId: zod_1.z.string().min(1, "Property ID is required"),
    type: zod_1.z.enum(["virtual", "in-person"]),
    tourTime: zod_1.z.string().min(1, "Tour time is required"),
});
