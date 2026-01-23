import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import connectDB from "./config/db";

// Routes
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import tourRoutes from "./routes/tours";
import inquiryRoutes from "./routes/inquiries";
import contactRoutes from "./routes/contact";
import testimonialRoutes from "./routes/testimonial";
import paymentRoutes from "./routes/payment";
import uploadRoutes from "./routes/upload";

// Middleware
import errorHandler from "./middleware/errorHandler";

// Swagger
import swaggerUi from "swagger-ui-express";
import { getSession } from "./controllers/authController";
import router from "./routes/auth";
const swaggerJsdoc = require("swagger-jsdoc");

// ---------------- Database ----------------
connectDB();
const app = express();

// ---------------- Security & Parsing ----------------
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// ---------------- Environment ----------------
const isProd = process.env.NODE_ENV === "production";
const FRONTEND_URL = isProd
  ? process.env.PROD_FRONTEND_URL
  : process.env.DEV_FRONTEND_URL;

const PORT = isProd
  ? process.env.PROD_PORT || 8000
  : process.env.DEV_PORT || 5000;

// ---------------- CORS ----------------
const allowedOrigins = [FRONTEND_URL, `http://localhost:${PORT}`];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

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
      { url: `http://localhost:${PORT}` }, // Swagger always hits backend port
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerJsdoc(swaggerOptions))
);

// ---------------- Routes ----------------
app.get("/", (req: Request, res: Response) =>
  res.send("Philz Properties API is running")
);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/upload", uploadRoutes);

router.get("/session", getSession)

// ---------------- Error Handling ----------------
app.use(errorHandler);

// ---------------- Start Server ----------------
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
});