import mongoose from "mongoose";

const journeySchema = new mongoose.Schema(
  {
    diemDi: {
      type: String,
      required: true,
      trim: true,
    },

    diemDen: {
      type: String,
      required: true,
      trim: true,
    },

    quangDuong: {
      type: Number,
      required: true,
    },
     
    thoiGianDiChuyen: {
      type: String,
      required: true,
    },
    diemDon: [
      {
        thoiGian: {
          type: String,
          required: true,
          trim: true,
        },
        diaDiem: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    diemTra: [
      {
        thoiGian: {
          type: String,
          required: true,
          trim: true,
        },
        diaDiem: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

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

const Journey = mongoose.model("Journey", journeySchema);

export default Journey;


