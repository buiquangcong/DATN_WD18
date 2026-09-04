import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import Staff from "../models/staff.model.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const getAll = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    return res.json(users);
});

export const getOne = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }
    return res.json(user);
});

export const createOne = asyncHandler(async (req, res) => {
    try {
        // 1. Kiểm tra xem email đã tồn tại hay chưa
        if (req.body.email) {
            const existingUser = await User.findOne({ email: req.body.email });
            if (existingUser) {
                return res.status(201).json({
                    message: "Tài khoản đã tồn tại trên hệ thống!",
                    data: existingUser
                });
            }
        }

        // 2. Tạo tài khoản User mới
        const user = await User.create(req.body);

        if (!user) {
            return res.status(400).json({ message: "Không thể tạo tài khoản" });
        }

        // 3. Đồng bộ chức vụ viết hoa chữ cái đầu cho đúng Enum trong model Staff
        let validRole = 'Staff';
        if (req.body.role) {
            const roleLower = req.body.role.toLowerCase();
            if (roleLower === 'admin') validRole = 'Admin';
            else if (roleLower === 'driver') validRole = 'Driver';
            else if (roleLower === 'assistant_driver') validRole = 'Assistant_Driver';
        }

        // 4. Chỉ tự tạo Staff tương ứng nếu là Admin, Driver, Staff hoặc Phụ xe (Assistant_Driver)
        const roleStr = req.body.role ? String(req.body.role).toLowerCase() : "";
        if (["admin", "driver", "staff", "assistant_driver"].includes(roleStr)) {
            await Staff.create({
                userId: user._id,
                ten: req.body.username ? req.body.username.split('@')[0] : "Nhân viên mới",
                email: user.email,
                chucVu: validRole
            });
        }

        return res.status(201).json({
            message: "Tạo tài khoản thành công!",
            data: user
        });

    } catch (error) {
        // Log trực tiếp ra terminal đen để bạn check nguyên nhân nếu vẫn xịt
        console.log("=== LỖI THỰC TẾ TRÊN TERMINAL ===");
        console.error(error.message);
        console.log("=================================");

        return res.status(400).json({
            message: "Lỗi hệ thống không thể tạo dữ liệu",
            error: error.message
        });
    }
});
export const updateOne = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    return res.json({ message: "Cập nhật tài khoản thành công", data: user });
});

export const deleteOne = asyncHandler(async (req, res) => {
    // 1. Tìm và xóa tài khoản theo ID truyền lên từ URL
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return res.status(404).json({
            message: "Không tìm thấy tài khoản để xóa"
        });
    }

    // 2. Tìm và xóa luôn nhân viên có trường userId trùng với ID tài khoản vừa xóa
    await Staff.findOneAndDelete({ userId: req.params.id });

    return res.json({
        message: "Xóa tài khoản và hồ sơ nhân viên tương ứng thành công!"
    });
});

// Đổi mật khẩu tài khoản
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Kiểm tra đầy đủ các trường
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
            message: "Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới"
        });
    }

    // Kiểm tra mật khẩu mới tối thiểu 6 ký tự
    if (newPassword.length < 6) {
        return res.status(400).json({
            message: "Mật khẩu mới phải có tối thiểu 6 ký tự"
        });
    }

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu có trùng khớp không
    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            message: "Mật khẩu mới và xác nhận mật khẩu không trùng khớp"
        });
    }

    // Tìm user kèm password
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    // Kiểm tra mật khẩu hiện tại có đúng không (hỗ trợ cả bcrypt hash và plain-text)
    const matchPassword = await bcrypt.compare(currentPassword, user.password);
    if (!matchPassword && currentPassword !== user.password) {
        return res.status(401).json({
            message: "Mật khẩu hiện tại không chính xác"
        });
    }

    // Kiểm tra mật khẩu mới không trùng mật khẩu cũ
    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld || newPassword === user.password) {
        return res.status(400).json({
            message: "Mật khẩu mới không được trùng với mật khẩu hiện tại"
        });
    }

    // Hash mật khẩu mới và lưu
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Đổi mật khẩu thành công!" });
});