import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI)
      throw new Error("MongoDB URI not found in environment variables");

    await mongoose.connect(mongoURI);
    console.log(`MongoDB connected`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;