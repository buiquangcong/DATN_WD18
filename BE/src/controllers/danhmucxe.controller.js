import asyncHandler from "../utils/asyncHandler";
import Article from "../models/danhmucxe.model";

export const getAll = asyncHandler(async (req, res) => {
    const articles = await Article.find();
    return res.json(articles)
})
export const getOne = asyncHandler(async (req, res) => {
    const car = await Article.findById(req.params.id);

    if (!car) {
        return res.status(404).json({
            message: "Không tìm thấy xe"
        });
    }

    return res.json(car);
});
export const createOne = asyncHandler(async (req, res) => {
    const article = await Article.create(req.body);
    return res.json(article)
})
export const updateOne = asyncHandler(async (req, res) => {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json(article)
})
export const deleteOne = asyncHandler(async (req, res) => {
    const article = await Article.findByIdAndDelete(req.params.id);
    return res.json(article)
})