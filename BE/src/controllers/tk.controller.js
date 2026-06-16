import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import Staff from "../models/staff.model.js";
import mongoose from "mongoose";

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
        // 1. Tạo tài khoản User trước
        const user = await User.create(req.body);

        if (!user) {
            return res.status(400).json({ message: "Không thể tạo tài khoản" });
        }

        // 2. Đồng bộ chức vụ viết hoa chữ cái đầu cho đúng Enum trong model Staff
        let validRole = 'Staff';
        if (req.body.role) {
            const roleLower = req.body.role.toLowerCase();
            if (roleLower === 'admin') validRole = 'Admin';
            else if (roleLower === 'driver') validRole = 'Driver';
        }

        // 3. Tự tạo Staff tương ứng (Lấy username đắp vào trường 'ten' để không bị lỗi required)
        await Staff.create({
            userId: user._id,
            ten: req.body.username ? req.body.username.split('@')[0] : "Nhân viên mới", // Cứu cánh trường 'ten' bị thiếu
            email: user.email,
            chucVu: validRole
            // Các trường tuoi, gioiTinh, cccd, sdt,... đã có default ở model nên không cần truyền vào đây nữa!
        });

        return res.status(201).json({
            message: "Tạo tài khoản và hồ sơ nhân viên thành công!",
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