import asyncHandler from "../utils/asyncHandler.js";
import Refund from "../models/refund.model.js";
import Booking from "../models/booking.model.js";
import Trip from "../models/trip.model.js";

export const getAll = asyncHandler(async (req, res) => {
    const refunds = await Refund.find()
        .populate("user")
        .populate({
            path: "booking",
            populate: {
                path: "trip",
                populate: [
                    { path: "journey" },
                    { path: "bus" },
                    { path: "staff" },
                    { path: "fareRule" }
                ]
            }
        });
    return res.json(refunds);
});

export const getOne = asyncHandler(async (req, res) => {
    const refund = await Refund.findById(req.params.id)
        .populate("user")
        .populate({
            path: "booking",
            populate: {
                path: "trip",
                populate: [
                    { path: "journey" },
                    { path: "bus" },
                    { path: "staff" },
                    { path: "fareRule" }
                ]
            }
        });
    if (!refund) {
        return res.status(404).json({ message: "Không tìm thấy yêu cầu hoàn tiền" });
    }
    return res.json(refund);
});

export const createOne = asyncHandler(async (req, res) => {
    const { booking, user, bankName, accountNumber, accountName, amount, reason } = req.body;

    // 1. Kiểm tra đơn đặt vé tồn tại
    const bookingObj = await Booking.findById(booking);
    if (!bookingObj) {
        return res.status(400).json({ message: "Không tìm thấy thông tin đơn đặt vé!" });
    }

    // 2. Kiểm tra trạng thái đơn đặt vé
    if (bookingObj.status === "Yêu cầu hoàn tiền" || bookingObj.status === "Đã hoàn tiền") {
        return res.status(400).json({ message: "Đơn đặt vé này đã được yêu cầu hủy/hoàn tiền trước đó!" });
    }
    if (bookingObj.status === "Đã huỷ") {
        return res.status(400).json({ message: "Đơn đặt vé này đã bị hủy trước đó!" });
    }

    // 3. Kiểm tra thời gian khởi hành (chính sách hủy vé trước tối thiểu 2 tiếng)
    const tripObj = await Trip.findById(bookingObj.trip);
    if (tripObj) {
        const now = new Date();
        const depTime = new Date(tripObj.departureTime);
        const diffHours = (depTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 2) {
            return res.status(400).json({ 
                message: "Không thể hủy vé! Bạn chỉ được phép hủy vé trước giờ khởi hành tối thiểu 2 tiếng." 
            });
        }
    }

    // 4. Tạo bản ghi Refund
    const refund = await Refund.create({
        booking,
        user,
        bankName,
        accountNumber,
        accountName,
        amount,
        reason: reason || "",
        status: "Chờ hoàn tiền",
        requestedAt: new Date()
    });

    // 5. Cập nhật trạng thái của Booking và giải phóng ghế của chuyến đi
    bookingObj.status = "Yêu cầu hoàn tiền";
    await bookingObj.save();

    if (tripObj) {
        tripObj.seats.forEach((seat) => {
            if (bookingObj.seats.includes(seat.seatCode)) {
                seat.status = "AVAILABLE";
                seat.heldBy = null;
                seat.expiresAt = null;
            }
        });
        await tripObj.save();
    }

    return res.status(201).json({
        message: "Tạo yêu cầu hoàn tiền thành công",
        data: refund
    });
});

export const updateOne = asyncHandler(async (req, res) => {
    const refund = await Refund.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    if (!refund) {
        return res.status(404).json({ message: "Không tìm thấy yêu cầu hoàn tiền" });
    }

    // Nếu cập nhật trạng thái thành Đã hoàn tiền, cập nhật Booking tương ứng
    if (req.body.status === "Đã hoàn tiền" || refund.status === "Đã hoàn tiền") {
        await Booking.findByIdAndUpdate(refund.booking, { status: "Đã hoàn tiền" });
    }

    return res.json({
        message: "Cập nhật yêu cầu hoàn tiền thành công",
        data: refund
    });
});

export const deleteOne = asyncHandler(async (req, res) => {
    const refund = await Refund.findByIdAndDelete(req.params.id);
    if (!refund) {
        return res.status(404).json({ message: "Không tìm thấy yêu cầu hoàn tiền" });
    }
    return res.json({ message: "Xóa yêu cầu hoàn tiền thành công" });
});
