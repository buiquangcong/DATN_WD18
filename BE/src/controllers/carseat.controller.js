import asyncHandler from "../utils/asyncHandler.js";
import Bus from "../models/bus.model.js";
import Carseat from "../models/carseat.model.js";
import generateSeats from "../utils/seatGenerator.js";

export const createSchedule = asyncHandler(async (req, res) => {
    const { tripId } = req.body;

    const trip = await Carseat.findById(tripId).populate("busId");
    
    if (!trip) {
        return res.status(442).json({ 
            success: false, 
            message: "Không tìm thấy chuyến đi (Trip) tương ứng với ID đã cung cấp." 
        });
    }

    const bus = trip.busId;
    if (!bus) {
        return res.status(442).json({ 
            success: false, 
            message: "Không tìm thấy thông tin xe khách được gán cho chuyến đi này." 
        });
    }

    const autoSeats = generateSeats(bus.capacity, bus.type);
    if (autoSeats.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Cấu hình xe của chuyến đi này không hợp lệ để tự động tạo sơ đồ ghế." 
        });
    }

    trip.seats = autoSeats;
    await trip.save();

    return res.status(200).json({ 
        success: true, 
        message: `Tự động tạo sơ đồ gồm ${autoSeats.length} ghế cho chuyến đi thành công!`, 
        data: trip 
    });
});

export const getSeats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const now = new Date();

    const carseat = await Carseat.findById(id);
    if (!carseat) {
        return res.status(404).json({ success: false, message: "Lịch trình không tồn tại." });
    }

    let hasChanges = false;
    carseat.seats.forEach(seat => {
        if (seat.status === 'HOLDING' && seat.expiresAt && seat.expiresAt < now) {
            seat.status = 'AVAILABLE';
            seat.heldBy = null;
            seat.expiresAt = null;
            hasChanges = true;
        }
    });

    if (hasChanges) {
        await carseat.save();
    }

    return res.status(200).json({ success: true, data: carseat.seats });
});

export const getAllTrips = asyncHandler(async (req, res) => {
    const trips = await Carseat.find()
        .populate("journeyId")
        .populate("busId", "name licensePlates capacity type status");

    return res.status(200).json({
        success: true,
        count: trips.length,
        data: trips
    });
});

export const generateSeatsForExistingTrip = asyncHandler(async (req, res) => {
    const { tripId } = req.body;

    const trip = await Carseat.findById(tripId).populate("busId");
    
    if (!trip) {
        return res.status(404).json({ 
            success: false, 
            message: "Không tìm thấy chuyến đi (Trip) tương ứng." 
        });
    }

    const { capacity, type } = trip.busId;

    const autoSeats = generateSeats(capacity, type);
    if (autoSeats.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Cấu hình xe của chuyến đi này không hợp lệ để tự động tạo sơ đồ ghế." 
        });
    }

    trip.seats = autoSeats;
    await trip.save();

    return res.status(200).json({
        success: true,
        message: `Đã khởi tạo sơ đồ gồm ${autoSeats.length} ghế tự động cho Trip thành công!`,
        data: trip
    });
});