import { Request, Response } from "express";
import TourRequest from "../models/TourRequest";

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

    const tour = await TourRequest.create({
      propertyId,
      userId: req.user!._id,
      type,
      tourTime,
    });

    res.status(201).json({ message: "Tour requested", tour });
  } catch (err: any) {
    console.error("Request tour error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// GET USER TOURS (PAGINATION, FILTERING, SORTING)
// ============================
export const getUserTours = async (req: Request, res: Response) => {
  try {
    const { status, type, page = 1, limit = 10, sort = "-tourTime" } = req.query;

    const filter: any = { userId: req.user!._id };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const tours = await TourRequest.find(filter)
      .sort(sort as any)
      .skip(skip)
      .limit(Number(limit))
      .populate("propertyId", "title address propertyType price status images")
      .populate("userId", "name email avatarUrl role")
      .lean();

    const total = await TourRequest.countDocuments(filter);

    // Rename for frontend DX
    const formattedTours = tours.map((t) => ({
      ...t,
      user: t.userId,
      property: t.propertyId,
      userId: undefined,
      propertyId: undefined,
    }));

    res.json({
      data: formattedTours,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err: any) {
    console.error("Get user tours error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// GET ALL TOURS (ADMIN)
// ============================
export const getAllTours = async (req: Request, res: Response) => {
  try {
    const { status, type, propertyId, page = 1, limit = 20, sort = "-tourTime" } =
      req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (propertyId) filter.propertyId = propertyId;

    const skip = (Number(page) - 1) * Number(limit);

    const tours = await TourRequest.find(filter)
      .sort(sort as any)
      .skip(skip)
      .limit(Number(limit))
      .populate("propertyId", "title address propertyType price status images")
      .populate("userId", "name email avatarUrl role")
      .lean();

    const total = await TourRequest.countDocuments(filter);

    // Rename for frontend DX
    const formattedTours = tours.map((t) => ({
      ...t,
      user: t.userId,
      property: t.propertyId,
      userId: undefined,
      propertyId: undefined,
    }));

    res.json({
      data: formattedTours,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err: any) {
    console.error("Get all tours error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// APPROVE OR REJECT TOUR (ADMIN)
// ============================
export const approveTour = async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // approved or rejected
    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const tour = await TourRequest.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    tour.status = status;
    tour.approvedBy = req.user!._id;
    await tour.save();

    res.json({ message: "Tour updated", tour });
  } catch (err: any) {
    console.error("Approve tour error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// RESCHEDULE TOUR (USER)
// ============================
export const rescheduleTour = async (req: Request, res: Response) => {
  try {
    const { tourTime } = req.body;
    if (!tourTime)
      return res.status(400).json({ message: "tourTime is required" });

    const tour = await TourRequest.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    if (tour.userId.toString() !== req.user!._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to reschedule this tour" });
    }

    tour.tourTime = tourTime;
    tour.rescheduled = true;
    tour.status = "pending"; // reset status after reschedule
    await tour.save();

    res.json({ message: "Tour rescheduled", tour });
  } catch (err: any) {
    console.error("Reschedule tour error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// CANCEL TOUR (USER)
// ============================
export const cancelTour = async (req: Request, res: Response) => {
  try {
    const tour = await TourRequest.findById(req.params.id);
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
};