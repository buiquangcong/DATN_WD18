import asyncHandler from "../utils/asyncHandler";
import Trip from "../models/trip.model";

export const getAll = asyncHandler(async (req, res) => {
    const trips = await Trip.find()
        .populate("journey")
        .populate("bus");

    return res.json(trips);
});

export const getOne = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id)
        .populate("journey")
        .populate("bus");

    if (!trip) {
        return res.status(404).json({
            message: "Không tìm thấy chuyến xe"
        });
    }

    return res.json(trip);
});

export const createOne = asyncHandler(async (req, res) => {
    const trip = await Trip.create(req.body);

    return res.status(201).json({
        message: "Thêm chuyến xe thành công",
        data: trip
    });
});

export const updateOne = asyncHandler(async (req, res) => {
    const trip = await Trip.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    if (!trip) {
        return res.status(404).json({
            message: "Không tìm thấy chuyến xe"
        });
    }

    return res.json({
        message: "Cập nhật chuyến xe thành công",
        data: trip
    });
});

export const deleteOne = asyncHandler(async (req, res) => {
    const trip = await Trip.findByIdAndDelete(req.params.id);

    if (!trip) {
        return res.status(404).json({
            message: "Không tìm thấy chuyến xe"
        });
    }

    return res.json({
        message: "Xóa chuyến xe thành công"
    });
});