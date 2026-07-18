import asyncHandler from "../utils/asyncHandler.js";
import Holiday from "../models/holiday.model.js";

export const getAll = asyncHandler(async (req, res) => {
  const holidays = await Holiday.find().sort({
    month: 1,
    day: 1,
  });

  return res.json(holidays);
});

export const getOne = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);

  if (!holiday) {
    return res.status(404).json({
      message: "Không tìm thấy ngày lễ",
    });
  }

  return res.json(holiday);
});

export const createOne = asyncHandler(async (req, res) => {
  const holiday = await Holiday.create(req.body);

  return res.status(201).json({
    message: "Thêm ngày lễ thành công",
    data: holiday,
  });
});

export const updateOne = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    }
  );

  if (!holiday) {
    return res.status(404).json({
      message: "Không tìm thấy ngày lễ",
    });
  }

  return res.json({
    message: "Cập nhật thành công",
    data: holiday,
  });
});

export const deleteOne = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findByIdAndDelete(
    req.params.id
  );

  if (!holiday) {
    return res.status(404).json({
      message: "Không tìm thấy ngày lễ",
    });
  }

  return res.json({
    message: "Xóa ngày lễ thành công",
  });
});