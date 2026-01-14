import { Request, Response } from "express";
import TourRequest from "../models/TourRequest";

export const requestTour = async (req: Request, res: Response) => {
  const { propertyId, type } = req.body;
  const tour = await TourRequest.create({
    propertyId,
    userId: req.user!._id,
    type,
  });
  res.status(201).json(tour);
};

export const getAllTours = async (req: Request, res: Response) => {
  const tours = await TourRequest.find().populate("userId propertyId");
  res.json(tours);
};

export const approveTour = async (req: Request, res: Response) => {
  const tour = await TourRequest.findById(req.params.id);
  if (!tour) return res.status(404).json({ message: "Tour not found" });
  tour.status = req.body.status; // approved/rejected
  tour.approvedBy = req.user!._id;
  await tour.save();
  res.json(tour);
};