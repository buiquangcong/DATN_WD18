import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import Staff from "../models/staff.model.js";
import User from "../models/user.model.js";

export const getAll = asyncHandler(async (req, res) => {
    const staff = await Staff.find().populate("userId", "-password");
    return res.json(staff);
});


export const createOne = asyncHandler(async (req, res) => {
    const staff = await Staff.create(req.body);
    return res.status(201).json(staff);
});


export const getOne = asyncHandler(async (req, res) => {
    const staff = await Staff.findById(req.params.id).populate("userId", "-password");

    if (!staff) {
        return res.status(404).json({
            message: "Không tìm thấy nhân viên"
        });
    }
    return res.json(staff);
});

export const updateOne = asyncHandler(async (req, res) => {
    const { ten, tuoi, gioiTinh, email, sdt, diaChi, image, chucVu, cccd } = req.body;
    
    const updateData = {};
    
    if (ten !== undefined) updateData.ten = ten;
    if (tuoi !== undefined) updateData.tuoi = Number(tuoi); 
    if (gioiTinh !== undefined) updateData.gioiTinh = gioiTinh;
    if (email !== undefined) updateData.email = email;
    if (sdt !== undefined) updateData.sdt = sdt;
    if (diaChi !== undefined) updateData.diaChi = diaChi;
    if (image !== undefined) updateData.image = image;
    if (cccd !== undefined) updateData.cccd = cccd;


    if (chucVu) {
        const role = chucVu.toString().trim();
        if (role === "Quản trị viên" || role === "Admin") updateData.chucVu = "Admin";
        else if (role === "Tài xế" || role === "Driver") updateData.chucVu = "Driver";
        else if (role === "Nhân viên" || role === "Staff") updateData.chucVu = "Staff";
    }

    const staff = await Staff.findByIdAndUpdate(
        req.params.id, 
        { $set: updateData }, 
        { 
            new: true, 
            runValidators: true 
        }
    );

    if (!staff) {
        return res.status(404).json({
            message: "Không tìm thấy nhân viên để cập nhật"
        });
    }

    return res.json({
        message: "Cập nhật thông tin nhân viên thành công!",
        data: staff
    });
});
export const deleteOne = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 1. Kiểm tra ID nhân viên truyền lên từ URL có đúng chuẩn ObjectId không
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "ID nhân viên gửi lên không đúng định dạng ObjectId MongoDB!"
        });
    }

    // 2. Tìm nhân viên đó trước để lấy thông tin userId (Chưa xóa vội)
    const staff = await Staff.findById(id);

    if (!staff) {
        return res.status(404).json({
            message: "Không tìm thấy nhân viên này trên hệ thống hoặc đã bị xóa trước đó!"
        });
    }

    // 3. Xóa tài khoản User liên kết một cách an toàn (bọc riêng biệt)
    if (staff.userId) {
        try {
            // Chỉ gọi lệnh xóa nếu userId thực sự là một ObjectId hợp lệ
            if (mongoose.Types.ObjectId.isValid(staff.userId)) {
                await User.findByIdAndDelete(staff.userId);
            } else {
                console.warn(`userId của nhân viên này (${staff.userId}) không hợp lệ, bỏ qua việc xóa tài khoản.`);
            }
        } catch (userError) {
            // Nếu lỗi (ví dụ tài khoản đã bị xóa trước), ta chỉ log ra terminal, không làm crash API
            console.error("Lỗi âm thầm khi xóa tài khoản liên kết:", userError.message);
        }
    }

    // 4. Tiến hành xóa Nhân viên khỏi DB
    await Staff.findByIdAndDelete(id);

    // 5. Trả về thành công rực rỡ với status 200
    return res.status(200).json({
        message: "Xóa nhân viên và tài khoản liên kết thành công!",
        data: staff
    });
});