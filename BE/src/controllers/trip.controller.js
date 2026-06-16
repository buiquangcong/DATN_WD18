import asyncHandler from "../utils/asyncHandler.js";
import Trip from "../models/trip.model.js";
import Bus from "../models/bus.model.js"; // Import model Xe khách để check số ghế
import generateSeats from "../utils/seatGenerator.js"; // Import hàm helper sinh sơ đồ ghế của bạn

// [GET] /api/trips - Lấy danh sách tất cả các chuyến đi kèm thông tin tuyến và xe
export const getAll = asyncHandler(async (req, res) => {
    const trips = await Trip.find()
        .populate("journey")
        .populate("bus");

    return res.json(trips);
});

// [GET] /api/trips/:id - Lấy chi tiết 1 chuyến đi (FE dùng API này để lấy mảng 'seats' vẽ sơ đồ)
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

// [POST] /api/trips - TẠO CHUYẾN ĐI MỚI VÀ TỰ ĐỘNG KÍCH HOẠT SƠ ĐỒ GHẾ
export const createOne = asyncHandler(async (req, res) => {
    // 1. Nhận các trường dữ liệu được gửi lên từ client (Postman/Frontend Form)
    const { journey, bus, departureTime } = req.body; 

    // 2. Truy vấn vào database tìm xe khách tương ứng để đọc dữ liệu 'capacity' và 'type'
    const busInfo = await Bus.findById(bus);
    if (!busInfo) {
        return res.status(422).json({
            success: false,
            message: "Không tìm thấy thông tin xe khách tương ứng để tự động sinh ghế."
        });
    }

    // 3. Chạy hàm sinh ghế tự động dựa trên sức chứa và phân loại của xe vừa tìm thấy
    const autoSeats = generateSeats(busInfo.capacity, busInfo.type);
    if (autoSeats.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Cấu hình số chỗ hoặc loại xe không hợp lệ, không thể sinh sơ đồ ghế."
        });
    }

    // 4. Khởi tạo bản ghi chuyến đi mới và lưu trực tiếp mảng ghế trống vừa tạo vào trường seats
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

// [PUT] /api/trips/:id - Cập nhật thông tin chuyến đi
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

// [DELETE] /api/trips/:id - Xóa chuyến đi
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