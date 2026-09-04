import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import Staff from "../models/staff.model.js";
import User from "../models/user.model.js";

export const getAll = asyncHandler(async (req, res) => {
    const staff = await Staff.find().populate("userId", "-password");
    return res.json(staff);
});


export const createOne = asyncHandler(async (req, res) => {
    const { chucVu, bangLai, anhBangLai } = req.body;
    if (chucVu === "Driver" || chucVu === "Tài xế") {
        if (!bangLai || !bangLai.trim() || !anhBangLai || !anhBangLai.trim()) {
            return res.status(400).json({
                message: "Nhân viên giữ chức vụ Tài xế bắt buộc phải có bằng lái xe và ảnh chụp minh chứng!"
            });
        }
        const allowedLicenses = ["D", "E", "F", "FB2", "FC", "FD", "FE"];
        if (!allowedLicenses.includes(bangLai.trim().toUpperCase())) {
            return res.status(400).json({
                message: "Bằng lái xe của tài xế phải từ hạng D trở lên (D, E, F, FC, FD, FE)!"
            });
        }
    }
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
    const { ten, namSinh, gioiTinh, email, sdt, diaChi, image, chucVu, cccd, bangLai, anhBangLai, trangThai } = req.body;
    
    const updateData = {};
    
    if (ten !== undefined) updateData.ten = ten;
    if (namSinh !== undefined) updateData.namSinh = namSinh;
    if (gioiTinh !== undefined) updateData.gioiTinh = gioiTinh;
    if (email !== undefined) updateData.email = email;
    if (sdt !== undefined) updateData.sdt = sdt;
    if (diaChi !== undefined) updateData.diaChi = diaChi;
    if (image !== undefined) updateData.image = image;
    if (cccd !== undefined) updateData.cccd = cccd;
    if (bangLai !== undefined) updateData.bangLai = bangLai;
    if (anhBangLai !== undefined) updateData.anhBangLai = anhBangLai;
    if (trangThai !== undefined) updateData.trangThai = trangThai;


    let finalRole = "";
    if (chucVu) {
        const role = chucVu.toString().trim();
        if (role === "Quản trị viên" || role === "Admin") finalRole = "Admin";
        else if (role === "Tài xế" || role === "Driver") finalRole = "Driver";
        else if (role === "Nhân viên" || role === "Staff") finalRole = "Staff";
        updateData.chucVu = finalRole;
    }

    const existingStaff = await Staff.findById(req.params.id);
    if (!existingStaff) {
        return res.status(404).json({
            message: "Không tìm thấy nhân viên để cập nhật"
        });
    }

    const checkedRole = finalRole || existingStaff.chucVu;
    const checkedLicense = bangLai !== undefined ? bangLai : existingStaff.bangLai;
    const checkedLicenseImage = anhBangLai !== undefined ? anhBangLai : existingStaff.anhBangLai;

    if (checkedRole === "Driver") {
        if (!checkedLicense || !checkedLicense.trim() || !checkedLicenseImage || !checkedLicenseImage.trim()) {
            return res.status(400).json({
                message: "Nhân viên giữ chức vụ Tài xế bắt buộc phải có bằng lái xe và ảnh chụp minh chứng!"
            });
        }
        const allowedLicenses = ["D", "E", "F", "FB2", "FC", "FD", "FE"];
        if (!allowedLicenses.includes(checkedLicense.trim().toUpperCase())) {
            return res.status(400).json({
                message: "Bằng lái xe của tài xế phải từ hạng D trở lên (D, E, F, FC, FD, FE)!"
            });
        }
    }

    const staff = await Staff.findByIdAndUpdate(
        req.params.id, 
        { $set: updateData }, 
        { 
            new: true, 
            runValidators: true 
        }
    );

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