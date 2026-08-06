import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },

    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    checkInTime: {
      type: Date,
      default: null,
    },

    checkOutTime: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["checked_in", "checked_out"],
      default: "checked_in",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Mỗi tài xế chỉ chấm công 1 lần cho 1 chuyến
attendanceSchema.index({ staff: 1, trip: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
