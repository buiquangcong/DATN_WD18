import { PayOS } from "@payos/node";
import asyncHandler from "../utils/asyncHandler.js";
import Booking from "../models/booking.model.js";
import Trip from "../models/trip.model.js";

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
                { path: "staff" }
                {path: "staff"},
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
                { path: "staff" }
                {path: "staff"},
                { path: "fareRule" }
            ]
        });

    if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy đơn đặt vé" });
    }
    return res.json(booking);
});

// 🌟 ĐÃ CẬP NHẬT: Hàm tạo đơn hàng tích hợp PayOS
export const createOne = asyncHandler(async (req, res) => {
    const { user, trip, seats } = req.body;

    const tripData = await Trip.findById(trip).populate("journey");
    const tripData = await Trip.findById(trip)
        .populate("journey")
        .populate("fareRule");

    if (!tripData) {
        return res.status(404).json({ message: "Không tìm thấy chuyến xe" });
    }

    // 1. Kiểm tra ghế xem có tồn tại hoặc đang bị ĐẶT/GIỮ không
    for (const seatCode of seats) {
        const seat = tripData.seats.find(s => s.seatCode === seatCode);

        if (!seat) {
            return res.status(400).json({ message: `Ghế ${seatCode} không tồn tại` });
        }

        // Chặn nếu ghế đã bị BOOKED hoặc đang được người khác HOLDING
        if (seat.status === "BOOKED" || seat.status === "HOLDING") {
            return res.status(400).json({ message: `Ghế ${seatCode} đã có người đặt hoặc đang được giữ` });
        }
    }

    // 2. Tính toán tổng tiền dựa trên Database gốc
    const totalPrice = tripData.journey.price * seats.length;

    // 3. Sinh mã số đơn hàng ngẫu nhiên kiểu số (Bắt buộc cho PayOS)
    const myOrderCode = Math.floor(100000 + Math.random() * 900000);

    // 4. Cấu hình nội dung chuyển khoản QR chứa Số Ghế (Tối đa 25 ký tự)
    const seatString = seats.join("-");
    const customDescription = `Ghe-${seatString}`.slice(0, 25);

    const paymentBody = {
        orderCode: myOrderCode,
        amount: totalPrice,
        description: customDescription,
        cancelUrl: "http://localhost:5173/khachhang/booking/cancel",
        returnUrl: `http://localhost:5173/khachhang/booking/success?orderCode=${myOrderCode}`
    };

    // Gọi API PayOS tạo link thanh toán trước để đảm bảo an toàn
    const paymentLinkData = await payos.paymentRequests.create(paymentBody);

    // 5. Nếu PayOS tạo link thành công -> Đổi trạng thái các ghế sang "HOLDING" (Giữ ghế)
    const minutesToHold = 5; // Giữ ghế trong 5 phút
    tripData.seats.forEach(seat => {
        if (seats.includes(seat.seatCode)) {
            seat.status = "HOLDING";
            seat.heldBy = user;
            seat.expiresAt = new Date(Date.now() + minutesToHold * 60 * 1000); 
        }
    });
    await tripData.save();

    // 6. Tạo đơn Booking mới vào MongoDB với trạng thái mặc định "Chờ xác nhận"
const departureDate = new Date(
  tripData.departureTime
);

let ticketPrice =
  tripData.fareRule.weekdayPrice;

if (
  departureDate.getDay() === 0 ||
  departureDate.getDay() === 6
) {
  ticketPrice =
    tripData.fareRule.weekendPrice;
}

const totalPrice =
  ticketPrice * seats.length;

    const booking = await Booking.create({
        user,
        trip,
        seats,
        totalPrice,
        orderCode: myOrderCode,
        status: "Chờ xác nhận"
    });

    // 🌟 7. LUỒNG TỰ ĐỘNG NHẢ GHẾ SAU 5 PHÚT NẾU CHƯA THANH TOÁN
    setTimeout(async () => {
        try {
            const checkBooking = await Booking.findById(booking._id);
            // Nếu quá 5 phút mà trạng thái đơn vẫn chưa chuyển sang "Đã xác nhận"
            if (checkBooking && checkBooking.status === "Chờ xác nhận") {
                checkBooking.status = "Đã hủy";
                await checkBooking.save();

                // Giải phóng ghế trong Trip về AVAILABLE
                await Trip.updateOne(
                    { _id: booking.trip },
                    { 
                        $set: { 
                            "seats.$[elem].status": "AVAILABLE",
                            "seats.$[elem].heldBy": null,
                            "seats.$[elem].expiresAt": null
                        } 
                    },
                    { arrayFilters: [{ "elem.seatCode": { $in: booking.seats } }] }
                );
                console.log(`[Hết hạn 5p] Đơn hàng ${myOrderCode} đã quá hạn. Hệ thống tự động nhả ghế.`);
            }
        } catch (timeoutError) {
            console.error("Lỗi trong quá trình tự động nhả ghế:", timeoutError);
        }
    }, minutesToHold * 60 * 1000);

    // 8. Trả checkoutUrl về cho React chuyển hướng
    return res.status(201).json({
        message: "Khởi tạo thanh toán thành công",
        checkoutUrl: paymentLinkData.checkoutUrl,
        data: booking
    });
});

