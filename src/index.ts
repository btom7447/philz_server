/// <reference path="../types/express.d.ts" />
// -----------------------
// Load environment variables immediately
// -----------------------
import dotenv from "dotenv";
dotenv.config();

// -----------------------
// Now import the rest
// -----------------------
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db";
import { publicLimiter } from "./middleware/rateLimiter";

// Routes
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import tourRoutes from "./routes/tours";
import inquiryRoutes from "./routes/inquiries";
import testimonialRoutes from "./routes/testimonial";
import paymentRoutes from "./routes/payment";

// Middleware
import errorHandler from "./middleware/errorHandler";

// Swagger
import swaggerUi from "swagger-ui-express";
const swaggerJsdoc = require("swagger-jsdoc");

// -----------------------
// Connect to MongoDB
// -----------------------
connectDB();

// -----------------------
// Express setup
// -----------------------
const app = express();

// Security Middleware
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

// CORS
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:3000"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
  })
);

// Rate limiting
app.use("/api/auth", publicLimiter);
app.use("/api/inquiries", publicLimiter);
app.use("/api/tours", publicLimiter);

// Swagger setup
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
        url:
          process.env.FRONTEND_URL ||
          `http://localhost:${process.env.PORT || 5000}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
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

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Philz Properties API is running");
});
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/payments", paymentRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
});