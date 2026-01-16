"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelTour = exports.rescheduleTour = exports.approveTour = exports.getAllTours = exports.getUserTours = exports.requestTour = void 0;
const TourRequest_1 = __importDefault(require("../models/TourRequest"));
// ============================
// REQUEST A TOUR (USER)
// ============================
const requestTour = async (req, res) => {
    try {
        const { propertyId, type, tourTime } = req.body;
        if (!propertyId || !type || !tourTime) {
            return res
                .status(400)
                .json({ message: "propertyId, type, and tourTime are required" });
        }
        const tour = await TourRequest_1.default.create({
            propertyId,
            userId: req.user._id,
            type,
            tourTime,
        });
        res.status(201).json({ message: "Tour requested", tour });
    }
    catch (err) {
        console.error("Request tour error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.requestTour = requestTour;
// ============================
// GET USER TOURS (PAGINATION, FILTERING, SORTING)
// ============================
const getUserTours = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10, sort = "-tourTime", } = req.query;
        const filter = { userId: req.user._id };
        if (status)
            filter.status = status;
        if (type)
            filter.type = type;
        const skip = (Number(page) - 1) * Number(limit);
        const tours = await TourRequest_1.default.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean()
            .populate("propertyId", "title address propertyType");
        const total = await TourRequest_1.default.countDocuments(filter);
        res.json({
            data: tours,
            meta: { page: Number(page), limit: Number(limit), total },
        });
    }
    catch (err) {
        console.error("Get user tours error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getUserTours = getUserTours;
// ============================
// GET ALL TOURS (ADMIN)
// ============================
const getAllTours = async (req, res) => {
    try {
        const { status, type, propertyId, page = 1, limit = 20, sort = "-tourTime", } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (type)
            filter.type = type;
        if (propertyId)
            filter.propertyId = propertyId;
        const skip = (Number(page) - 1) * Number(limit);
        const tours = await TourRequest_1.default.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean()
            .populate("propertyId", "title address propertyType")
            .populate("userId", "name email");
        const total = await TourRequest_1.default.countDocuments(filter);
        res.json({
            data: tours,
            meta: { page: Number(page), limit: Number(limit), total },
        });
    }
    catch (err) {
        console.error("Get all tours error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getAllTours = getAllTours;
// ============================
// APPROVE OR REJECT TOUR (ADMIN)
// ============================
const approveTour = async (req, res) => {
    try {
        const { status } = req.body; // approved or rejected
        if (!["approved", "rejected"].includes(status)) {
            return res
                .status(400)
                .json({ message: "Status must be 'approved' or 'rejected'" });
        }
        const tour = await TourRequest_1.default.findById(req.params.id);
        if (!tour)
            return res.status(404).json({ message: "Tour not found" });
        tour.status = status;
        tour.approvedBy = req.user._id;
        await tour.save();
        res.json({ message: "Tour updated", tour });
    }
    catch (err) {
        console.error("Approve tour error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.approveTour = approveTour;
// ============================
// RESCHEDULE TOUR (USER)
// ============================
const rescheduleTour = async (req, res) => {
    try {
        const { tourTime } = req.body;
        if (!tourTime)
            return res.status(400).json({ message: "tourTime is required" });
        const tour = await TourRequest_1.default.findById(req.params.id);
        if (!tour)
            return res.status(404).json({ message: "Tour not found" });
        if (tour.userId.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "Not authorized to reschedule this tour" });
        }
        tour.tourTime = tourTime;
        tour.rescheduled = true;
        tour.status = "pending"; // reset status after reschedule
        await tour.save();
        res.json({ message: "Tour rescheduled", tour });
    }
    catch (err) {
        console.error("Reschedule tour error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.rescheduleTour = rescheduleTour;
// ============================
// CANCEL TOUR (USER)
// ============================
const cancelTour = async (req, res) => {
    try {
        const tour = await TourRequest_1.default.findById(req.params.id);
        if (!tour)
            return res.status(404).json({ message: "Tour not found" });
        if (tour.userId.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "Not authorized to cancel this tour" });
        }
        tour.status = "canceled";
        await tour.save();
        res.json({ message: "Tour canceled", tour });
    }
    catch (err) {
        console.error("Cancel tour error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.cancelTour = cancelTour;