export const handlePayOSWebhook = asyncHandler(async (req, res) => {
    try {
        // 1. Giải mã dữ liệu an toàn từ PayOS
        const webhookData = payos.webhooks.verify(req.body);
        
        // 2. Ép mã đơn hàng về dạng Number/String đồng bộ để truy vấn chắc chắn
        const orderCodeReceived = webhookData.orderCode;

        console.log(`[PayOS Webhook Triggered] Đang xử lý cho mã đơn: ${orderCodeReceived}`);

        // 3. Sử dụng update trực tiếp vào DB để đảm bảo cập nhật vĩnh viễn
        const booking = await Booking.findOneAndUpdate(
            { orderCode: orderCodeReceived, status: "Chờ xác nhận" },
            { $set: { status: "Đã xác nhận" } },
            { new: true } // Trả về dữ liệu sau khi đã update
        );

        // Nếu tìm thấy đơn hàng cần cập nhật
        if (booking) {
            // 4. Cập nhật trạng thái ghế vĩnh viễn thành "BOOKED" trong bảng Trip sử dụng toán tử Mongo
            // Cách này tối ưu hơn forEach vì tác động thẳng vào lõi Database
            await Trip.updateOne(
                { _id: booking.trip },
                { 
                    $set: { 
                        "seats.$[elem].status": "BOOKED",
                        "seats.$[elem].expiresAt": null
                    } 
                },
                { 
                    arrayFilters: [{ "elem.seatCode": { $in: booking.seats } }] 
                }
            );

            console.log(`[PayOS Webhook Thành Công] Đơn ${orderCodeReceived} và các ghế [${booking.seats.join(", ")}] đã chuyển sang BOOKED.`);
        } else {
            console.log(`[PayOS Webhook Bỏ Qua] Đơn ${orderCodeReceived} không tồn tại hoặc đã được xử lý từ trước.`);
        }
        
        // BẮT BUỘC: Phải trả về trạng thái 200 OK để PayOS biết hệ thống của bạn đã xử lý xong và không gửi lại webhook nữa
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("[PayOS Webhook Error]:", error);
        return res.status(400).send("Invalid webhook signature");
    }
});

export const updateOne = asyncHandler(async (req, res) => {
    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy đơn đặt vé" });
    }

    return res.json({ message: "Cập nhật thành công", data: booking });
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
            }
        });
        await trip.save();
    }

    await Booking.findByIdAndDelete(req.params.id);

    return res.json({ message: "Xóa đơn đặt vé thành công" });
});