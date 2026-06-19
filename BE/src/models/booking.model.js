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

   status: {
  type: String,
  enum: [
    "Chờ xác nhận",
    "Đã xác nhận",
    "Đã huỷ",
  ],
  default: "Chờ xác nhận",
},
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;