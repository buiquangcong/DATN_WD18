import { PayOS } from "@payos/node";
import asyncHandler from "../utils/asyncHandler.js";
import Booking from "../models/booking.model.js";
import Trip from "../models/trip.model.js";
import ticketEventEmitter from "../utils/ticketEvent.js";

const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID || "6128c402-d9dc-48c1-9869-ba88b911c9ac",
    apiKey: process.env.PAYOS_API_KEY || "99d96ef6-648c-40a1-a67f-4469590cc270",
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || "1ea1ccf5137c5fb3f8d6a68613c9e43247d0cfa7830d604c5fcda03179a1370a"
});

// Hàm tạo link thanh toán từ đơn Booking đã có sẵn
export const createPaymentLink = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy đơn đặt vé để thanh toán" });
    }

    if (booking.status !== "Chờ xác nhận") {
        return res.status(400).json({ message: "Đơn hàng này không ở trạng thái chờ thanh toán" });
    }

    // Cấu hình nội dung QR chứa Số Ghế
    const seatString = booking.seats.join("-");
    const customDescription = `Ghe-${seatString}`.slice(0, 25);

    const paymentBody = {
        orderCode: booking.orderCode,
        amount: booking.totalPrice,
        description: customDescription,
        cancelUrl: "http://localhost:5173/khachhang/booking/cancel",
        returnUrl: `http://localhost:5173/khachhang/booking/success?orderCode=${booking.orderCode}`
    };

    const paymentLinkData = await payos.paymentRequests.create(paymentBody);

    return res.status(200).json({
        message: "Tạo link thanh toán thành công",
        checkoutUrl: paymentLinkData.checkoutUrl
    });
});

// Hàm Webhook xử lý dữ liệu thanh toán từ PayOS bắn về
export const handlePayOSWebhook = asyncHandler(async (req, res) => {
    try {
        // 1. Giải mã và verify webhook từ PayOS
        const webhookData = await payos.webhooks.verify(req.body); 
        
        // Trích xuất mã số đơn hàng
        const orderCodeReceived = webhookData?.orderCode;

        if (!orderCodeReceived) {
            console.log("[PayOS Webhook] Không tìm thấy thuộc tính orderCode trong dữ liệu giải mã.", webhookData);
            return res.status(400).send("Missing orderCode in webhook payload");
        }

        console.log(`[PayOS Webhook Triggered] Nhận dữ liệu webhook thành công cho mã đơn: ${orderCodeReceived}`);

        // 2. Cập nhật trạng thái Booking sang "Đã xác nhận"
        // 🌟 SỬA TẠI ĐÂY: Thêm .populate("user") để Mail Controller đọc được trường .email và .username
        const booking = await Booking.findOneAndUpdate(
            { orderCode: Number(orderCodeReceived) },
            { $set: { status: "Đã xác nhận" } }, 
            { new: true }
        ).populate("user");

        if (booking) {
            // 3. Cập nhật trạng thái ghế từ HOLDING sang BOOKED chính thức và lấy thông tin Tuyến đường (journey)
            const tripData = await Trip.findById(booking.trip).populate("journey").populate("bus");
            
            if (tripData) {
                tripData.seats.forEach(seat => {
                    if (booking.seats.includes(seat.seatCode)) {
                        seat.status = "BOOKED";
                        seat.heldBy = null;
                        seat.expiresAt = null;
                    }
                });
                await tripData.save();
                console.log(`[PayOS Thành Công] Đơn ${orderCodeReceived} đã duyệt. Ghế [${booking.seats.join(", ")}] đổi sang BOOKED.`);
                
                // 4. 🌟 PHÁT SỰ KIỆN GỬI VÉ XE ĐIỆN TỬ NETBUS CHUẨN UI WEB
                // Dữ liệu bóc tách sạch sẽ, truyền sang làm nguyên liệu cho Mail Controller dịch sang HTML
                ticketEventEmitter.emit("ticket.success", {
                    email: booking.user?.email, 
                    customerName: booking.user?.username || "Khách hàng NetBus",
                    ticketId: booking._id,
                    route: tripData?.journey?.name || "Hà Nội → Phú Thọ", // Lấy tên hành trình được populate từ Trip
                    departureTime: tripData?.departureTime || "07:04 16/6/26", 
                    seatNumber: booking.seats.join(", "), 
                    totalPrice: booking.totalPrice,
                    busType: tripData?.bus?.name || tripData?.busName || "Xe NETBUS Luxury", // Đồng bộ theo thuộc tính tên xe trên Web của bạn
                    licensePlate: tripData?.bus?.licensePlates || "29B-123.45"
                });
                
                // 🌟 ĐÃ SỬA: Thay đổi 'orderCode' thành 'orderCodeReceived' để tránh lỗi ReferenceError
                console.log(`[NetBus Mail] Đã kích hoạt gửi vé điện tử chạy ngầm cho đơn: ${orderCodeReceived}`);
            }
        }

        // Trả phản hồi 200 về cho PayOS biết là hệ thống của bạn đã xử lý xong đơn hàng, không cần gửi lại webhook nữa
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("[PayOS Webhook Lỗi nghiêm trọng]:", error);
        return res.status(400).send("Invalid webhook signature");
    }
});