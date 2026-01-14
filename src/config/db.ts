import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const env = process.env.NODE_ENV || "development";

    const mongoURI =
      env === "production"
        ? process.env.MONGO_URI_PROD
        : process.env.MONGO_URI_DEV;

    if (!mongoURI) {
      throw new Error("MongoDB URI not found in environment variables");
    }

    await mongoose.connect(mongoURI);
    console.log(`MongoDB connected (${env})`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;