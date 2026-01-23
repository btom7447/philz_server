// ============================
// LABEL: EXPRESS PROPERTY CONTROLLER REWRITE
// Handles multiple fields: images, videos, floorPlans
// ============================
import { Request, Response } from "express";
import Property from "../models/Property";
import { uploadFilesToCloudinary } from "../utils/uploadHelper";

// CREATE PROPERTY
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

    let images: string[] = [];
    let videos: string[] = [];
    let floorPlans: string[] = [];

    // ----------------------------
    // Upload files from multer fields
    // ----------------------------
    if (req.files) {
      const filesByField = req.files as Record<string, Express.Multer.File[]>;
      const allFiles = [
        ...(filesByField.images || []),
        ...(filesByField.videos || []),
        ...(filesByField.floorPlans || []),
      ];

      const { uploaded } = await uploadFilesToCloudinary(
        allFiles,
        "properties",
      );

      // inside createProperty
      images = uploaded
        .filter((f) => f.fieldName === "images")
        .map((f) => f.url);

      videos = uploaded
        .filter((f) => f.fieldName === "videos")
        .map((f) => f.url);

      floorPlans = uploaded
        .filter((f) => f.fieldName === "floorPlans")
        .map((f) => f.url);
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
    return res
      .status(400)
      .json({ message: err.message, error: err.errors ?? err });
  }
};
