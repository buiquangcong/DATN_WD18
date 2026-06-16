import asyncHandler from "../utils/asyncHandler.js";
import Trip from "../models/trip.model.js";
import Bus from "../models/bus.model.js"; 
import generateSeats from "../utils/seatGenerator.js"; 


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

    const { journey, bus, departureTime } = req.body; 

  
    const busInfo = await Bus.findById(bus);
    if (!busInfo) {
        return res.status(422).json({
            success: false,
            message: "Không tìm thấy thông tin xe khách tương ứng để tự động sinh ghế."
        });
    }


    const autoSeats = generateSeats(busInfo.capacity, busInfo.type);
    if (autoSeats.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Cấu hình số chỗ hoặc loại xe không hợp lệ, không thể sinh sơ đồ ghế."
        });
    }

    const trip = await Trip.create({
        journey,
        bus,
        departureTime,
        seats: autoSeats 
    });

    return res.status(201).json({
        message: "Thêm chuyến xe và tự động kích hoạt sơ đồ ghế thành công!",
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