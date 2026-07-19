import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên ngày lễ là bắt buộc"],
      trim: true,
    },

    day: {
      type: Number,
      required: [true, "Ngày là bắt buộc"],
      min: 1,
      max: 31,
    },

    month: {
      type: Number,
      required: [true, "Tháng là bắt buộc"],
      min: 1,
      max: 12,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

holidaySchema.index({ day: 1, month: 1 }, { unique: true });

export default mongoose.model("Holiday", holidaySchema);