import { Request, Response } from "express";
import Property from "../models/Property";

export const createProperty = async (req: Request, res: Response) => {
  const { title, description, images, price, location } = req.body;
  const property = await Property.create({
    title,
    description,
    images,
    price,
    location,
    createdBy: req.user!._id,
  });
  res.status(201).json(property);
};

export const getProperties = async (req: Request, res: Response) => {
  const properties = await Property.find();
  res.json(properties);
};

export const getPropertyById = async (req: Request, res: Response) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: "Property not found" });
  res.json(property);
};