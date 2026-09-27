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
    const { bookingId, isAdmin } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy đơn đặt vé để thanh toán" });
    }

    if (booking.status !== "Chờ xác nhận" && booking.status !== "PENDING") {
        return res.status(400).json({ message: "Đơn hàng này không ở trạng thái chờ thanh toán" });
    }

    // Cấu hình nội dung QR chứa Số Ghế
    const seatString = booking.seats.join("-");
    const customDescription = `Ghe-${seatString}`.slice(0, 25);

    // Thời gian đếm ngược 5 phút thanh toán trên PayOS (Unix timestamp tính bằng giây)
    const expiredAt = Math.floor(Date.now() / 1000) + 5 * 60;

    const returnUrl = isAdmin 
      ? `http://localhost:5173/admin/offline-booking/success?orderCode=${booking.orderCode}`
      : `http://localhost:5173/khachhang/booking/success?orderCode=${booking.orderCode}`;

    // Khi hết hạn 5 phút hoặc người dùng hủy, PayOS chuyển hướng lại về trang trước và kèm mã đơn
    const cancelUrl = isAdmin
      ? `http://localhost:5173/admin/offline-booking?status=cancelled&orderCode=${booking.orderCode}`
      : `http://localhost:5173/khachhang/booking/${booking.trip}?status=cancelled&orderCode=${booking.orderCode}`;

    const paymentBody = {
        orderCode: booking.orderCode,
        amount: booking.totalPrice,
        description: customDescription,
        cancelUrl,
        returnUrl,
        expiredAt
    };

    const paymentLinkData = await payos.paymentRequests.create(paymentBody);

    return res.status(200).json({
        message: "Tạo link thanh toán thành công",
        checkoutUrl: paymentLinkData.checkoutUrl,
        orderCode: booking.orderCode,
        expiredAt,
        qrCode: paymentLinkData.qrCode,
        accountNumber: paymentLinkData.accountNumber,
        accountName: paymentLinkData.accountName,
        bin: paymentLinkData.bin,
        amount: paymentLinkData.amount,
        description: paymentLinkData.description,
        bookingId: booking._id,
        tripId: booking.trip
    });
});

// Hàm hủy đơn và nhả ghế ngay lập tức khi hết hạn 5 phút hoặc hủy thanh toán
export const cancelPaymentAndReleaseSeats = asyncHandler(async (req, res) => {
    const { orderCode, bookingId } = req.body;

    if (!orderCode && !bookingId) {
        return res.status(400).json({ message: "Thiếu thông tin mã đơn hàng" });
    }

    const filter = orderCode ? { orderCode: Number(orderCode) } : { _id: bookingId };
    const booking = await Booking.findOne(filter);

    if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Chỉ hủy nếu đơn hàng đang ở trạng thái chờ thanh toán
    if (booking.status === "Chờ xác nhận" || booking.status === "PENDING") {
        booking.status = "Đã huỷ";
        await booking.save();

        const trip = await Trip.findById(booking.trip);
        if (trip) {
            let hasChanges = false;
            trip.seats.forEach((seat) => {
                if (booking.seats.includes(seat.seatCode)) {
                    if (seat.status === "HOLDING") {
                        seat.status = "AVAILABLE";
                        seat.heldBy = null;
                        seat.expiresAt = null;
                        hasChanges = true;
                    }
                }
            });
            if (hasChanges) {
                await trip.save();
            }
        }

        try {
            await payos.cancelPaymentLink(booking.orderCode, "Quá hạn 5 phút hoặc người dùng hủy");
        } catch (payosErr) {
            // Link có thể đã hết hạn hoặc đã hủy trên PayOS
        }

        console.log(`[Nhả ghế PayOS] Đơn ${booking.orderCode} đã hủy, cụm ghế [${booking.seats.join(", ")}] đã được trả về AVAILABLE.`);
    }

    return res.status(200).json({
        success: true,
        message: "Đơn hàng đã được hủy và các ghế đã được giải phóng thành công",
        data: {
            orderCode: booking.orderCode,
            seats: booking.seats,
            tripId: booking.trip
        }
    });
});

// Kiểm tra trạng thái đơn hàng và đồng bộ từ PayOS nếu đã thanh toán
export const getPaymentStatus = asyncHandler(async (req, res) => {
    const { orderCode } = req.params;
    if (!orderCode) {
        return res.status(400).json({ message: "Thiếu mã đơn hàng orderCode" });
    }

    const booking = await Booking.findOne({ orderCode: Number(orderCode) }).populate("trip").populate("user");
    if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Nếu đơn vẫn ở trạng thái Chờ xác nhận, trực tiếp hỏi PayOS xem đã thanh toán thành công chưa
    if (booking.status === "Chờ xác nhận" || booking.status === "PENDING") {
        try {
            const payosInfo = await payos.paymentRequests.get(Number(orderCode));
            if (payosInfo && (payosInfo.status === "PAID" || payosInfo.status === "SUCCESS")) {
                booking.status = "Đã xác nhận";
                await booking.save();

                const trip = await Trip.findById(booking.trip?._id || booking.trip);
                if (trip) {
                    trip.seats.forEach(s => {
                        if (booking.seats.includes(s.seatCode)) {
                            s.status = "BOOKED";
                            s.heldBy = null;
                            s.expiresAt = null;
                        }
                    });
                    await trip.save();
                }
            } else if (payosInfo && (payosInfo.status === "CANCELLED" || payosInfo.status === "EXPIRED")) {
                booking.status = "Đã huỷ";
                await booking.save();

                const trip = await Trip.findById(booking.trip?._id || booking.trip);
                if (trip) {
                    trip.seats.forEach(s => {
                        if (booking.seats.includes(s.seatCode) && s.status === "HOLDING") {
                            s.status = "AVAILABLE";
                            s.heldBy = null;
                            s.expiresAt = null;
                        }
                    });
                    await trip.save();
                }
            }
        } catch (e) {
            // Bỏ qua lỗi kết nối PayOS tạm thời
        }
    }

    return res.status(200).json({
        success: true,
        status: booking.status,
        booking: {
            _id: booking._id,
            orderCode: booking.orderCode,
            totalPrice: booking.totalPrice,
            seats: booking.seats,
            status: booking.status,
            trip: booking.trip
        }
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