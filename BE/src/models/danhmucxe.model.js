import mongoose from "mongoose";

const danhmucSchema = new mongoose.Schema(
  {
    tenDanhMuc: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("DanhMuc", danhmucSchema);