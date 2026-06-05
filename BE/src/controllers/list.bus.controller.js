import Bus from "../models/bus.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAll = asyncHandler(async (req, res) => {
    const bus = await Bus.find();
    return res.json(bus)
})