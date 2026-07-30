import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    seats: [
      {
        type: String,
        required: true,
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
    },

    orderCode: {
      type: Number,
      required: true,
      unique: true
    },

   status: {
     type: String,
     enum: [
       "Chờ xác nhận",
       "Đã xác nhận",
       "Đã huỷ",
       "Yêu cầu hoàn tiền",
       "Đã hoàn tiền"
     ],
     default: "Chờ xác nhận",
   },
   refundInfo: {
     nganHang: { type: String, default: "" },
     soTaiKhoan: { type: String, default: "" },
     tenChuTaiKhoan: { type: String, default: "" },
     lyDoHuy: { type: String, default: "" },
     anhMinhChung: { type: String, default: "" },
     requestedAt: { type: Date },
     processedAt: { type: Date }
   },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;