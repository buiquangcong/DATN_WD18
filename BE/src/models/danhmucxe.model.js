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

const DanhMuc = mongoose.model("DanhMuc", danhmucSchema);

export default DanhMuc;