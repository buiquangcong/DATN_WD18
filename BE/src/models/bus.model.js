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
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: false
    },
    status: {
        type: String,
        enum: ['Active', 'Maintenance', 'Inactive'],
        default: 'Active'
    }
}, {
    timestamps: true,
    versionKey: false
});

const Bus = mongoose.model("Bus", busSchema)

export default Bus;