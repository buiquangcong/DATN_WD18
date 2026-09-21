import Incident from "../models/incident.model.js";
import Trip from "../models/trip.model.js";
import Staff from "../models/staff.model.js";
import asyncHandler from "../utils/asyncHandler.js";

// Tạo mới báo cáo sự cố từ tài xế
export const createIncident = asyncHandler(async (req, res) => {
  const {
    tripId,
    trip,
    staffId,
    staff,
    driverName,
    issueType,
    severity,
    note,
    images,
    tripInfo,
  } = req.body;

  const targetTripId = tripId || trip;
  if (!targetTripId) {
    return res.status(400).json({
      success: false,
      message: "Mã chuyến xe (tripId) là bắt buộc!",
    });
  }

  if (!note || !note.trim()) {
    return res.status(400).json({
      success: false,
      message: "Ghi chú nội dung sự cố là bắt buộc!",
    });
  }

  const targetStaffId = staffId || staff || null;

  // Lấy thông tin chuyến đi nếu chưa có tripInfo
  let finalTripInfo = tripInfo || {};
  const foundTrip = await Trip.findById(targetTripId)
    .populate("journey")
    .populate("bus")
    .populate("staff");

  if (foundTrip) {
    if (!finalTripInfo.route) {
      finalTripInfo.route = `${foundTrip.journey?.diemDi || ""} → ${foundTrip.journey?.diemDen || ""}`;
    }
    if (!finalTripInfo.busName) {
      finalTripInfo.busName = foundTrip.bus?.name || "";
    }
    if (!finalTripInfo.licensePlates) {
      finalTripInfo.licensePlates = foundTrip.bus?.licensePlates || "";
    }
    if (!finalTripInfo.departureTime) {
      finalTripInfo.departureTime = foundTrip.departureTime;
    }
  }

  let finalDriverName = driverName;
  if (!finalDriverName && targetStaffId) {
    const foundStaff = await Staff.findById(targetStaffId);
    if (foundStaff) {
      finalDriverName = foundStaff.ten || foundStaff.name || "Tài xế";
    }
  }

  const newIncident = await Incident.create({
    trip: targetTripId,
    staff: targetStaffId,
    driverName: finalDriverName || "Tài xế",
    issueType: issueType || "Sự cố kỹ thuật / Hỏng hóc xe",
    severity: severity || "Bình thường",
    note: note.trim(),
    images: Array.isArray(images) ? images : [],
    tripInfo: finalTripInfo,
    status: "Chờ xử lý",
  });

  return res.status(201).json({
    success: true,
    message: "Gửi báo cáo sự cố thành công!",
    data: newIncident,
  });
});

// Lấy tất cả sự cố cho Admin
export const getAll = asyncHandler(async (req, res) => {
  const { status, severity, tripId, search } = req.query;
  const query = {};

  if (status && status !== "All") {
    query.status = status;
  }

  if (severity && severity !== "All") {
    query.severity = severity;
  }

  if (tripId) {
    query.trip = tripId;
  }

  if (search) {
    query.$or = [
      { driverName: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
      { issueType: { $regex: search, $options: "i" } },
      { "tripInfo.route": { $regex: search, $options: "i" } },
      { "tripInfo.licensePlates": { $regex: search, $options: "i" } },
    ];
  }

  const incidents = await Incident.find(query)
    .populate({
      path: "trip",
      populate: [
        { path: "journey" },
        { path: "bus" },
        { path: "staff" },
        { path: "assistantDriver" },
      ],
    })
    .populate("staff")
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: incidents,
  });
});

// Lấy chi tiết 1 sự cố
export const getOne = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id)
    .populate({
      path: "trip",
      populate: [
        { path: "journey" },
        { path: "bus" },
        { path: "staff" },
        { path: "assistantDriver" },
      ],
    })
    .populate("staff");

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy báo cáo sự cố!",
    });
  }

  return res.json({
    success: true,
    data: incident,
  });
});

// Lấy sự cố theo chuyến xe
export const getByTrip = asyncHandler(async (req, res) => {
  const incidents = await Incident.find({ trip: req.params.tripId })
    .populate("staff")
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: incidents,
  });
});

// Cập nhật trạng thái sự cố và phản hồi của Admin
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, adminResponse } = req.body;
  const updateData = {};

  if (status) {
    updateData.status = status;
    if (status === "Đã giải quyết") {
      updateData.resolvedAt = new Date();
    }
  }

  if (adminResponse !== undefined) {
    updateData.adminResponse = adminResponse;
  }

  const incident = await Incident.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  ).populate({
    path: "trip",
    populate: [
      { path: "journey" },
      { path: "bus" },
      { path: "staff" },
    ],
  });

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy báo cáo sự cố!",
    });
  }

  return res.json({
    success: true,
    message: "Cập nhật trạng thái sự cố thành công!",
    data: incident,
  });
});

// Xóa báo cáo sự cố
export const deleteOne = asyncHandler(async (req, res) => {
  const incident = await Incident.findByIdAndDelete(req.params.id);

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy báo cáo sự cố!",
    });
  }

  return res.json({
    success: true,
    message: "Xóa báo cáo sự cố thành công!",
    data: incident,
  });
});
