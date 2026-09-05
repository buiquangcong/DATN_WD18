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
        // ĐỔI SANG "Hoạt động" VÀ "Không hoạt động"
        trangThai: {
            type: String,
            enum: ["Hoạt động", "Không hoạt động"],
            default: "Hoạt động",
            // Linh hoạt: nếu frontend gửi boolean true/false thì tự convert
            set: (val) => {
                if (typeof val === "boolean") {
                    return val ? "Hoạt động" : "Không hoạt động";
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