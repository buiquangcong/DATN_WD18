import asyncHandler from "../utils/asyncHandler.js";
import Staff from "../models/staff.model.js";

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
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
        return res.status(404).json({
            message: "Không tìm thấy nhân viên để xóa"
        });
    }
    if (staff.userId) {
        await User.findByIdAndDelete(staff.userId);
    }

    return res.json({
        message: "Xóa nhân viên và tài khoản liên kết thành công!",
        data: staff
    });
});