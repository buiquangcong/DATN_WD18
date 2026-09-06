import mongoose from "mongoose";

const stationSchema = new mongoose.Schema(
  {
    tinh: {
      type: String,
      required: [true, "Tỉnh/Thành phố không được để trống"],
      trim: true,
    },
    tenBenXe: {
      type: String,
      required: [true, "Tên bến xe không được để trống"],
      trim: true,
    },
    diaChi: {
      type: String,
      trim: true,
      default: "",
    },
    trangThai: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Tránh trùng tên bến xe trong cùng 1 tỉnh
stationSchema.index({ tinh: 1, tenBenXe: 1 }, { unique: true });

const Station = mongoose.model("Station", stationSchema);

export default Station;
