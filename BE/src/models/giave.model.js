import mongoose from "mongoose";

const fareRuleSchema = new mongoose.Schema(
{
    journey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Journey",
        required: true,
    },

    capacity: {
        type: Number,
        required: true,
    },

    weekdayPrice: {
        type: Number,
        required: true,
    },

    weekendPrice: {
        type: Number,
        required: true,
    },

    holidayPrice: {
        type: Number,
        required: true,
    },
},
{
    timestamps: true,
    versionKey: false,
}
);

export default mongoose.model(
    "FareRule",
    fareRuleSchema
);