import asyncHandler from "../utils/asyncHandler.js";
import Booking from "../models/booking.model.js";
import Trip from "../models/trip.model.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
    try {
        // Tổng số lượt đặt vé (Total bookings)
        const totalBookings = await Booking.countDocuments();

        // Trạng thái booking hợp lệ (không tính đã huỷ, hoàn tiền)
        const validStatuses = ["Đã xác nhận", "Đã check-in", "Đã checkin", "Chờ xác nhận"];

        // Tổng lượt đi mới / Total confirmed bookings (New/Confirmed Bookings)
        const newBookings = await Booking.countDocuments({ status: { $in: ["Đã xác nhận", "Đã check-in", "Đã checkin"] } });

        // Tổng doanh thu (Total Revenue) - chỉ tính booking hợp lệ
        const validBookings = await Booking.find({ status: { $in: validStatuses } });
        const totalRevenue = validBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

        // Tổng chuyến xe chạy (Total trips)
        const totalTrips = await Trip.countDocuments();

        return res.status(200).json({
            message: "Lấy dữ liệu thống kê thành công",
            data: {
                totalBookings,
                newBookings,
                totalRevenue,
                totalTrips
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi khi lấy dữ liệu thống kê",
            error: error.message
        });
    }
});
