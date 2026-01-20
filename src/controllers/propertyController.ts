import { Request, Response } from "express";
import Property from "../models/Property";
import { uploadFilesToCloudinary } from "../utils/uploadHelper";
import mongoose from "mongoose";

// ============================
// CREATE PROPERTY
// ============================
export const createProperty = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      propertyType,
      address,
      location,
      bedrooms,
      bathrooms,
      toilets,
      area,
      garages,
      price,
      status,
      featured,
      sold,
      yearBuilt,
      amenities,
      additionalDetails,
    } = req.body;

    if (
      !title ||
      !description ||
      !propertyType ||
      !address?.city ||
      !address?.state ||
      !location?.latitude ||
      !location?.longitude ||
      bedrooms === undefined ||
      bathrooms === undefined ||
      toilets === undefined ||
      area === undefined ||
      garages === undefined ||
      !price ||
      !status ||
      yearBuilt === undefined ||
      !amenities?.length
    )
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });

    let images: string[] = [];
    let videos: string[] = [];
    let floorPlans: string[] = [];

    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const { uploaded } = await uploadFilesToCloudinary(
        req.files as Express.Multer.File[],
        "properties",
        "media",
      );
      images = uploaded.filter((f) => f.type === "image").map((f) => f.url);
      videos = uploaded.filter((f) => f.type === "video").map((f) => f.url);
    }

    const property = await Property.create({
      title,
      description,
      propertyType,
      address,
      location,
      bedrooms,
      bathrooms,
      toilets,
      area,
      garages,
      price,
      status,
      featured: Boolean(featured),
      sold: Boolean(sold),
      yearBuilt,
      amenities,
      images,
      videos,
      floorPlans,
      additionalDetails: additionalDetails || {},
      createdBy: req.user!._id,
    });

    res.status(201).json({ message: "Property created", property });
  } catch (error: any) {
    console.error("CREATE PROPERTY ERROR:", error);

    return res.status(400).json({
      message: error.message,
      error: error.errors ?? error,
    });
  }
};

// ============================
// UPDATE PROPERTY (featured, sold, status)
// ============================
export const updateProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    const { featured, sold, status, price, propertyType, address } = req.body;

    if (featured !== undefined) property.featured = Boolean(featured);
    if (sold !== undefined) property.sold = Boolean(sold);
    if (status) property.status = status;
    if (price) property.price = price;
    if (propertyType) property.propertyType = propertyType;
    if (address) property.address = address;

    await property.save();
    res.json({ message: "Property updated", property });
  } catch (err: any) {
    console.error("Update property error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// DELETE PROPERTY
// ============================
export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    res.json({ message: "Property deleted" });
  } catch (err: any) {
    console.error("Delete property error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// GET PROPERTY BY ID
// ============================
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id).lean();
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    res.json(property);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// GET ALL PROPERTIES (paginated, optional sorting)
// ============================
export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const sortBy = req.query.sortBy || "createdAt"; // e.g., price, area, createdAt
    const order = req.query.order === "asc" ? 1 : -1;

    const properties = await Property.find()
      .sort({ [sortBy as string]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Property.countDocuments();

    res.json({ total, page, limit, properties });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// SEARCH PROPERTIES
// ============================
export const searchProperties = async (req: Request, res: Response) => {
  try {
    const {
      state,
      status,
      featured,
      propertyType,
      minPrice,
      maxPrice,
      sold,
      searchText,
      lat,
      lng,
      radius, // in meters
      page,
      limit,
      sortBy,
      order,
    } = req.query;

    const filter: any = {};

    if (state) filter["address.state"] = state;
    if (status) filter.status = status;
    if (featured !== undefined) filter.featured = featured === "true";
    if (propertyType) filter.propertyType = propertyType;
    if (sold !== undefined) filter.sold = sold === "true";
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };

    const pageNum = Number(page) || 1;
    const pageLimit = Number(limit) || 20;
    const sortField = (sortBy as string) || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    let properties;

    // If lat/lng provided, do geoNear query
    if (lat && lng && radius) {
      // Force tuple type [lng, lat]
      const coordinates: [number, number] = [Number(lng), Number(lat)];

      properties = await Property.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates },
            distanceField: "distance",
            maxDistance: Number(radius),
            spherical: true,
            query: filter,
          },
        },
        { $sort: { [sortField]: sortOrder } },
        { $skip: (pageNum - 1) * pageLimit },
        { $limit: pageLimit },
      ]);
    } else {
      const textFilter = searchText
        ? { $text: { $search: searchText as string } }
        : {};
      properties = await Property.find({ ...filter, ...textFilter })
        .sort({ [sortField]: sortOrder })
        .skip((pageNum - 1) * pageLimit)
        .limit(pageLimit)
        .lean();
    }

    const total = await Property.countDocuments({ ...filter });

    res.json({ total, page: pageNum, limit: pageLimit, properties });
  } catch (err: any) {
    console.error("Search properties error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};