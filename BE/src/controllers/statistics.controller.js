import asyncHandler from "../utils/asyncHandler.js";
import Booking from "../models/booking.model.js";
import Trip from "../models/trip.model.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
    try {
        // Tổng số lượt đặt vé (Total bookings)
        const totalBookings = await Booking.countDocuments();

        // Tổng lượt đi mới / Total confirmed bookings (New/Confirmed Bookings)
        const newBookings = await Booking.countDocuments({ status: "Đã xác nhận" });

        // Tổng doanh thu (Total Revenue)
        const confirmedBookings = await Booking.find({ status: "Đã xác nhận" });
        const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

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
