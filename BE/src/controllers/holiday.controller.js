import asyncHandler from "../utils/asyncHandler.js";
import Holiday from "../models/holiday.model.js";
import Trip from "../models/trip.model.js";

// Kiểm tra ngày có thực sự tồn tại trong tháng đó không (VD chặn 30/2, 31/4, 31/6, 31/9, 31/11)
// Dùng năm thường (2025, không nhuận) làm mốc để Tháng 2 luôn giới hạn 28 ngày,
// tránh trường hợp khai báo 29/2 rồi "im lặng" không áp dụng ở các năm không nhuận
const isValidDayMonth = (day, month) => {
  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12
  ) {
    return false;
  }

  const date = new Date(2025, month - 1, day);

  return date.getMonth() === month - 1 && date.getDate() === day;
};

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
  const { day, month } = req.body;

  if (!isValidDayMonth(day, month)) {
    return res.status(400).json({
      message: `Ngày ${day} không hợp lệ với tháng ${month}`,
    });
  }

  // Chặn thêm trùng ngày/tháng (Holiday không lưu năm, lặp lại hàng năm nên
  // 2 bản ghi cùng ngày/tháng là dữ liệu trùng lặp vô nghĩa)
  const existed = await Holiday.findOne({ day, month });

  if (existed) {
    return res.status(400).json({
      message: `Ngày lễ ${day}/${month} đã tồn tại (${existed.name})`,
    });
  }

  const holiday = await Holiday.create(req.body);

  return res.status(201).json({
    message: "Thêm ngày lễ thành công",
    data: holiday,
  });
});

export const updateOne = asyncHandler(async (req, res) => {
  const { day, month } = req.body;

  // Nếu người dùng đổi day/month, cũng cần chặn trùng với 1 bản ghi khác
  // (loại trừ chính bản ghi đang sửa)
  if (day !== undefined && month !== undefined) {
    if (!isValidDayMonth(day, month)) {
      return res.status(400).json({
        message: `Ngày ${day} không hợp lệ với tháng ${month}`,
      });
    }

    const existed = await Holiday.findOne({
      day,
      month,
      _id: { $ne: req.params.id },
    });

    if (existed) {
      return res.status(400).json({
        message: `Ngày lễ ${day}/${month} đã tồn tại (${existed.name})`,
      });
    }
  }

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
  const holiday = await Holiday.findById(req.params.id);

  if (!holiday) {
    return res.status(404).json({
      message: "Không tìm thấy ngày lễ",
    });
  }

  // Chặn xóa nếu đã có Trip nào khởi hành đúng ngày/tháng này (nghĩa là ngày lễ
  // này đã từng được dùng để tính giá vé - xóa đi sẽ làm sai lệch dữ liệu lịch sử)
  const usedByTrip = await Trip.findOne({
    $expr: {
      $and: [
        { $eq: [{ $dayOfMonth: "$departureTime" }, holiday.day] },
        { $eq: [{ $month: "$departureTime" }, holiday.month] },
      ],
    },
  });

  if (usedByTrip) {
    return res.status(400).json({
      message:
        "Ngày lễ này đã có chuyến xe sử dụng để tính giá vé, không thể xoá.",
    });
  }

  await Holiday.findByIdAndDelete(req.params.id);

  return res.json({
    message: "Xóa ngày lễ thành công",
  });
});