import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "../models/Property";
import User from "../models/User";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/philz";

const propertyTypes: Array<"apartment" | "house" | "office" | "shop"> = [
  "apartment",
  "house",
  "office",
  "shop",
];

const states = ["Lagos", "Abuja", "Rivers", "Kano"];
const cities = ["Ikoyi", "Maitama", "Port Harcourt", "Sabon Gari"];
const amenitiesList = ["Pool", "Gym", "Parking", "Security", "Elevator"];
const images = [
  "https://via.placeholder.com/400x300",
  "https://via.placeholder.com/400x300",
];

const seedProperties = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    // Clear existing properties
    await Property.deleteMany({});
    console.log("Existing properties removed");

    // Fetch any user to assign as createdBy (or create a dummy one)
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        name: "Seeder User",
        email: "seeder@philz.com",
        password: "password123",
        role: "super-admin",
      });
    }

    const properties = [];

    for (let i = 1; i <= 10; i++) {
      properties.push({
        title: `Property ${i}`,
        description: `This is a sample description for property ${i}`,
        propertyType:
          i <= 3 ? "apartment" : propertyTypes[i % propertyTypes.length],
        address: {
          city: cities[i % cities.length],
          state: states[i % states.length],
        },
        location: {
          type: "Point",
          coordinates: [
            Number((3 + Math.random() * 2).toFixed(6)), // lng
            Number((6 + Math.random() * 2).toFixed(6)), // lat
          ],
        },
        bedrooms: Math.floor(Math.random() * 5) + 1,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        toilets: Math.floor(Math.random() * 3) + 1,
        area: Math.floor(Math.random() * 2000) + 500,
        garages: Math.floor(Math.random() * 3),
        price: Math.floor(Math.random() * 5000000) + 1000000,
        status: i % 2 === 0 ? "for sale" : "for rent",
        featured: i <= 3, // first 3 featured
        sold: false,
        yearBuilt: 2015 + (i % 8),
        amenities: amenitiesList.slice(
          0,
          Math.floor(Math.random() * amenitiesList.length) + 1,
        ),
        images,
        videos: [],
        floorPlans: [],
        additionalDetails: { note: `Extra details for property ${i}` },
        createdBy: user._id,
      });
    }

    await Property.insertMany(properties);
    console.log("Seeded 10 properties successfully!");

    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedProperties();