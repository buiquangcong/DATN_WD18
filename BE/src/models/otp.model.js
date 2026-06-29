import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    // Tự động xóa bản ghi này khỏi Database sau 5 phút (300 giây) kể từ lúc tạo
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 300 }, 
    },
  },
  { timestamps: true }
);

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;