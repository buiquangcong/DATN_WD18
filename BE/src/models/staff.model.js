import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
    {
        // 1. Thêm trường liên kết với bảng User
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Tên này phải khớp với tên Model bên file user.model.js
            required: true,
            unique: true, // Đảm bảo 1 tài khoản chỉ đi kèm 1 hồ sơ nhân viên
        },
        ten: {
            type: String,
            required: true, // Giữ nguyên, lấy từ họ tên lúc tạo tài khoản
            trim: true,
        },
        tuoi: {
            type: Number,
            // required: true, <-- Bỏ đi để cập nhật sau
            default: null,
        },
        gioiTinh: {
            type: String,
            enum: ['Nam', 'Nữ', 'Khác'],
            // required: true, <-- Bỏ đi để cập nhật sau
            default: 'Khác',
        },
        email: {
            type: String,
            required: true, // Giữ nguyên, lấy luôn email của tài khoản qua
        },
        sdt: {
            type: String,
            // required: true, <-- Bỏ đi để cập nhật sau
            default: "",
        },
        diaChi: {
            type: String,
            // required: true, <-- Bỏ đi để cập nhật sau
            default: "",
        },
        image: {
            type: String,
            default: "",
        },
        cccd: {
            type: String,
            // required: true, <-- Bỏ đi để cập nhật sau
            default: "",
        },
        chucVu: {
            type: String,
            enum: ['Admin', 'Driver', 'Staff'],
            default: 'Staff'
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;