import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        image: {
            type: String,
            required: true,
        },

        shortDescription: {
            type: String,
            required: true,
        },

        content: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["Hiển thị", "Ẩn"],
            default: "Hiển thị",
        },
        author: {
            type: String,
            default: "NetBus"
        },

        category: {
            type: String,
            default: "Tin tức"
        },

        views: {
            type: Number,
            default: 0
        }
        
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export default mongoose.model("News", newsSchema);