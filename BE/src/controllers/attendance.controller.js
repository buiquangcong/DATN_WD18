import asyncHandler from "../utils/asyncHandler.js";
import Attendance from "../models/attendance.model.js";
import Trip from "../models/trip.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// ===============================
// MULTER CONFIG - UPLOAD ẢNH
// ===============================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/attendance";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadProofImage = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;

    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh (jpg, png, webp)!"));
    }
  },
}).single("proofImage");

// ===============================
// LẤY TOÀN BỘ CHẤM CÔNG
// ===============================

export const getAll = asyncHandler(async (req, res) => {
  const records = await Attendance.find()
    .populate("staff")
    .populate({
      path: "trip",
      populate: [
        { path: "journey" },
        { path: "bus" },
      ],
    })
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: records,
  });
});

// ===============================
// CHECK-IN
// Dùng cho cả TÀI XẾ và PHỤ XE
// ===============================

export const checkIn = asyncHandler(async (req, res) => {
  const { staffId, tripId } = req.body;

  if (!staffId || !tripId) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin staffId hoặc tripId",
    });
  }

  // ===============================
  // KIỂM TRA CHUYẾN XE
  // ===============================

  const trip = await Trip.findById(tripId)
    .populate("journey")
    .populate("bus");

  if (!trip) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy chuyến xe",
    });
  }

  // ===============================
  // KIỂM TRA NHÂN VIÊN ĐƯỢC PHÂN CÔNG
  // ===============================

  // Tài xế (field "staff" trong trip model)
  const isDriver =
    trip.staff &&
    trip.staff.toString() === staffId;

  // Phụ xe (field "assistantDriver" trong trip model)
  const isAssistantDriver =
    trip.assistantDriver &&
    trip.assistantDriver.toString() === staffId;

  if (!isDriver && !isAssistantDriver) {
    return res.status(403).json({
      success: false,
      message: "Bạn không được phân công cho chuyến xe này",
    });
  }

  // ===============================
  // NẾU LÀ TÀI XẾ
  // PHẢI XÁC NHẬN CHẠY CHUYẾN
  // ===============================

  if (isDriver && !trip.driverConfirmed) {
    return res.status(400).json({
      success: false,
      message:
        "Bạn phải xác nhận chạy chuyến trước khi chấm công!",
    });
  }

  // ===============================
  // KIỂM TRA TRẠNG THÁI CHUYẾN
  // ===============================

  if (isDriver && trip.status === "đang chạy") {
    return res.status(400).json({
      success: false,
      message: "Xe đang chạy, không thể chấm công!",
    });
  }

  if (trip.status === "hoàn thành") {
    return res.status(400).json({
      success: false,
      message: "Chuyến xe đã hoàn thành!",
    });
  }

  if (trip.status === "huỷ") {
    return res.status(400).json({
      success: false,
      message: "Chuyến xe đã bị huỷ!",
    });
  }

  // ===============================
  // KIỂM TRA THỜI GIAN CHECK-IN
  // CHỈ ĐƯỢC CHECK-IN TRƯỚC GIỜ ĐI 15 PHÚT
  // ===============================

  const now = new Date();

  const departureTime = new Date(
    trip.departureTime
  );

  const diffMs =
    departureTime.getTime() - now.getTime();

  const diffMinutes =
    diffMs / (1000 * 60);

  // Còn hơn 15 phút mới chạy
  if (diffMinutes > 15) {
    const allowTime = new Date(
      departureTime.getTime() -
        15 * 60 * 1000
    );

    return res.status(400).json({
      success: false,
      message: `Chưa đến giờ chấm công! Bạn chỉ được chấm công từ ${allowTime.toLocaleString(
        "vi-VN"
      )}`,
    });
  }

  // Quá 15 phút sau giờ khởi hành
  if (diffMinutes < -15) {
    return res.status(400).json({
      success: false,
      message:
        "Đã quá giờ khởi hành 15 phút, không thể chấm công!",
    });
  }

  // ===============================
  // BẮT BUỘC UPLOAD ẢNH
  // ===============================

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message:
        "Vui lòng tải lên ảnh minh chứng để chấm công!",
    });
  }

  // ===============================
  // KIỂM TRA ĐÃ CHECK-IN CHƯA
  // ===============================

  const existing = await Attendance.findOne({
    staff: staffId,
    trip: tripId,
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message:
        "Bạn đã check-in cho chuyến xe này rồi",
    });
  }

  // ===============================
  // LƯU ẢNH
  // ===============================

  const proofImage = `/${req.file.path}`;

  // ===============================
  // TẠO BẢN GHI CHẤM CÔNG
  // ===============================

  const attendance = await Attendance.create({
    staff: staffId,
    trip: tripId,

    checkInTime: new Date(),

    // Khi mới tạo => đã check-in
    status: "checked_in",

    proofImage,
  });

  // ===============================
  // CẬP NHẬT TRẠNG THÁI CHUYẾN XE
  // SẮP CHẠY -> ĐANG CHẠY
  // ===============================

  if (isDriver && trip.status === "sắp chạy") {
    await Trip.findByIdAndUpdate(tripId, { status: "đang chạy" });
  }

  return res.status(201).json({
    success: true,
    message: "Check-in thành công!",
    data: attendance,
  });
});

