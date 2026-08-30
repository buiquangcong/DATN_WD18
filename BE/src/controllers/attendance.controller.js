import asyncHandler from "../utils/asyncHandler.js";
import Attendance from "../models/attendance.model.js";
import Trip from "../models/trip.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Multer config for attendance proof images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/attendance";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadProofImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh (jpg, png, webp)!"));
    }
  },
}).single("proofImage");

// Lấy toàn bộ danh sách chấm công
export const getAll = asyncHandler(async (req, res) => {
  const records = await Attendance.find();
  return res.json({
    success: true,
    data: records,
  });
});
// Check-in: Tài xế bắt đầu ca làm việc cho 1 chuyến
export const checkIn = asyncHandler(async (req, res) => {
  const { staffId, tripId } = req.body;

  if (!staffId || !tripId) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin staffId hoặc tripId",
    });
  }

  // Kiểm tra chuyến xe tồn tại và thuộc về tài xế này
  const trip = await Trip.findById(tripId).populate("journey").populate("bus");

  if (!trip) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy chuyến xe",
    });
  }

  if (trip.staff.toString() !== staffId) {
    return res.status(403).json({
      success: false,
      message: "Chuyến xe này không được phân công cho bạn",
    });
  }

  // Kiểm tra tài xế đã xác nhận chạy chuyến chưa
  if (!trip.driverConfirmed) {
    return res.status(400).json({
      success: false,
      message: "Bạn phải xác nhận chạy chuyến trước khi chấm công!",
    });
  }

  // Kiểm tra xe đang chạy thì không được chấm công
  if (trip.status === "đang chạy") {
    return res.status(400).json({
      success: false,
      message: "Xe đang chạy, không thể chấm công!",
    });
  }

  // Kiểm tra chỉ được chấm công trước giờ khởi hành 15 phút
  const now = new Date();
  const departureTime = new Date(trip.departureTime);
  const diffMs = departureTime.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  if (diffMinutes > 15) {
    const allowTime = new Date(departureTime.getTime() - 15 * 60 * 1000);
    return res.status(400).json({
      success: false,
      message: `Chưa đến giờ chấm công! Bạn chỉ được chấm công trước giờ khởi hành 15 phút (từ ${allowTime.toLocaleString("vi-VN")})`,
    });
  }

  if (diffMinutes < -15) {
    return res.status(400).json({
      success: false,
      message: "Đã quá giờ khởi hành 15 phút, không thể chấm công!",
    });
  }

  // Yêu cầu upload ảnh minh chứng
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng tải lên ảnh minh chứng để chấm công!",
    });
  }

  // Kiểm tra đã chấm công chưa
  const existing = await Attendance.findOne({ staff: staffId, trip: tripId });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Bạn đã chấm công cho chuyến xe này rồi",
    });
  }

  const proofImage = `/${req.file.path}`;

  const attendance = await Attendance.create({
    staff: staffId,
    trip: tripId,
    checkInTime: new Date(),
    status: "checked_in",
    proofImage,
  });

  return res.status(201).json({
    success: true,
    message: "Chấm công thành công!",
    data: attendance,
  });
});

// Check-out: Tài xế kết thúc ca làm việc cho 1 chuyến
export const checkOut = asyncHandler(async (req, res) => {
  const { staffId, tripId } = req.body;

  if (!staffId || !tripId) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin staffId hoặc tripId",
    });
  }

  const attendance = await Attendance.findOne({ staff: staffId, trip: tripId });

  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: "Bạn chưa chấm công cho chuyến xe này",
    });
  }

  if (attendance.status === "checked_out") {
    return res.status(400).json({
      success: false,
      message: "Bạn đã check-out cho chuyến xe này rồi",
    });
  }

  attendance.checkOutTime = new Date();
  attendance.status = "checked_out";
  await attendance.save();

  return res.json({
    success: true,
    message: "Check-out thành công!",
    data: attendance,
  });
});

// Lấy lịch sử chấm công theo staff
export const getByStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const records = await Attendance.find({ staff: staffId })
    .populate({
      path: "trip",
      populate: [{ path: "journey" }, { path: "bus" }],
    })
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: records,
  });
});

// Lấy trạng thái chấm công theo chuyến xe
export const getByTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const record = await Attendance.findOne({ trip: tripId }).populate("staff");

  return res.json({
    success: true,
    data: record,
  });
});

// Lấy trạng thái chấm công của 1 tài xế cho nhiều chuyến (theo danh sách tripIds)
export const getByStaffTrips = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const records = await Attendance.find({ staff: staffId });

  // Trả về dạng map { tripId: status }
  const map = {};
  records.forEach((r) => {
    map[r.trip.toString()] = {
      status: r.status,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
    };
  });

  return res.json({
    success: true,
    data: map,
  });
});
