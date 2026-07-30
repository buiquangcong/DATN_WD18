import asyncHandler from "../utils/asyncHandler";
import Journey from "../models/journey.model";
import Trip from "../models/trip.model";

// =======================
// Lấy tất cả tuyến
// =======================
export const getAll = asyncHandler(async (req, res) => {
  const journeys = await Journey.find();

  return res.json(journeys);
});

// =======================
// Lấy chi tiết
// =======================
export const getOne = asyncHandler(async (req, res) => {
  const journey = await Journey.findById(req.params.id);

  if (!journey) {
    return res.status(404).json({
      message: "Không tìm thấy tuyến đường",
    });
  }

  return res.json(journey);
});

// =======================
// Thêm tuyến
// =======================
export const createOne = asyncHandler(async (req, res) => {
  const { diemDi, diemDen } = req.body;

  const existed = await Journey.findOne({
    diemDi: diemDi.trim(),
    diemDen: diemDen.trim(),
  });

  if (existed) {
    return res.status(400).json({
      message: "Tuyến đường này đã tồn tại",
    });
  }

  const newJourney = await Journey.create(req.body);

  return res.status(201).json({
    message: "Thêm tuyến đường thành công",
    data: newJourney,
  });
});

// =======================
// Cập nhật tuyến
// =======================
export const updateOne = asyncHandler(async (req, res) => {
  const { diemDi, diemDen } = req.body;

  const currentJourney = await Journey.findById(req.params.id);

  if (!currentJourney) {
    return res.status(404).json({
      message: "Không tìm thấy tuyến đường",
    });
  }

  const existed = await Journey.findOne({
    diemDi: diemDi.trim(),
    diemDen: diemDen.trim(),
    _id: { $ne: req.params.id },
  });

  if (existed) {
    return res.status(400).json({
      message: "Tuyến đường này đã tồn tại",
    });
  }

  const updatedJourney = await Journey.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    }
  );

  return res.json({
    message: "Cập nhật tuyến đường thành công",
    data: updatedJourney,
  });
});

// =======================
// Xóa tuyến
// =======================
export const deleteOne = asyncHandler(async (req, res) => {
  const journeyId = req.params.id;

  const currentJourney = await Journey.findById(journeyId);

  if (!currentJourney) {
    return res.status(404).json({
      message: "Không tìm thấy tuyến đường",
    });
  }

  // Kiểm tra đã được dùng trong Trip chưa
  const existedTrip = await Trip.exists({
    journey: journeyId,
  });

  if (existedTrip) {
    return res.status(400).json({
      message: "Tuyến đường đang được sử dụng, không thể xóa",
    });
  }

  await Journey.findByIdAndDelete(journeyId);

  return res.json({
    message: "Xóa tuyến đường thành công",
  });
});