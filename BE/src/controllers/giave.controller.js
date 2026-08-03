import FareRule from "../models/giave.model.js";
import Trip from "../models/trip.model.js";
// Lấy tất cả bảng giá
export const getAll = async (req, res) => {
  try {
    const fareRules = await FareRule.find().populate("journey");
    return res.json(fareRules);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Lấy 1 bảng giá
export const getOne = async (req, res) => {
  try {
    const fareRule = await FareRule.findById(req.params.id).populate("journey");
    if (!fareRule) {
      return res.status(404).json({ message: "Không tìm thấy bảng giá" });
    }
    return res.json(fareRule);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Thêm bảng giá
export const createOne = async (req, res) => {
  try {
    const { journey, capacity, weekdayPrice, weekendPrice, holidayPrice } = req.body;

    // Kiểm tra trùng tuyến + loại xe
    const existed = await FareRule.findOne({ journey, capacity });

    if (existed) {
      return res.status(400).json({
        message: "Bảng giá cho tuyến và loại xe này đã tồn tại",
      });
    }

    const fareRule = await FareRule.create({
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
    return res.status(500).json({ message: error.message });
  }
};

// Sửa bảng giá (Đã bổ sung check trùng)
export const updateOne = async (req, res) => {
  try {
    const { journey, capacity } = req.body;

    // Nếu có gửi journey và capacity lên để cập nhật, kiểm tra xem đã có bản ghi nào khác trùng chưa
    if (journey && capacity) {
      const existed = await FareRule.findOne({
        journey,
        capacity,
        _id: { $ne: req.params.id }, // Loại trừ chính ID đang chỉnh sửa
      });

      if (existed) {
        return res.status(400).json({
          message: "Bảng giá cho tuyến và loại xe này đã tồn tại ở bản ghi khác",
        });
      }
    }

    const fareRule = await FareRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!fareRule) {
      return res.status(404).json({ message: "Không tìm thấy bảng giá" });
    }

    return res.json({
      message: "Cập nhật thành công",
      data: fareRule,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Xóa bảng giá
export const deleteOne = async (req, res) => {
  try {
    const { id } = req.params;

  
    const isFareRuleInUse = await Trip.findOne({
      $or: [
        { fareRule: id },  
        { giaVe: id }      
      ]
    });

    if (isFareRuleInUse) {
      return res.status(400).json({
        message: "Không thể xóa giá vé này vì đang có chuyến đi sử dụng!",
      });
    }

    const fareRule = await FareRule.findByIdAndDelete(id);

    if (!fareRule) {
      return res.status(404).json({
        message: "Không tìm thấy bảng giá vé",
      });
    }

    return res.json({
      message: "Xóa bảng giá vé thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};