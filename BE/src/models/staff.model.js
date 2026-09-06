import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            default: null,
        },
        ten: {
            type: String,
            required: [true, "Vui lòng nhập tên nhân viên"],
            trim: true,
        },
        namSinh: {
            type: String,
            default: "",
        },
        gioiTinh: {
            type: String,
            enum: ["Nam", "Nữ", "Khác"],
            default: "Nam",
        },
        email: {
            type: String,
            required: [true, "Vui lòng nhập email"],
            trim: true,
            lowercase: true,
        },
        sdt: {
            type: String,
            default: "",
            trim: true,
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
            default: "",
            trim: true,
        },
        chucVu: {
            type: String,
            enum: ["Admin", "Driver", "Staff", "Assistant_Driver"],
            default: "Staff",
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
            enum: ["Hoạt động", "Không hoạt động","đang làm"],
            default: "Hoạt động",
            // Tự động xử lý mọi định dạng gửi lên (boolean, chữ hoa, chữ thường)
            set: (val) => {
                if (typeof val === "boolean") {
                    return val ? "Hoạt động" : "Không hoạt động";
                }
                if (typeof val === "string") {
                    const normalized = val.trim().toLowerCase();
                    if (normalized === "hoạt động" || normalized === "active") return "Hoạt động";
                    if (normalized === "không hoạt động" || normalized === "inactive") return "Không hoạt động";
                    if (normalized === "đang làm" || normalized === "on duty") return "đang làm";
                }
                return val;
            },
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;