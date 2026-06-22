import PayOS from "@payos/node";
import mongoose from "mongoose"; // 🌟 Import thêm mongoose gốc
import { Trip } from "../models/Trip";    

const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID || "6128c402-d9dc-48c1-9869-ba88b911c9ac",
    process.env.PAYOS_API_KEY || "99d96ef6-648c-40a1-a67f-4469590cc270",
    process.env.PAYOS_CHECKSUM_KEY || "1ea1ccf5137c5fb3f8d6a68613c9e43247d0cfa7830d604c5fcda03179a1370a"
);

export const createBookingPayment = async (req, res) => {
    try {
        const { user, trip, seats, totalPrice } = req.body;

        // 1. Kiểm tra chuyến xe
        const tripData = await Trip.findById(trip);
        if (!tripData) {
            return res.status(404).json({ message: "Không tìm thấy chuyến xe!" });
        }

        // 2. Kiểm tra trùng ghế
        const unavailableSeats = tripData.seats.filter(
            (s) => seats.includes(s.seatCode) && s.status !== "AVAILABLE"
        );

        if (unavailableSeats.length > 0) {
            return res.status(400).json({ 
                message: `Ghế ${unavailableSeats.map(s => s.seatCode).join(", ")} đã có người chọn hoặc đang giữ!` 
            });
        }

        // 3. Ép sinh mã số đơn hàng chuẩn kiểu số (Number)
        const myOrderCode = Math.floor(100000 + Math.random() * 900000); 

        // 4. Tạo link thanh toán PayOS trước để đảm bảo an toàn
        const seatString = seats.join("-"); 
        const customDescription = `Ghe-${seatString}`.slice(0, 25); 

        const paymentBody = {
            orderCode: myOrderCode,
            amount: totalPrice,
            description: customDescription,
            cancelUrl: "http://localhost:3000/khachhang/booking/cancel", 
            returnUrl: `http://localhost:3000/khachhang/booking/success?orderCode=${myOrderCode}`
        };

        const paymentLinkData = await payos.createPaymentLink(paymentBody);

        // 5. Cập nhật trạng thái giữ ghế trong Trip
        await Trip.updateOne(
            { _id: trip, "seats.seatCode": { $in: seats } },
            { 
                $set: { 
                    "seats.$[elem].status": "HOLDING",
                    "seats.$[elem].heldBy": user,
                    "seats.$[elem].expiresAt": new Date(Date.now() + 10 * 60 * 1000)
                } 
            },
            { arrayFilters: [{ "elem.seatCode": { $in: seats } }] }
        );

        // 🌟 GIẢI PHÁP SỬA LỖI REQUIRED: 
        // Lấy trực tiếp Model Booking từ kết nối Mongoose hiện hành, 
        // không thông qua biến import để tránh lỗi kẹt cache file cũ.
        const BookingModel = mongoose.model("Booking");
        
        const newBooking = new BookingModel({
            user: user,
            trip: trip,
            seats: seats,
            totalPrice: totalPrice,
            orderCode: myOrderCode, // Truyền trực tiếp giá trị số nguyên vào đây
            status: "Chờ xác nhận" 
        });
        
        await newBooking.save();

        // 6. Trả kết quả về cho React chuyển hướng
        return res.status(200).json({
            success: true,
            checkoutUrl: paymentLinkData.checkoutUrl
        });

    } catch (error) {
        console.error("=== LỖI TẠI TERMINAL BACKEND ===");
        console.error(error);
        
        return res.status(500).json({ 
            message: error.message || "Lỗi hệ thống, không thể đặt vé!" 
        });
    }
};