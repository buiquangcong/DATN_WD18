import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
    seatCode: {
        type: String,
        required: true,
        trim: true
    },
    rowIndex: {
        type: Number,
        required: true
    },
    colIndex: {
        type: Number,
        required: true
    },
    floor: {
        type: Number,
        default: 1 // 1: Tầng dưới, 2: Tầng trên
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'HOLDING', 'BOOKED'],
        default: 'AVAILABLE'
    },
    heldBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Tham chiếu đến user.model.js của bạn
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, { _id: false });

const carseatSchema = new mongoose.Schema({
    journeyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Journey', // Tên model trong journey.model.js của bạn
        required: true
    },
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus', // Tên model trong bus.model.js của bạn
        required: true
    },
    departureDate: {
        type: Date,
        required: true
    },
    seats: [seatSchema]
}, {
    timestamps: true,
    versionKey: false
});

const Carseat = mongoose.model("Carseat", carseatSchema);
export default Carseat;