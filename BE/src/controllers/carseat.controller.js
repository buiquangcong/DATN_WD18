import asyncHandler from "../utils/asyncHandler.js";
import Bus from "../models/bus.model.js";
import Carseat from "../models/carseat.model.js";
import generateSeats from "../utils/seatGenerator.js";

// 1. API Tạo lịch trình chuyến đi
export const createSchedule = asyncHandler(async (req, res) => {
    const { tripId } = req.body;

    // 1. Tìm chuyến đi dựa theo tripId và lôi luôn thông tin xe (Bus) đi kèm ra
    const trip = await Carseat.findById(tripId).populate("busId");
    
    // Kiểm tra xem chuyến đi (Trip) có tồn tại không
    if (!trip) {
        return res.status(442).json({ 
            success: false, 
            message: "Không tìm thấy chuyến đi (Trip) tương ứng với ID đã cung cấp." 
        });
    }

    // 2. Kiểm tra xem chiếc xe gán với chuyến đi này có tồn tại không
    const bus = trip.busId;
    if (!bus) {
        return res.status(442).json({ 
            success: false, 
            message: "Không tìm thấy thông tin xe khách được gán cho chuyến đi này." 
        });
    }

    // 3. Chạy hàm helper sinh mảng ghế dựa trên cấu hình thật của xe (capacity, type)
    const autoSeats = generateSeats(bus.capacity, bus.type);
    if (autoSeats.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Cấu hình xe của chuyến đi này không hợp lệ để tự động tạo sơ đồ ghế." 
        });
    }

    // 4. Nạp mảng ghế vừa tự động tạo vào trường seats của chính Trip này và lưu lại
    trip.seats = autoSeats;
    await trip.save();

    return res.status(200).json({ 
        success: true, 
        message: `Tự động tạo sơ đồ gồm ${autoSeats.length} ghế cho chuyến đi thành công!`, 
        data: trip 
    });
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

// 3. API Lấy danh sách tất cả các chuyến đi (Gom ID của chuyến, chặng đường và thông tin xe)
export const getAllTrips = asyncHandler(async (req, res) => {
    // find() lấy hết các chuyến, populate liên kết dữ liệu sang các bảng tương ứng
    const trips = await Carseat.find()
        .populate("journeyId") // Lấy chi tiết thông tin điểm đi, điểm đến, giá vé... từ model Journey
        .populate("busId", "name licensePlates capacity type status"); // Lấy các trường cần thiết từ model Bus

    return res.status(200).json({
        success: true,
        count: trips.length,
        data: trips
    });
});

export const generateSeatsForExistingTrip = asyncHandler(async (req, res) => {
    const { tripId } = req.body; // Hoặc lấy từ req.params tùy bạn cấu hình route

    // 1. Tìm Trip dựa theo ID và lôi luôn thông tin xe (Bus) ra để check số chỗ
    const trip = await Carseat.findById(tripId).populate("busId");
    
    if (!trip) {
        return res.status(404).json({ 
            success: false, 
            message: "Không tìm thấy chuyến đi (Trip) tương ứng." 
        });
    }

    // 2. Lấy thông tin capacity và type từ chiếc xe thuộc trip này
    const { capacity, type } = trip.busId;

    // 3. Chạy hàm helper để sinh ra mảng ghế phù hợp (45 chỗ Seater hoặc 38 chỗ Sleeper)
    const autoSeats = generateSeats(capacity, type);
    if (autoSeats.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Cấu hình xe của chuyến đi này không hợp lệ để tự động tạo sơ đồ ghế." 
        });
    }

    // 4. Cập nhật mảng ghế vừa sinh vào trường 'seats' của chính Trip này
    trip.seats = autoSeats;
    await trip.save();

    return res.status(200).json({
        success: true,
        message: `Đã khởi tạo sơ đồ gồm ${autoSeats.length} ghế tự động cho Trip thành công!`,
        data: trip
    });
});