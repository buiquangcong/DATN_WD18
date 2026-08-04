import Bus from "../models/bus.model.js";
import Trip from "../models/trip.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAll = asyncHandler(async (req, res) => {
    const bus = await Bus.find();
    return res.json(bus);
});

export const createOne = asyncHandler(async (req, res) => {
    const bus = await Bus.create(req.body);
    return res.json(bus);
});

export const updateOne = asyncHandler(async (req, res) => {
    const bus = await Bus.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    return res.json(bus);
});

export const deleteOne = asyncHandler(async (req, res) => {
    const busId = req.params.id;

    // Kiểm tra xe đã được dùng trong chuyến nào chưa
    const trip = await Trip.findOne({ bus: busId });

    if (trip) {
        return res.status(400).json({
            message: "Xe đang được sử dụng trong chuyến đi, không thể xóa."
        });
    }

    const bus = await Bus.findByIdAndDelete(busId);

    if (!bus) {
        return res.status(404).json({
            message: "Không tìm thấy xe."
        });
    }

    return res.json({
        message: "Xóa xe thành công.",
        data: bus
    });
});