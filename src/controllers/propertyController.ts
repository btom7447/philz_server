import { Request, Response } from "express";
import Property from "../models/Property";
import cloudinary from "../utils/cloudinary";
import { SortOrder } from "mongoose";

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
      images = [],
      videos = [],
      floorPlans = [],
    } = req.body;

    if (
      !title ||
      !description ||
      !propertyType ||
      !address?.city ||
      !address?.state ||
      location?.latitude === undefined ||
      location?.longitude === undefined ||
      bedrooms === undefined ||
      bathrooms === undefined ||
      toilets === undefined ||
      area === undefined ||
      garages === undefined ||
      price === undefined ||
      !status ||
      yearBuilt === undefined ||
      !amenities?.length
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    const geoLocation = {
      type: "Point",
      coordinates: [Number(location.longitude), Number(location.latitude)],
    };

    const property = await Property.create({
      title,
      description,
      propertyType,
      address,
      location: geoLocation,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      toilets: Number(toilets),
      area: Number(area),
      garages: Number(garages),
      price: Number(price),
      status,
      featured: Boolean(featured),
      sold: Boolean(sold),
      yearBuilt: Number(yearBuilt),
      amenities,
      images,
      videos,
      floorPlans,
      additionalDetails: additionalDetails || {},
      createdBy: req.user!._id,
    });

    res.status(201).json({ message: "Property created", property });
  } catch (err: any) {
    console.error("CREATE PROPERTY ERROR:", err);
    res.status(400).json({ message: err.message });
  }
};

// ============================
// UPDATE PROPERTY
// ============================
export const updateProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    const updates = req.body;

    Object.keys(updates).forEach((key) => {
      // @ts-ignore
      if (updates[key] !== undefined) property[key] = updates[key];
    });

    await property.save();
    res.json({ message: "Property updated", property });
  } catch (err: any) {
    console.error("Update property error:", err);
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// GET ALL PROPERTIES (ONE ENDPOINT)
// ============================
export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      pageSize = "12",
      sortBy = "createdAt:desc",
      title,
      location,
      propertyType,
      status,
      maxPrice,
      amenities,
    } = req.query;

    // --------------------
    // Pagination
    // --------------------
    const pageNum = Math.max(Number(page) || 1, 1);
    const limit = Math.min(Number(pageSize) || 12, 50);
    const skip = (pageNum - 1) * limit;

    // --------------------
    // Sorting (whitelisted + typed)
    // --------------------
    const [sortField, sortDir] = (sortBy as string).split(":");

    const allowedSortFields = ["createdAt", "price", "title"];
    const direction: SortOrder = sortDir === "asc" ? 1 : -1;

    const sort: Record<string, SortOrder> = allowedSortFields.includes(
      sortField,
    )
      ? { [sortField]: direction }
      : { createdAt: -1 };

    // --------------------
    // Filters
    // --------------------
    const filter: Record<string, any> = {};

    if (propertyType) filter.propertyType = propertyType;
    if (status) filter.status = status;

    if (maxPrice) {
      const price = Number(maxPrice);
      if (!Number.isNaN(price)) {
        filter.price = { $lte: price };
      }
    }

    if (amenities) {
      const list = (amenities as string)
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      if (list.length) {
        filter.amenities = { $all: list };
      }
    }

    if (location) {
      filter.$or = [
        { "address.city": { $regex: location, $options: "i" } },
        { "address.state": { $regex: location, $options: "i" } },
      ];
    }

    // --------------------
    // Text Search (requires text index)
    // --------------------
    if (title) {
      filter.$text = { $search: title as string };
    }

    // --------------------
    // Query
    // --------------------
    const [properties, total] = await Promise.all([
      Property.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Property.countDocuments(filter),
    ]);

    res.status(200).json({
      properties,
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET ALL PROPERTIES ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ============================
// DELETE PROPERTY
// ============================
export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const allMedia = [
      ...property.images,
      ...property.videos,
      ...property.floorPlans,
    ];

    // Delete media from Cloudinary (best effort)
    await Promise.all(
      allMedia.map((media) =>
        cloudinary.uploader
          .destroy(media.public_id, {
            resource_type: "auto",
            invalidate: true,
          })
          .catch((err) => {
            console.error(
              `Cloudinary delete failed for ${media.public_id}:`,
              err.message,
            );
          }),
      ),
    );

    await property.deleteOne();

    res.json({ message: "Property deleted successfully" });
  } catch (err: any) {
    console.error("DELETE PROPERTY ERROR:", err);
    res.status(500).json({
      message: "Failed to delete property",
      error: err.message,
    });
  }
};
