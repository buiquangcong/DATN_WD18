
import asyncHandler from "../utils/asyncHandler.js";
import Bus from "../models/bus.model.js";
import Carseat from "../models/carseat.model.js";
import generateSeats from "../utils/seatGenerator.js";

// 1. API Tạo lịch trình chuyến đi
export const createSchedule = asyncHandler(async (req, res) => {
    const { journeyId, busId, departureDate } = req.body;

    const bus = await Bus.findById(busId);
    if (!bus) {
        return res.status(404).json({ success: false, message: "Không tìm thấy xe khách tương ứng." });
    }

    const autoSeats = generateSeats(bus.capacity, bus.type);
    if (autoSeats.length === 0) {
        return res.status(400).json({ success: false, message: "Cấu hình xe không hợp lệ để tự động tạo sơ đồ ghế." });
    }

    const newCarseat = new Carseat({
        journeyId,
        busId,
        departureDate,
        seats: autoSeats
    });

    await newCarseat.save();
    return res.status(201).json({ success: true, message: "Tạo lịch trình thành công!", data: newCarseat });
});

// 2. API Lấy sơ đồ ghế và tự dọn dẹp các ghế giữ chỗ quá hạn 10 phút
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