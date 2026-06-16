import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";


export const getAll = asyncHandler(async (req, res) => {
    const users = await User.find()
        .select("-password");

    return res.json(users);
});


export const getOne = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select("-password");

    if (!user) {
        return res.status(404).json({
            message: "Không tìm thấy tài khoản"
        });
    }

    return res.json(user);
});

export const createOne = asyncHandler(async (req, res) => {
    const user = await User.create(req.body);

    return res.status(201).json({
        message: "Thêm tài khoản thành công",
        data: user
    });
});
export const updateOne = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    ).select("-password");

    if (!user) {
        return res.status(404).json({
            message: "Không tìm thấy tài khoản"
        });
    }

    return res.json({
        message: "Cập nhật tài khoản thành công",
        data: user
    });
});

export const deleteOne = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(
        req.params.id
    );

    if (!user) {
        return res.status(404).json({
            message: "Không tìm thấy tài khoản"
        });
    }

    return res.json({
        message: "Xóa tài khoản thành công"
    });
});