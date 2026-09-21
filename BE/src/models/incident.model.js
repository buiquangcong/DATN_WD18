import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    driverName: {
      type: String,
      default: "Tài xế",
      trim: true,
    },
    issueType: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      default: "Bình thường",
      trim: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    tripInfo: {
      route: { type: String, default: "" },
      busName: { type: String, default: "" },
      licensePlates: { type: String, default: "" },
      departureTime: { type: Date, default: null },
    },
    status: {
      type: String,
      default: "Chờ xử lý",
      trim: true,
    },
    adminResponse: {
      type: String,
      default: "",
      trim: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Incident = mongoose.model("Incident", incidentSchema);

export default Incident;
