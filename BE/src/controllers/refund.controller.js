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

    // 1. Tạo bản ghi Refund
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

    // 2. Cập nhật trạng thái của Booking và giải phóng ghế của chuyến đi
    const bookingObj = await Booking.findById(booking);
    if (bookingObj) {
        bookingObj.status = "Yêu cầu hoàn tiền";
        await bookingObj.save();

        const tripObj = await Trip.findById(bookingObj.trip);
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
