import Bus from "../models/bus.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAll = asyncHandler(async (req, res) => {
    const bus = await Bus.find();
    return res.json(bus)
})
export const createOne = asyncHandler(async (req, res) => {
    try {
        const bus = await Bus.create(req.body);
        return res.json(bus);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Biển số xe đã tồn tại!"
            });
        }
        throw error;
    }
})
export const updateOne = asyncHandler(async (req, res) => {
    try {
        const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        return res.json(bus);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Biển số xe đã tồn tại!"
            });
        }
        throw error;
    }
})
export const deleteOne = asyncHandler(async (req, res) => {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    return res.json(bus)
})