import mongoose from "mongoose";

// Định nghĩa cấu trúc cho từng chỗ ngồi/giường nằm bên trong chuyến đi
const seatStatusSchema = new mongoose.Schema({
  seatCode: { type: String, required: true, trim: true }, // Ví dụ: A1D, B2T
  rowIndex: { type: Number, required: true },            // Hàng thứ mấy
  colIndex: { type: Number, required: true },            // Cột thứ mấy
  floor: { type: Number, default: 1 },                   // Tầng 1 hoặc Tầng 2
  status: { 
    type: String, 
    enum: ['AVAILABLE', 'HOLDING', 'BOOKED'], 
    default: 'AVAILABLE' 
  }, // AVAILABLE: Ghế trống, HOLDING: Đang giữ tạm thời, BOOKED: Đã mua thành công
  heldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // ID khách hàng đang giữ ghế
  expiresAt: { type: Date, default: null } // Thời gian hết hạn giữ ghế tạm thời (giữ trong 5-10 phút)
}, { _id: false }); // Tắt _id con của từng ghế để tránh rác database

const tripSchema = new mongoose.Schema(
  {
    journey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: [true, "Tuyến đường là bắt buộc"],
    },

    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: [true, "Xe là bắt buộc"],
    },

    departureTime: {
      type: Date,
      required: [true, "Thời gian khởi hành là bắt buộc"],
    },

    status: {
      type: String,
      enum: ["sắp chạy", "đang chạy", "hoàn thành", "huỷ"],
      default: "sắp chạy",
    },

    // Trường lưu trữ danh sách sơ đồ ghế tự động sinh ra cho chuyến đi này
    seats: [seatStatusSchema] 
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;