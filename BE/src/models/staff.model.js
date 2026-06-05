import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
    {
        ten: {
            type: String,
            required: true,
            trim: true,
        },
        tuoi: {
            type: Number,
            required: true,
        },
            gioiTinh: {
            type: String,
            required: true,
            enum: ['Nam', 'Nữ', 'Khác'],
        },
        email: {
            type: String,
            required: true,
        },
        sdt: {
            type: String,
            required: true,
        },
        diaChi: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },
        cccd:{
            type: String,
            required: true
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