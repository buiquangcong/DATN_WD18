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
        offsetMinutes: {
          type: Number,
          required: true,
          min: 0,
          // Số phút SAU khi xe khởi hành thì đến điểm đón này
          // VD: 0 = đón ngay tại bến xuất phát, 15 = đón sau 15 phút kể từ giờ khởi hành
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
        offsetMinutes: {
          type: Number,
          required: true,
          min: 0,
          // Số phút TRƯỚC khi xe đến bến cuối thì trả khách ở điểm này
          // VD: 0 = trả ngay tại bến cuối, 20 = trả trước 20 phút so với giờ đến
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