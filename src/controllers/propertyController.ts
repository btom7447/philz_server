import { Request, Response } from "express";
import Property from "../models/Property";
import { deleteFilesFromCloudinary } from "../utils/cloudinaryServer";

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

    // Basic validation
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
    res.status(400).json({ message: err.message, error: err.errors ?? err });
  }
};

// ============================
// UPDATE PROPERTY (featured, sold, status, other fields)
// ============================
export const updateProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    const {
      featured,
      sold,
      status,
      price,
      propertyType,
      address,
      images,
      videos,
      floorPlans,
    } = req.body;

    if (featured !== undefined) property.featured = Boolean(featured);
    if (sold !== undefined) property.sold = Boolean(sold);
    if (status) property.status = status;
    if (price) property.price = price;
    if (propertyType) property.propertyType = propertyType;
    if (address) property.address = address;
    if (images) property.images = images;
    if (videos) property.videos = videos;
    if (floorPlans) property.floorPlans = floorPlans;

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
    const property = await Property.findById(req.params.id);

    if (!property)
      return res.status(404).json({ message: "Property not found" });

    // Collect all public_ids from images, videos, floorPlans
    const publicIds: string[] = [
      ...(property.images?.map((f: any) => f.public_id) || []),
      ...(property.videos?.map((f: any) => f.public_id) || []),
      ...(property.floorPlans?.map((f: any) => f.public_id) || []),
    ];

    // Delete from Cloudinary
    const deletionResults = await deleteFilesFromCloudinary(publicIds);

    // Delete property from DB
    await property.deleteOne();

    res.json({
      message: "Property deleted",
      cloudinary: deletionResults,
    });
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
    const sortBy = req.query.sortBy || "createdAt";
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
      radius,
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

    if (lat && lng && radius) {
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