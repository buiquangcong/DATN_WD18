import mongoose from "mongoose";

const seatStatusSchema = new mongoose.Schema({
  seatCode: { type: String, required: true, trim: true }, 
  rowIndex: { type: Number, required: true },            
  colIndex: { type: Number, required: true },            
  floor: { type: Number, default: 1 },                   
  status: { 
    type: String, 
    enum: ['AVAILABLE', 'HOLDING', 'BOOKED'], 
    default: 'AVAILABLE' 
  }, 
  heldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, 
  expiresAt: { type: Date, default: null } 
}, { _id: false }); 

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

    
    seats: [seatStatusSchema] 
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;