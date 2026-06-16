import asyncHandler from "../utils/asyncHandler.js";
import Staff from "../models/staff.model.js";

// 1. Lấy toàn bộ danh sách nhân viên
export const getAll = asyncHandler(async (req, res) => {
    // Thêm .populate("userId", "-password") nếu bạn muốn lấy kèm thông tin tài khoản (trừ mật khẩu)
    const staff = await Staff.find().populate("userId", "-password");
    return res.json(staff);
});

// 2. Hàm tạo nhân viên thủ công (Khuyên dùng tạo từ bên User Controller)
export const createOne = asyncHandler(async (req, res) => {
    // Nếu bạn vẫn muốn giữ để test hoặc dùng cho trường hợp đặc biệt
    const staff = await Staff.create(req.body);
    return res.status(201).json(staff);
});

// 3. Lấy thông tin chi tiết của 1 nhân viên để đổ vào form Sửa (Cập nhật CCCD)
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
    // 1. Tạo object chứa các trường THỰC SỰ cần cập nhật, loại bỏ các trường hệ thống/liên kết dễ gây lỗi 400
    const { ten, tuoi, gioiTinh, email, sdt, diaChi, image, chucVu, cccd } = req.body;
    
    const updateData = {};
    
    // Chỉ thêm vào object update nếu trường đó được gửi lên
    if (ten !== undefined) updateData.ten = ten;
    if (tuoi !== undefined) updateData.tuoi = Number(tuoi); // Ép hẳn về kiểu Number phòng hờ frontend gửi chuỗi "18"
    if (gioiTinh !== undefined) updateData.gioiTinh = gioiTinh;
    if (email !== undefined) updateData.email = email;
    if (sdt !== undefined) updateData.sdt = sdt;
    if (diaChi !== undefined) updateData.diaChi = diaChi;
    if (image !== undefined) updateData.image = image;
    if (cccd !== undefined) updateData.cccd = cccd;

    // 2. Chuẩn hóa chức vụ từ Tiếng Việt sang đúng Enum tiếng Anh trong Model
    if (chucVu) {
        const role = chucVu.toString().trim();
        if (role === "Quản trị viên" || role === "Admin") updateData.chucVu = "Admin";
        else if (role === "Tài xế" || role === "Driver") updateData.chucVu = "Driver";
        else if (role === "Nhân viên" || role === "Staff") updateData.chucVu = "Staff";
    }

    // 3. Tiến hành cập nhật vào DB bằng cách sử dụng $set để an toàn tuyệt đối
    const staff = await Staff.findByIdAndUpdate(
        req.params.id, 
        { $set: updateData }, // Chỉ cập nhật những trường đã được lọc sạch ở trên
        { 
            new: true, 
            runValidators: true // Đảm bảo kiểm tra đúng cấu trúc schema
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