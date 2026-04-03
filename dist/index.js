"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = __importDefault(require("./config/db"));
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const properties_1 = __importDefault(require("./routes/properties"));
const tours_1 = __importDefault(require("./routes/tours"));
const inquiries_1 = __importDefault(require("./routes/inquiries"));
const contact_1 = __importDefault(require("./routes/contact"));
const testimonial_1 = __importDefault(require("./routes/testimonial"));
const payment_1 = __importDefault(require("./routes/payment"));
const upload_1 = __importDefault(require("./routes/upload"));
// Middleware
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
// Swagger
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swaggerJsdoc = require("swagger-jsdoc");
// ---------------- Database ----------------
(0, db_1.default)();
const app = (0, express_1.default)();
// ---------------- Environment ----------------
const isProd = process.env.NODE_ENV === "production";
const FRONTEND_URL = isProd
    ? process.env.PROD_FRONTEND_URL
    : process.env.DEV_FRONTEND_URL;
const PORT = isProd
    ? process.env.PROD_PORT || 8000
    : process.env.DEV_PORT || 5000;
// ---------------- Security & Parsing ----------------
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", FRONTEND_URL || "http://localhost:3000"],
        },
    },
}));
app.use(express_1.default.json({ limit: "10kb" }));
app.use((0, cookie_parser_1.default)());
// ---------------- CORS ----------------
const allowedOrigins = [FRONTEND_URL, "http://localhost:3000"].filter(Boolean);
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // In production, require an origin header
        if (!origin) {
            if (isProd) {
                return callback(new Error("CORS: origin required in production"));
            }
            // Allow in development (Postman, curl, etc.)
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("CORS not allowed"));
    },
    credentials: true,
}));
// ---------------- Swagger ----------------
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Philz Properties API",
            version: "1.0.0",
            description: "API documentation for Philz Properties",
        },
        servers: [
            {
                url: isProd
                    ? `${process.env.PROD_BACKEND_URL || `https://philz-server.onrender.com`}`
                    : `http://localhost:${PORT}`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
            },
        },
    },
    apis: ["./src/routes/*.ts"],
};
app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerJsdoc(swaggerOptions)));
// ---------------- Routes ----------------
app.get("/", (_req, res) => res.send("Philz Properties API is running"));
app.use("/api/auth", auth_1.default);
app.use("/api/properties", properties_1.default);
app.use("/api/tours", tours_1.default);
app.use("/api/inquiries", inquiries_1.default);
app.use("/api/contact", contact_1.default);
app.use("/api/testimonials", testimonial_1.default);
app.use("/api/payments", payment_1.default);
app.use("/api/upload", upload_1.default);
// ---------------- Error Handling ----------------
app.use(errorHandler_1.default);
// ---------------- Start Server ----------------
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
});
