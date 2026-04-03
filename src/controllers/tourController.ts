import { Request, Response } from "express";
import mongoose from "mongoose";
import TourRequest from "../models/TourRequest";
import AuditLog from "../models/AuditLog";

const ALLOWED_SORT_FIELDS = ["tourTime", "createdAt", "status"];

function buildSort(sort: string): Record<string, 1 | -1> {
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  if (!ALLOWED_SORT_FIELDS.includes(field)) return { tourTime: -1 };
  return { [field]: desc ? -1 : 1 };
}

// ============================
// REQUEST A TOUR (USER)
// ============================
export const requestTour = async (req: Request, res: Response) => {
  try {
    const { propertyId, type, tourTime } = req.body;

    if (!propertyId || !type || !tourTime) {
      return res
        .status(400)
        .json({ message: "propertyId, type, and tourTime are required" });
    }

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }

    // Idempotency: check for duplicate tour request (same user, property, time)
    const existing = await TourRequest.findOne({
      propertyId,
      userId: req.user!._id,
      tourTime: new Date(tourTime),
      status: { $in: ["pending", "approved"] },
    });
    if (existing) {
      return res.status(409).json({
        message: "You already have a tour request for this property at this time",
        tour: existing,
      });
    }

    const tour = await TourRequest.create({
      propertyId,
      userId: req.user!._id,
      type,
      tourTime,
    });

    await AuditLog.create({
      userId: req.user!._id,
      action: "create",
      resource: "tour",
      resourceId: tour._id.toString(),
      ip: req.ip,
    });

    res.status(201).json({ message: "Tour requested", tour });
  } catch (err: any) {
    console.error("Request tour error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// GET USER TOURS (PAGINATION, FILTERING, SORTING)
// ============================
export const getUserTours = async (req: Request, res: Response) => {
  try {
    const { status, type, page = "1", pageSize = "10", sort = "-tourTime" } = req.query;

    const filter: any = { userId: req.user!._id, isDeleted: { $ne: true } };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limit = Math.min(Number(pageSize) || 10, 50);
    const skip = (pageNum - 1) * limit;

    const [tours, total] = await Promise.all([
      TourRequest.find(filter)
        .sort(buildSort(sort as string))
        .skip(skip)
        .limit(limit)
        .populate("propertyId", "title address propertyType price status images")
        .populate("userId", "name email avatarUrl role")
        .lean(),
      TourRequest.countDocuments(filter),
    ]);

    const formattedTours = tours.map((t) => ({
      ...t,
      user: t.userId,
      property: t.propertyId,
      userId: undefined,
      propertyId: undefined,
    }));

    res.json({
      data: formattedTours,
      meta: { page: pageNum, pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error("Get user tours error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// GET ALL TOURS (ADMIN)
// ============================
export const getAllTours = async (req: Request, res: Response) => {
  try {
    const { status, type, propertyId, page = "1", pageSize = "20", sort = "-tourTime" } =
      req.query;

    const filter: any = { isDeleted: { $ne: true } };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (propertyId && mongoose.isValidObjectId(propertyId)) {
      filter.propertyId = propertyId;
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limit = Math.min(Number(pageSize) || 20, 100);
    const skip = (pageNum - 1) * limit;

    const [tours, total] = await Promise.all([
      TourRequest.find(filter)
        .sort(buildSort(sort as string))
        .skip(skip)
        .limit(limit)
        .populate("propertyId", "title address propertyType price status images")
        .populate("userId", "name email avatarUrl role")
        .lean(),
      TourRequest.countDocuments(filter),
    ]);

    const formattedTours = tours.map((t) => ({
      ...t,
      user: t.userId,
      property: t.propertyId,
      userId: undefined,
      propertyId: undefined,
    }));

    res.json({
      data: formattedTours,
      meta: { page: pageNum, pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error("Get all tours error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// APPROVE OR REJECT TOUR (ADMIN)
// ============================
export const approveTour = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid tour ID" });
    }

    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const tour = await TourRequest.findById(id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    tour.status = status;
    tour.approvedBy = req.user!._id;
    await tour.save();

    await AuditLog.create({
      userId: req.user!._id,
      action: status === "approved" ? "approve" : "reject",
      resource: "tour",
      resourceId: id,
      ip: req.ip,
    });

    res.json({ message: "Tour updated", tour });
  } catch (err: any) {
    console.error("Approve tour error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// RESCHEDULE TOUR (USER)
// ============================
export const rescheduleTour = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid tour ID" });
    }

    const { tourTime, meetLink } = req.body;
    if (!tourTime)
      return res.status(400).json({ message: "tourTime is required" });

    const tour = await TourRequest.findById(id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    if (tour.userId.toString() !== req.user!._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to reschedule this tour" });
    }

    tour.tourTime = tourTime;
    tour.rescheduled = true;
    tour.status = "pending";
    if (meetLink) tour.meetLink = meetLink;
    await tour.save();

    res.json({ message: "Tour rescheduled", tour });
  } catch (err: any) {
    console.error("Reschedule tour error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// CANCEL TOUR (USER)
// ============================
export const cancelTour = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid tour ID" });
    }

    const tour = await TourRequest.findById(id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    if (tour.userId.toString() !== req.user!._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this tour" });
    }

    tour.status = "canceled";
    await tour.save();

    res.json({ message: "Tour canceled", tour });
  } catch (err: any) {
    console.error("Cancel tour error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
