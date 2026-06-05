import asyncHandler from "../utils/asyncHandler";
import journey from "../models/journey.model";

export const getAll = asyncHandler(async (req, res) => {
    const journeys = await journey.find();
    return res.json(journeys)
})
export const getOne = asyncHandler(async (req, res) => {
    const danhMuc = await journey.findById(req.params.id);

    if (!danhMuc) {
        return res.status(404).json({
            message: "Không tìm thấy danh mục"
        });
    }

    return res.json(danhMuc);
});
export const createOne = asyncHandler(async (req, res) => {
    const danhMuc = await journey.create(req.body);
    return res.json(danhMuc)
})
export const updateOne = asyncHandler(async (req, res) => {
    const danhMuc = await journey.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json(danhMuc)
})
export const deleteOne = asyncHandler(async (req, res) => {
    const danhMuc = await journey.findByIdAndDelete(req.params.id);
    return res.json(danhMuc)
})
