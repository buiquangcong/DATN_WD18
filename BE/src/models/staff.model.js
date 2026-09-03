import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: true,
            unique: true, 
        },
        ten: {
            type: String,
            required: true, 
            trim: true,
        },
        namSinh: {
            type: String,
            default: null,
        },
        gioiTinh: {
            type: String,
            enum: ['Nam', 'Nữ', 'Khác'],
            default: 'Khác',
        },
        email: {
            type: String,
            required: true,
            // Đảm bảo không tạo trùng Index lỗi nếu chưa xử lý DB
        },
        sdt: {
            type: String,
            unique: true,
            sparse: true,
        },
        diaChi: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: "",
        },
        cccd: {
            type: String,
            unique: true,
            sparse: true,
        },
        chucVu: {
            type: String,
            enum: ['Admin', 'Driver', 'Staff'],
            default: 'Staff'
        },
        bangLai: {
            type: String,
            default: "",
        },
        anhBangLai: {
            type: String,
            default: "",
        },
        trangThai: {
            type: String,
            enum: ['Đang làm việc', 'Đã nghỉ việc'],
            default: 'Đang làm việc',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;