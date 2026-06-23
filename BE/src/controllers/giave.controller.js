import FareRule from "../models/giave.model.js";

// Lấy tất cả bảng giá
export const getAll = async (req, res) => {
  try {
    const fareRules = await FareRule.find()
      .populate("journey");

    return res.json(fareRules);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Lấy 1 bảng giá
export const getOne = async (req, res) => {
  try {
    const fareRule = await FareRule.findById(
      req.params.id
    ).populate("journey");

    if (!fareRule) {
      return res.status(404).json({
        message: "Không tìm thấy bảng giá",
      });
    }

    return res.json(fareRule);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Thêm bảng giá
export const createOne = async (req, res) => {
  try {
    const {
      journey,
      capacity,
      weekdayPrice,
      weekendPrice,
      holidayPrice,
    } = req.body;

    // Kiểm tra trùng tuyến + loại xe
    const existed =
      await FareRule.findOne({
        journey,
        capacity,
      });

    if (existed) {
      return res.status(400).json({
        message:
          "Bảng giá cho tuyến và loại xe này đã tồn tại",
      });
    }

    const fareRule =
      await FareRule.create({
        journey,
        capacity,
        weekdayPrice,
        weekendPrice,
        holidayPrice,
      });

    return res.status(201).json({
      message: "Thêm bảng giá thành công",
      data: fareRule,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Sửa bảng giá
export const updateOne = async (req, res) => {
  try {
    const fareRule =
      await FareRule.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );

    if (!fareRule) {
      return res.status(404).json({
        message: "Không tìm thấy bảng giá",
      });
    }

    return res.json({
      message: "Cập nhật thành công",
      data: fareRule,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Xóa bảng giá
export const deleteOne = async (req, res) => {
  try {
    const fareRule =
      await FareRule.findByIdAndDelete(
        req.params.id
      );

    if (!fareRule) {
      return res.status(404).json({
        message: "Không tìm thấy bảng giá",
      });
    }

    return res.json({
      message: "Xóa bảng giá thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};