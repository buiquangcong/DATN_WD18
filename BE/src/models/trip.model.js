import mongoose from "mongoose";

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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;