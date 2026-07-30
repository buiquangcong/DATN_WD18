import asyncHandler from "../utils/asyncHandler";
import bscrypt from "bcryptjs";
import User from "../models/user.model";
import Staff from "../models/staff.model";
import Otp from "../models/otp.model.js";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";

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

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Vui lòng cung cấp Email!" });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "Email không tồn tại trên hệ thống" });
    }

    // Generate reset token signed with a secret, valid for 15 minutes
    const resetToken = jwt.sign({ email }, "forgot_password_secret_123", { expiresIn: "15m" });
    const resetLink = `http://localhost:5173/khachhang/reset-password?token=${resetToken}`;

    // Send reset email via Nodemailer
    await sendMail({
        email: email,
        subject: "[NetBus] Khôi phục mật khẩu tài khoản của bạn",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2E7D32; text-align: center;">YÊU CẦU KHÔI PHỤC MẬT KHẨU</h2>
                <p>Chào bạn,</p>
                <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với email này trên hệ thống <b>NetBus</b>.</p>
                <p>Vui lòng click vào đường liên kết dưới đây để thiết lập mật khẩu mới (Đường liên kết có hiệu lực trong vòng 15 phút):</p>
                <div style="text-align: center; margin: 25px 0;">
                    <a href="${resetLink}" style="font-size: 16px; font-weight: bold; color: #fff; background: #2E7D32; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Khôi phục mật khẩu
                    </a>
                </div>
                <p style="color: #ff5722; font-size: 13px;">* Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="text-align: center; color: #2E7D32; font-weight: bold; font-size: 13px;">NetBus - Chạm là đi</p>
            </div>
        `
    });

    return res.status(200).json({
        success: true,
        message: "Link khôi phục mật khẩu đã được gửi thành công, vui lòng kiểm tra email!"
    });
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: "Thiếu thông tin khôi phục mật khẩu!" });
    }

    try {
        const decoded = jwt.verify(token, "forgot_password_secret_123");
        const email = decoded.email;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Tài khoản không tồn tại trên hệ thống" });
        }

        const hashedPassword = await bscrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Khôi phục mật khẩu thành công! Vui lòng đăng nhập lại."
        });
    } catch (err) {
        return res.status(400).json({
            message: "Đường liên kết đã hết hạn hoặc không hợp lệ!"
        });
    }
});

export const changePassword = asyncHandler(async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: "Thiếu thông tin đổi mật khẩu!" });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "Tài khoản không tồn tại trên hệ thống!" });
    }

    const matchPassword = await bscrypt.compare(currentPassword, user.password);

    // Support both bcrypt hashed password and plain-text passwords stored directly
    if (!matchPassword && currentPassword !== user.password) {
        return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác!" });
    }

    const hashedPassword = await bscrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
        success: true,
        message: "Đổi mật khẩu thành công!"
    });
});