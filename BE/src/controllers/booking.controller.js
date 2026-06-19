import asyncHandler from "../utils/asyncHandler.js";
import Booking from "../models/booking.model.js";
import Trip from "../models/trip.model.js";

export const getAll = asyncHandler(async (req, res) => {
    const bookings = await Booking.find()
        .populate("user")
        .populate({
            path: "trip",
            populate: [
                { path: "journey" },
                { path: "bus" },
                {path: "staff"}
            ]
        });

    return res.json(bookings);
});

export const getOne = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate("user")
        .populate({
            path: "trip",
            populate: [
                { path: "journey" },
                { path: "bus" },
                {path: "staff"}
            ]
        });

    if (!booking) {
        return res.status(404).json({
            message: "Không tìm thấy đơn đặt vé"
        });
    }

    return res.json(booking);
});

export const createOne = asyncHandler(async (req, res) => {
    const { user, trip, seats } = req.body;

    const tripData = await Trip.findById(trip)
        .populate("journey");

    if (!tripData) {
        return res.status(404).json({
            message: "Không tìm thấy chuyến xe"
        });
    }

    // Kiểm tra ghế đã được đặt chưa
    for (const seatCode of seats) {
        const seat = tripData.seats.find(
            s => s.seatCode === seatCode
        );

        if (!seat) {
            return res.status(400).json({
                message: `Ghế ${seatCode} không tồn tại`
            });
        }

        if (seat.status === "BOOKED") {
            return res.status(400).json({
                message: `Ghế ${seatCode} đã được đặt`
            });
        }
    }

    // Đánh dấu ghế đã đặt
    tripData.seats.forEach(seat => {
        if (seats.includes(seat.seatCode)) {
            seat.status = "BOOKED";
        }
    });

    await tripData.save();

    const totalPrice =
        tripData.journey.price * seats.length;

    const booking = await Booking.create({
        user,
        trip,
        seats,
        totalPrice
    });

    return res.status(201).json({
        message: "Đặt vé thành công",
        data: booking
    });
});

export const updateOne = asyncHandler(async (req, res) => {
    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    if (!booking) {
        return res.status(404).json({
            message: "Không tìm thấy đơn đặt vé"
        });
    }

    return res.json({
        message: "Cập nhật thành công",
        data: booking
    });
});

export const deleteOne = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(
        req.params.id
    );

    if (!booking) {
        return res.status(404).json({
            message: "Không tìm thấy đơn đặt vé"
        });
    }

    const trip = await Trip.findById(
        booking.trip
    );

    if (trip) {
        trip.seats.forEach((seat) => {
            if (
                booking.seats.includes(
                    seat.seatCode
                )
            ) {
                seat.status = "AVAILABLE";
            }
        });

        await trip.save();
    }

    await Booking.findByIdAndDelete(
        req.params.id
    );

    return res.json({
        message:
            "Xóa đơn đặt vé thành công"
    });
});