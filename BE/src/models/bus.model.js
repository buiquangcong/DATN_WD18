import mongoose from "mongoose";


const busSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    licensePlates: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    capacity: {
        type: Number,
        required: true,
        min: [4, 'Sức chứa tối thiểu là 4 chỗ']
    },
    type: {
        type: String,
        enum: ['Sleeper', 'Seater', 'Limousine'],
        default: 'Seater'
    },
    hangxe:
    {
        type: String,
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
        required: false,
    },
    status: {
        type: String,
        enum: ['hoạt động', 'bảo trì', 'ngừng hoạt động', 'đang làm'],
        default: 'hoạt động'
    }
}, {
    timestamps: true,
    versionKey: false
});

const Bus = mongoose.model("Bus", busSchema)

export default Bus;