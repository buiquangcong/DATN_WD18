import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    avatar:{
     type:String,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "user", "driver", "staff"],
        default: "user"
    }
}, { timestamps: true, versionKey: false });

const User = mongoose.model("User", userSchema)

export default User;