import { Request, Response } from "express";
import mongoose from "mongoose";
import Property from "../models/Property";
import AuditLog from "../models/AuditLog";
import cloudinary from "../utils/cloudinary";
import { SortOrder } from "mongoose";

// Fields allowed for property updates
const ALLOWED_UPDATE_FIELDS = [
  "title",
  "description",
  "propertyType",
  "address",
  "location",
  "bedrooms",
  "bathrooms",
  "toilets",
  "area",
  "garages",
  "price",
  "status",
  "featured",
  "sold",
  "yearBuilt",
  "amenities",
  "images",
  "videos",
  "floorPlans",
  "additionalDetails",
];

/** Escape special regex characters to prevent ReDoS / injection */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Parse string-to-boolean reliably */
function parseBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

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

    // Validate lat/lng ranges
    const lat = Number(location.latitude);
    const lng = Number(location.longitude);
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Invalid latitude or longitude" });
    }

    const geoLocation = {
      type: "Point",
      coordinates: [lng, lat],
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
      featured: parseBool(featured),
      sold: parseBool(sold),
      yearBuilt: Number(yearBuilt),
      amenities,
      images,
      videos,
      floorPlans,
      additionalDetails: additionalDetails || {},
      createdBy: req.user!._id,
    });

    await AuditLog.create({
      userId: req.user!._id,
      action: "create",
      resource: "property",
      resourceId: property._id.toString(),
      ip: req.ip,
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
    const id = req.params.id as string;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }

    const property = await Property.findById(id);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    const updates = req.body;

    // Only allow whitelisted fields
    for (const key of Object.keys(updates)) {
      if (!ALLOWED_UPDATE_FIELDS.includes(key)) continue;
      const value = updates[key];
      if (value === undefined) continue;

      if (key === "featured" || key === "sold") {
        (property as any)[key] = parseBool(value);
      } else if (key === "location" && value.latitude !== undefined && value.longitude !== undefined) {
        const lat = Number(value.latitude);
        const lng = Number(value.longitude);
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return res.status(400).json({ message: "Invalid latitude or longitude" });
        }
        property.location = { type: "Point", coordinates: [lng, lat] };
      } else {
        (property as any)[key] = value;
      }
    }

    await property.save();

    await AuditLog.create({
      userId: req.user!._id,
      action: "update",
      resource: "property",
      resourceId: id,
      details: { updatedFields: Object.keys(updates).filter((k) => ALLOWED_UPDATE_FIELDS.includes(k)) },
      ip: req.ip,
    });

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
    const id = req.params.id as string;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }

    const property = await Property.findById(id).lean();
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

    if (propertyType && typeof propertyType === "string" && propertyType.trim()) {
      filter.propertyType = propertyType;
    }
    if (status && typeof status === "string" && status.trim()) {
      filter.status = status;
    }

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

    if (location && typeof location === "string" && location.trim()) {
      const escaped = escapeRegex(location as string);
      filter.$or = [
        { "address.city": { $regex: escaped, $options: "i" } },
        { "address.state": { $regex: escaped, $options: "i" } },
      ];
    }

    // --------------------
    // Text Search (requires text index)
    // --------------------
    if (title && typeof title === "string" && title.trim()) {
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
    const id = req.params.id as string;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }

    const property = await Property.findById(id);

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

    await AuditLog.create({
      userId: req.user!._id,
      action: "delete",
      resource: "property",
      resourceId: id,
      ip: req.ip,
    });

    res.json({ message: "Property deleted successfully" });
  } catch (err: any) {
    console.error("DELETE PROPERTY ERROR:", err);
    res.status(500).json({
      message: "Failed to delete property",
      error: err.message,
    });
  }
};
