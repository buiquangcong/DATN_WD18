
import asyncHandler from "../utils/asyncHandler.js";
import Staff from "../models/staff.model.js";
export const getAll = asyncHandler(async (req, res) => {
    const staff = await Staff.find();
    return res.json(staff)
})
export const createOne = asyncHandler(async (req, res) => {
    const staff = await Staff.create(req.body);
    return res.json(staff)
})
export const getOne = asyncHandler(async (req, res) => {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
        return res.status(404).json({
            message: "Không tìm thấy nhân viên"
        });
    }
    return res.json(staff);
});
export const updateOne = asyncHandler(async (req, res) => {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json(staff)
})
export const deleteOne = asyncHandler(async (req, res) => {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    return res.json(staff)
})