// ===============================
// CHECK-OUT
// Dùng cho cả TÀI XẾ và PHỤ XE
// ===============================

export const checkOut = asyncHandler(async (req, res) => {
  const { staffId, tripId } = req.body;

  if (!staffId || !tripId) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin staffId hoặc tripId",
    });
  }

  // ===============================
  // TÌM BẢN GHI CHẤM CÔNG
  // ===============================

  const attendance = await Attendance.findOne({
    staff: staffId,
    trip: tripId,
  });

  if (!attendance) {
    return res.status(404).json({
      success: false,
      message:
        "Bạn chưa check-in cho chuyến xe này",
    });
  }

  // Kiểm tra trip để xác định vai trò
  const trip = await Trip.findById(tripId);
  const isDriver = trip && trip.staff && trip.staff.toString() === staffId;

  // ===============================
  // CHƯA CHECK-IN
  // ===============================

  if (attendance.status !== "checked_in") {
    return res.status(400).json({
      success: false,
      message:
        "Bạn chưa check-in nên không thể check-out!",
    });
  }

  // ===============================
  // CHECK-OUT
  // ===============================

  attendance.checkOutTime = new Date();

  attendance.status = "checked_out";

  await attendance.save();

  // ===============================
  // CẬP NHẬT TRẠNG THÁI CHUYẺN XE
  // ĐANG CHẠY -> HOÀN THÀNH
  // ===============================

  if (isDriver && trip && trip.status === "đang chạy") {
    await Trip.findByIdAndUpdate(tripId, { status: "hoàn thành" });
  }

  return res.json({
    success: true,
    message: "Check-out thành công!",
    data: attendance,
  });
});

// ===============================
// LẤY LỊCH SỬ CHẤM CÔNG THEO STAFF
// ===============================

export const getByStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const records = await Attendance.find({
    staff: staffId,
  })
    .populate({
      path: "trip",
      populate: [
        { path: "journey" },
        { path: "bus" },
      ],
    })
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: records,
  });
});

// ===============================
// LẤY CHẤM CÔNG THEO CHUYẾN
// ===============================

export const getByTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const records = await Attendance.find({
    trip: tripId,
  })
    .populate("staff")
    .populate({
      path: "trip",
      populate: [
        { path: "journey" },
        { path: "bus" },
      ],
    });

  return res.json({
    success: true,
    data: records,
  });
});

// ===============================
// LẤY TRẠNG THÁI CHẤM CÔNG
// CỦA 1 STAFF CHO NHIỀU CHUYẾN
// ===============================

export const getByStaffTrips = asyncHandler(
  async (req, res) => {
    const { staffId } = req.params;

    const records = await Attendance.find({
      staff: staffId,
    });

    // Dạng:
    // {
    //   tripId: {
    //      status,
    //      checkInTime,
    //      checkOutTime
    //   }
    // }

    const map = {};

    records.forEach((r) => {
      map[r.trip.toString()] = {
        status: r.status,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
        proofImage: r.proofImage,
      };
    });

    return res.json({
      success: true,
      data: map,
    });
  }
);