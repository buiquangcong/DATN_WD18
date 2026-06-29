import asyncHandler from "../utils/asyncHandler.js";
import News from "../models/new.model.js";

export const getAll = asyncHandler(async (req, res) => {
  const news = await News.find().sort({
    createdAt: -1,
  });

  res.json(news);
});

export const getOne = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    return res.status(404).json({
      message: "Không tìm thấy bài viết",
    });
  }

  res.json(news);
});

export const createOne = asyncHandler(async (req, res) => {
  const news = await News.create(req.body);

  res.status(201).json({
    message: "Thêm bài viết thành công",
    data: news,
  });
});

export const updateOne = asyncHandler(async (req, res) => {
  const news = await News.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!news) {
    return res.status(404).json({
      message: "Không tìm thấy bài viết",
    });
  }

  res.json({
    message: "Cập nhật thành công",
    data: news,
  });
});

export const deleteOne = asyncHandler(async (req, res) => {
  const news = await News.findByIdAndDelete(req.params.id);

  if (!news) {
    return res.status(404).json({
      message: "Không tìm thấy bài viết",
    });
  }

  res.json({
    message: "Xóa thành công",
  });
});