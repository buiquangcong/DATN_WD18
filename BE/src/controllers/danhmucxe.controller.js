import asyncHandler from "../utils/asyncHandler";
import Danhmuc from "../models/danhmucxe.model";

export const getAll = asyncHandler(async (req, res) => {
    const danhMucs = await Danhmuc.find();
    return res.json(danhMucs)
})
export const getOne = asyncHandler(async (req, res) => {
    const danhMuc = await Danhmuc.findById(req.params.id);

    if (!danhMuc) {
        return res.status(404).json({
            message: "Không tìm thấy danh mục"
        });
    }

    return res.json(danhMuc);
});
export const createOne = asyncHandler(async (req, res) => {
    const danhMuc = await Danhmuc.create(req.body);
    return res.json(danhMuc)
})
export const updateOne = asyncHandler(async (req, res) => {
    const danhMuc = await Danhmuc.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json(danhMuc)
})
export const deleteOne = asyncHandler(async (req, res) => {
    const danhMuc = await Danhmuc.findByIdAndDelete(req.params.id);
    return res.json(danhMuc)
})