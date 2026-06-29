import express from "express";
import { sendOtp, verifyOtp, sendTicket } from "../controllers/otp.controller";

const otpRouter = express.Router();

// Route xử lý luồng OTP xác thực đầu vào
otpRouter.post("/send-otp", sendOtp);
otpRouter.post("/verify-otp", verifyOtp);

// Route xử lý gửi vé xe khi hoàn tất giao dịch
otpRouter.post("/send-ticket", sendTicket);

export default otpRouter;