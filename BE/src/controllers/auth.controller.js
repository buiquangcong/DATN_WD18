import asyncHandler from "../utils/asyncHandler";
import bscrypt from "bcryptjs";
import User from "../models/user.model";
import Staff from "../models/staff.model";
import Otp from "../models/otp.model.js";
import jwt from "jsonwebtoken";

export const signup = asyncHandler(async (req, res) => {

    const { username, email, password, otpInput } = req.body;
    
    const userExist = await User.findOne({ email });
    if (userExist) {
        return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord || otpRecord.otp !== otpInput) {
        return res.status(400).json({
            success: false,
            message: "Mã OTP không chính xác hoặc đã hết hạn!"
        });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    const hashedPassword = await bscrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });
    user.password = undefined;

    return res.status(201).json({
        message: "Xác thực OTP và đăng ký tài khoản thành công!",
        data: user
    });
});
export const signin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({
            message: "Email hoặc mật khẩu không đúng",
        });
    }

    const matchPassword = await bscrypt.compare(password, user.password);

    // Hỗ trợ cả mật khẩu đã hash bằng bcrypt và mật khẩu nhập tay trực tiếp vào MongoDB
    if (!matchPassword && password !== user.password) {
        return res.status(401).json({
            message: "Email hoặc mật khẩu không đúng",
        });
    }

   
    const staff = await Staff.findOne({
        userId: user._id,
    });

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        "123456",
        {
            expiresIn: "1h",
        }
    );

    user.password = undefined;

    return res.status(200).json({
        message: "Đăng nhập thành công",
        token,
        user,
        staff,
    });
});