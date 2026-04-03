"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProperty = exports.getAllProperties = exports.getPropertyById = exports.updateProperty = exports.createProperty = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Property_1 = __importDefault(require("../models/Property"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
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
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/** Parse string-to-boolean reliably */
function parseBool(value) {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string")
        return value.toLowerCase() === "true";
    return Boolean(value);
}
// ============================
// CREATE PROPERTY
// ============================
const createProperty = async (req, res) => {
    try {
        const { title, description, propertyType, address, location, bedrooms, bathrooms, toilets, area, garages, price, status, featured, sold, yearBuilt, amenities, additionalDetails, images = [], videos = [], floorPlans = [], } = req.body;
        if (!title ||
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
            !amenities?.length) {
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
        const property = await Property_1.default.create({
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
            createdBy: req.user._id,
        });
        await AuditLog_1.default.create({
            userId: req.user._id,
            action: "create",
            resource: "property",
            resourceId: property._id.toString(),
            ip: req.ip,
        });
        res.status(201).json({ message: "Property created", property });
    }
    catch (err) {
        console.error("CREATE PROPERTY ERROR:", err);
        res.status(400).json({ message: err.message });
    }
};
exports.createProperty = createProperty;
// ============================
// UPDATE PROPERTY
// ============================
const updateProperty = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid property ID" });
        }
        const property = await Property_1.default.findById(id);
        if (!property)
            return res.status(404).json({ message: "Property not found" });
        const updates = req.body;
        // Only allow whitelisted fields
        for (const key of Object.keys(updates)) {
            if (!ALLOWED_UPDATE_FIELDS.includes(key))
                continue;
            const value = updates[key];
            if (value === undefined)
                continue;
            if (key === "featured" || key === "sold") {
                property[key] = parseBool(value);
            }
            else if (key === "location" && value.latitude !== undefined && value.longitude !== undefined) {
                const lat = Number(value.latitude);
                const lng = Number(value.longitude);
                if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    return res.status(400).json({ message: "Invalid latitude or longitude" });
                }
                property.location = { type: "Point", coordinates: [lng, lat] };
            }
            else {
                property[key] = value;
            }
        }
        await property.save();
        await AuditLog_1.default.create({
            userId: req.user._id,
            action: "update",
            resource: "property",
            resourceId: id,
            details: { updatedFields: Object.keys(updates).filter((k) => ALLOWED_UPDATE_FIELDS.includes(k)) },
            ip: req.ip,
        });
        res.json({ message: "Property updated", property });
    }
    catch (err) {
        console.error("Update property error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.updateProperty = updateProperty;
// ============================
// GET PROPERTY BY ID
// ============================
const getPropertyById = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid property ID" });
        }
        const property = await Property_1.default.findById(id).lean();
        if (!property)
            return res.status(404).json({ message: "Property not found" });
        res.json(property);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getPropertyById = getPropertyById;
// ============================
// GET ALL PROPERTIES (ONE ENDPOINT)
// ============================
const getAllProperties = async (req, res) => {
    try {
        const { page = "1", pageSize = "12", sortBy = "createdAt:desc", title, location, propertyType, status, maxPrice, amenities, } = req.query;
        // --------------------
        // Pagination
        // --------------------
        const pageNum = Math.max(Number(page) || 1, 1);
        const limit = Math.min(Number(pageSize) || 12, 50);
        const skip = (pageNum - 1) * limit;
        // --------------------
        // Sorting (whitelisted + typed)
        // --------------------
        const [sortField, sortDir] = sortBy.split(":");
        const allowedSortFields = ["createdAt", "price", "title"];
        const direction = sortDir === "asc" ? 1 : -1;
        const sort = allowedSortFields.includes(sortField)
            ? { [sortField]: direction }
            : { createdAt: -1 };
        // --------------------
        // Filters
        // --------------------
        const filter = {};
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
            const list = amenities
                .split(",")
                .map((a) => a.trim())
                .filter(Boolean);
            if (list.length) {
                filter.amenities = { $all: list };
            }
        }
        if (location && typeof location === "string" && location.trim()) {
            const escaped = escapeRegex(location);
            filter.$or = [
                { "address.city": { $regex: escaped, $options: "i" } },
                { "address.state": { $regex: escaped, $options: "i" } },
            ];
        }
        // --------------------
        // Text Search (requires text index)
        // --------------------
        if (title && typeof title === "string" && title.trim()) {
            filter.$text = { $search: title };
        }
        // --------------------
        // Query
        // --------------------
        const [properties, total] = await Promise.all([
            Property_1.default.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            Property_1.default.countDocuments(filter),
        ]);
        res.status(200).json({
            properties,
            total,
            page: pageNum,
            pageSize: limit,
            totalPages: Math.ceil(total / limit),
        });
    }
    catch (error) {
        console.error("GET ALL PROPERTIES ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getAllProperties = getAllProperties;
// ============================
// DELETE PROPERTY
// ============================
const deleteProperty = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid property ID" });
        }
        const property = await Property_1.default.findById(id);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        const allMedia = [
            ...property.images,
            ...property.videos,
            ...property.floorPlans,
        ];
        // Delete media from Cloudinary (best effort)
        await Promise.all(allMedia.map((media) => cloudinary_1.default.uploader
            .destroy(media.public_id, {
            resource_type: "auto",
            invalidate: true,
        })
            .catch((err) => {
            console.error(`Cloudinary delete failed for ${media.public_id}:`, err.message);
        })));
        await property.deleteOne();
        await AuditLog_1.default.create({
            userId: req.user._id,
            action: "delete",
            resource: "property",
            resourceId: id,
            ip: req.ip,
        });
        res.json({ message: "Property deleted successfully" });
    }
    catch (err) {
        console.error("DELETE PROPERTY ERROR:", err);
        res.status(500).json({
            message: "Failed to delete property",
            error: err.message,
        });
    }
};
exports.deleteProperty = deleteProperty;
