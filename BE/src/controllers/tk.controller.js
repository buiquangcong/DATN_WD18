import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import Staff from "../models/staff.model.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Ánh xạ role bên User sang chucVu tương ứng trong Enum của Staff
const mapRoleToChucVu = (role) => {
    const roleStr = role ? String(role).toLowerCase() : "";
    const roleMap = {
        admin: "Admin",
        driver: "Driver",
        assistant_driver: "Assistant_Driver",
        staff: "Staff",
    };
    return roleMap[roleStr] || null;
};

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
    const { email, role, username, password, status, ...rest } = req.body;

    // 1. Kiểm tra xem email đã tồn tại hay chưa
    if (email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email này đã được sử dụng!" });
        }
    }

    // 2. Tạo tài khoản User (mặc định status là true nếu không truyền)
    let user;
    try {
        user = await User.create({
            ...rest,
            username,
            email,
            password,
            role: role ? String(role).toLowerCase() : "user",
            status: typeof status === "boolean" ? status : true,
        });
    } catch (userErr) {
        console.error(">>> LỖI TẠO TÀI KHOẢN (USER):", userErr.message);
        return res.status(400).json({
            message: "Không thể tạo tài khoản",
            error: userErr.message,
        });
    }

    // 3. Tự tạo Staff nếu thuộc nhóm nhân sự (đồng bộ cả trạng thái)
    const targetChucVu = mapRoleToChucVu(user.role);
    if (targetChucVu) {
        try {
            await Staff.create({
                userId: user._id,
                ten: username ? username.split("@")[0] : "Nhân viên mới",
                email: user.email,
                chucVu: targetChucVu,
                trangThai: user.status !== false ? "Hoạt động" : "Không hoạt động", // Đồng bộ trạng thái ban đầu
            });
        } catch (staffErr) {
            console.error("=== CẢNH BÁO: TẠO STAFF TỰ ĐỘNG THẤT BẠI ===");
            console.error(staffErr.message);
            console.error("==========================================");
        }
    }

    const responseData = user.toObject();
    delete responseData.password;

    return res.status(201).json({
        message: "Tạo tài khoản thành công!",
        data: responseData,
    });
});

export const updateOne = asyncHandler(async (req, res) => {
    const updateData = { ...req.body };
    delete updateData.password;

    // 1. Cập nhật bảng User (bao gồm cả trạng thái status bật/tắt)
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
    }).select("-password");

    if (!user) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    // 2. Đồng bộ chức vụ và TRẠNG THÁI sang bảng Staff
    const targetChucVu = mapRoleToChucVu(user.role);

    try {
        if (targetChucVu) {
            // Chuyển đổi status (boolean) của User thành string enum của Staff
            const staffTrangThai = user.status !== false ? "Hoạt động" : "Không hoạt động";

            const staffUpdatePayload = {
                ten: user.username ? user.username.split("@")[0] : "Nhân viên",
                email: user.email,
                chucVu: targetChucVu,
                trangThai: staffTrangThai, // Tự động đồng bộ trạng thái
            };

            if (targetChucVu !== "Driver") {
                staffUpdatePayload.bangLai = "";
                staffUpdatePayload.anhBangLai = "";
            }

            await Staff.findOneAndUpdate(
                { userId: user._id },
                { $set: staffUpdatePayload },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
        } else {
            // Nếu đổi sang vai trò khách hàng thông thường (User), xóa hồ sơ bên Staff
            await Staff.findOneAndDelete({ userId: user._id });
        }
    } catch (staffErr) {
        console.error(">>> LỖI ĐỒNG BỘ SANG BẢNG STAFF:", staffErr.message);
    }

    return res.json({
        message: "Cập nhật tài khoản và đồng bộ hồ sơ nhân viên thành công!",
        data: user,
    });
});

export const deleteOne = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản để xóa" });
    }

    await Staff.findOneAndDelete({ userId: req.params.id });

    return res.json({
        message: "Xóa tài khoản và hồ sơ nhân viên tương ứng thành công!",
    });
});

// ===============================================
// HÀM ĐĂNG NHẬP (CHẶN NẾU TÀI KHOẢN BỊ KHÓA)
// ===============================================
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mật khẩu!" });
    }

    // 1. Tìm tài khoản
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác!" });
    }

    // 2. Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && password !== user.password) {
        return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác!" });
    }

    // 3. CHẶN ĐĂNG NHẬP NẾU TRẠNG THÁI status === false
    if (user.status === false) {
        return res.status(403).json({
            message: "Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động. Vui lòng liên hệ quản trị viên!",
        });
    }

    // 4. Tạo token JWT
    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || "SECRET_KEY_NETBUS",
        { expiresIn: "7d" }
    );

    const userData = user.toObject();
    delete userData.password;

    return res.json({
        message: "Đăng nhập thành công!",
        token,
        user: userData,
    });
});

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
            message: "Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới",
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            message: "Mật khẩu mới phải có tối thiểu 6 ký tự",
        });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            message: "Mật khẩu mới và xác nhận mật khẩu không trùng khớp",
        });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    const matchPassword = await bcrypt.compare(currentPassword, user.password);
    if (!matchPassword && currentPassword !== user.password) {
        return res.status(401).json({
            message: "Mật khẩu hiện tại không chính xác",
        });
    }

    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld || newPassword === user.password) {
        return res.status(400).json({
            message: "Mật khẩu mới không được trùng với mật khẩu hiện tại",
        });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Đổi mật khẩu thành công!" });
});