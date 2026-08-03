import asyncHandler from "../utils/asyncHandler.js";
import Booking from "../models/booking.model.js";
import Trip from "../models/trip.model.js";
import ticketEventEmitter from "../utils/ticketEvent.js";
import { PayOS } from "@payos/node";

const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID || "6128c402-d9dc-48c1-9869-ba88b911c9ac",
    apiKey: process.env.PAYOS_API_KEY || "99d96ef6-648c-40a1-a67f-4469590cc270",
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || "1ea1ccf5137c5fb3f8d6a68613c9e43247d0cfa7830d604c5fcda03179a1370a"
});

export const getAll = asyncHandler(async (req, res) => {
    const bookings = await Booking.find()
        .populate("user")
        .populate({
            path: "trip",
            populate: [
                { path: "journey" },
                { path: "bus" },
                { path: "staff" },
                { path: "fareRule" }
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
                { path: "staff" },
                { path: "fareRule" }
            ]
        });

    if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy đơn đặt vé" });
    }
    return res.json(booking);
});

export const createOne = asyncHandler(async (req, res) => {
    const { user, trip, seats } = req.body;

    const tripData = await Trip.findById(trip)
        .populate("journey")
        .populate("fareRule");

    if (!tripData) {
        return res.status(404).json({ message: "Không tìm thấy chuyến xe" });
    }

    // 0. Giải phóng các ghế cũ từng được giữ bởi tài khoản này nhưng không nằm trong danh sách mới
    let hasChanges = false;
    tripData.seats.forEach(seat => {
        if (seat.status === "HOLDING" && seat.heldBy && seat.heldBy.toString() === user.toString()) {
            if (!seats.includes(seat.seatCode)) {
                seat.status = "AVAILABLE";
                seat.heldBy = null;
                seat.expiresAt = null;
                hasChanges = true;
            }
        }
    });
    if (hasChanges) {
        await tripData.save();
    }

    // 1. Kiểm tra trạng thái ghế trống (Cho phép chọn tiếp ghế đang được giữ bởi chính mình)
    for (const seatCode of seats) {
        const seat = tripData.seats.find(s => s.seatCode === seatCode);

        if (!seat) {
            return res.status(400).json({ message: `Ghế ${seatCode} không tồn tại` });
        }

        if (seat.status === "BOOKED") {
            return res.status(400).json({ message: `Ghế ${seatCode} đã có người đặt` });
        }

        if (seat.status === "HOLDING" && seat.heldBy && seat.heldBy.toString() !== user.toString()) {
            return res.status(400).json({ message: `Ghế ${seatCode} đang được giữ bởi người khác` });
        }
    }

    // 2. Tính toán đơn giá dựa trên quy định FareRule (Ngày thường vs Cuối tuần)
    const departureDate = new Date(tripData.departureTime);
    let ticketPrice = tripData.journey?.price || 0;

    if (tripData.fareRule) {
        if (departureDate.getDay() === 0 || departureDate.getDay() === 6) {
            ticketPrice = tripData.fareRule.weekendPrice;
        } else {
            ticketPrice = tripData.fareRule.weekdayPrice;
        }
    }
    const totalPrice = ticketPrice * seats.length;

    // Sinh mã số đơn hàng ngẫu nhiên kiểu số để đồng bộ với cổng PayOS
    const myOrderCode = Math.floor(100000 + Math.random() * 900000);

    // 3. Đổi trạng thái các ghế sang "HOLDING" (Giữ ghế tạm thời)
    const minutesToHold = 5; 
    tripData.seats.forEach(seat => {
        if (seats.includes(seat.seatCode)) {
            seat.status = "HOLDING";
            seat.heldBy = user;
            seat.expiresAt = new Date(Date.now() + minutesToHold * 60 * 1000); 
        }
    });
    await tripData.save();

    // 4. Khởi tạo đơn Booking mới vào MongoDB với trạng thái mặc định "Chờ xác nhận"
    const booking = await Booking.create({
        user,
        trip,
        seats,
        totalPrice,
        orderCode: myOrderCode,
        status: "Chờ xác nhận"
    });



    // 6. Luồng chạy ngầm tự động nhả ghế + Hủy link PayOS sau 5 phút
    setTimeout(async () => {
        try {
            const checkBooking = await Booking.findById(booking._id);
            
            // Nếu quá 5 phút mà đơn vẫn ở trạng thái chờ xử lý ban đầu
            if (checkBooking && (checkBooking.status === "Chờ xác nhận" || checkBooking.status === "PENDING")) {
                
                // Cập nhật trạng thái đơn sang "Đã huỷ" trực tiếp qua bộ lõi updateOne
                await Booking.updateOne(
                    { _id: booking._id },
                    { $set: { status: "Đã huỷ" } } 
                );

                // Trả các ghế về trạng thái trống "AVAILABLE" nếu hạn giữ thực sự đã hết
                await Trip.updateOne(
                    { _id: booking.trip },
                    { 
                        $set: { 
                            "seats.$[elem].status": "AVAILABLE",
                            "seats.$[elem].heldBy": null,
                            "seats.$[elem].expiresAt": null
                        } 
                    },
                    { 
                        arrayFilters: [
                            { 
                                "elem.seatCode": { $in: booking.seats },
                                "elem.heldBy": booking.user,
                                "elem.expiresAt": { $lte: new Date() }
                            }
                        ] 
                    }
                );

                // Hủy bỏ link thanh toán từ xa trên PayOS
                try {
                    await payos.cancelPaymentLink(myOrderCode, "Quá hạn 5 phút không thanh toán");
                    console.log(`[PayOS Hủy Link] Đã đóng link QR thành công cho mã đơn: ${myOrderCode}`);
                } catch (payosCancelError) {
                    console.error("Lỗi khi gửi yêu cầu hủy link lên hệ thống PayOS:", payosCancelError.message);
                }

                console.log(`[Hết hạn 5p] Đơn hàng ${myOrderCode} tự động giải phóng cụm ghế [${seats.join(", ")}].`);
            }
        } catch (timeoutError) {
            console.error("Lỗi trong quá trình xử lý đếm ngược tự động nhả ghế:", timeoutError);
        }
    }, minutesToHold * 60 * 1000);

    // 7. Trả dữ liệu về cho React (React sẽ lấy data._id hoặc link chuyển tiếp sang PayOS)
    return res.status(201).json({
        message: "Đặt vé thành công, đang chờ thanh toán",
        data: booking
    });
});
export const updateOne = asyncHandler(async (req, res) => {
    // Nếu chuyển trạng thái sang Đã huỷ hoặc Yêu cầu hoàn tiền, tiến hành giải phóng ghế trong Trip
    if (req.body.status === "Đã huỷ" || req.body.status === "Yêu cầu hoàn tiền") {
        const bookingObj = await Booking.findById(req.params.id);
        if (bookingObj && bookingObj.status !== "Đã huỷ" && bookingObj.status !== "Yêu cầu hoàn tiền" && bookingObj.status !== "Đã hoàn tiền") {
            const trip = await Trip.findById(bookingObj.trip);
            if (trip) {
                trip.seats.forEach((seat) => {
                    if (bookingObj.seats.includes(seat.seatCode)) {
                        seat.status = "AVAILABLE";
                        seat.heldBy = null;
                        seat.expiresAt = null;
                    }
                });
                await trip.save();
            }
        }
    }

    // Nếu chuyển trạng thái sang Đã xác nhận, Đã checkin hoặc Hoàn thành, tiến hành đặt ghế chính thức (BOOKED) trong Trip
    if (req.body.status === "Đã xác nhận" || req.body.status === "Đã checkin" || req.body.status === "Hoàn thành") {
        const bookingObj = await Booking.findById(req.params.id);
        if (bookingObj) {
            const trip = await Trip.findById(bookingObj.trip);
            if (trip) {
                trip.seats.forEach((seat) => {
                    if (bookingObj.seats.includes(seat.seatCode)) {
                        seat.status = "BOOKED";
                        seat.heldBy = null;
                        seat.expiresAt = null;
                    }
                });
                await trip.save();
            }
        }
    }

    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy đơn đặt vé" });
    }

    return res.json({
        message: "Cập nhật thành công",
        data: booking
    });
});

export const deleteOne = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy đơn đặt vé" });
    }

    const trip = await Trip.findById(booking.trip);

    if (trip) {
        trip.seats.forEach((seat) => {
            if (booking.seats.includes(seat.seatCode)) {
                seat.status = "AVAILABLE";
                seat.heldBy = null;
                seat.expiresAt = null;
            }
        });
        await trip.save();

        
    }

    await Booking.findByIdAndDelete(req.params.id);

    return res.json({ message: "Xóa đơn đặt vé thành công" });
});