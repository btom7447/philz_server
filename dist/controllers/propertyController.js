"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProperties = exports.getAllProperties = exports.getPropertyById = exports.deleteProperty = exports.updateProperty = exports.createProperty = void 0;
const Property_1 = __importDefault(require("../models/Property"));
const uploadHelper_1 = require("../utils/uploadHelper");
// ============================
// CREATE PROPERTY
// ============================
const createProperty = async (req, res) => {
    try {
        const { title, description, propertyType, address, location, bedrooms, bathrooms, toilets, area, garages, price, status, featured, sold, yearBuilt, amenities, additionalDetails, } = req.body;
        if (!title ||
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
            !amenities?.length)
            return res
                .status(400)
                .json({ message: "All required fields must be provided" });
        let images = [];
        let videos = [];
        let floorPlans = [];
        if (req.files && req.files.length > 0) {
            const { uploaded } = await (0, uploadHelper_1.uploadFilesToCloudinary)(req.files, "properties", "media");
            images = uploaded.filter((f) => f.type === "image").map((f) => f.url);
            videos = uploaded.filter((f) => f.type === "video").map((f) => f.url);
        }
        const property = await Property_1.default.create({
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
            createdBy: req.user._id,
        });
        res.status(201).json({ message: "Property created", property });
    }
    catch (err) {
        console.error("Create property error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.createProperty = createProperty;
// ============================
// UPDATE PROPERTY (featured, sold, status)
// ============================
const updateProperty = async (req, res) => {
    try {
        const property = await Property_1.default.findById(req.params.id);
        if (!property)
            return res.status(404).json({ message: "Property not found" });
        const { featured, sold, status, price, propertyType, address } = req.body;
        if (featured !== undefined)
            property.featured = Boolean(featured);
        if (sold !== undefined)
            property.sold = Boolean(sold);
        if (status)
            property.status = status;
        if (price)
            property.price = price;
        if (propertyType)
            property.propertyType = propertyType;
        if (address)
            property.address = address;
        await property.save();
        res.json({ message: "Property updated", property });
    }
    catch (err) {
        console.error("Update property error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.updateProperty = updateProperty;
// ============================
// DELETE PROPERTY
// ============================
const deleteProperty = async (req, res) => {
    try {
        const property = await Property_1.default.findByIdAndDelete(req.params.id);
        if (!property)
            return res.status(404).json({ message: "Property not found" });
        res.json({ message: "Property deleted" });
    }
    catch (err) {
        console.error("Delete property error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.deleteProperty = deleteProperty;
// ============================
// GET PROPERTY BY ID
// ============================
const getPropertyById = async (req, res) => {
    try {
        const property = await Property_1.default.findById(req.params.id).lean();
        if (!property)
            return res.status(404).json({ message: "Property not found" });
        res.json(property);
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getPropertyById = getPropertyById;
// ============================
// GET ALL PROPERTIES (paginated, optional sorting)
// ============================
const getAllProperties = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const sortBy = req.query.sortBy || "createdAt"; // e.g., price, area, createdAt
        const order = req.query.order === "asc" ? 1 : -1;
        const properties = await Property_1.default.find()
            .sort({ [sortBy]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        const total = await Property_1.default.countDocuments();
        res.json({ total, page, limit, properties });
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getAllProperties = getAllProperties;
// ============================
// SEARCH PROPERTIES
// ============================
const searchProperties = async (req, res) => {
    try {
        const { state, status, featured, propertyType, minPrice, maxPrice, sold, searchText, lat, lng, radius, // in meters
        page, limit, sortBy, order, } = req.query;
        const filter = {};
        if (state)
            filter["address.state"] = state;
        if (status)
            filter.status = status;
        if (featured !== undefined)
            filter.featured = featured === "true";
        if (propertyType)
            filter.propertyType = propertyType;
        if (sold !== undefined)
            filter.sold = sold === "true";
        if (minPrice)
            filter.price = { ...filter.price, $gte: Number(minPrice) };
        if (maxPrice)
            filter.price = { ...filter.price, $lte: Number(maxPrice) };
        const pageNum = Number(page) || 1;
        const pageLimit = Number(limit) || 20;
        const sortField = sortBy || "createdAt";
        const sortOrder = order === "asc" ? 1 : -1;
        let properties;
        // If lat/lng provided, do geoNear query
        if (lat && lng && radius) {
            // Force tuple type [lng, lat]
            const coordinates = [Number(lng), Number(lat)];
            properties = await Property_1.default.aggregate([
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
        }
        else {
            const textFilter = searchText
                ? { $text: { $search: searchText } }
                : {};
            properties = await Property_1.default.find({ ...filter, ...textFilter })
                .sort({ [sortField]: sortOrder })
                .skip((pageNum - 1) * pageLimit)
                .limit(pageLimit)
                .lean();
        }
        const total = await Property_1.default.countDocuments({ ...filter });
        res.json({ total, page: pageNum, limit: pageLimit, properties });
    }
    catch (err) {
        console.error("Search properties error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.searchProperties = searchProperties;
