import asyncHandler from "../utils/asyncHandler.js";
import Trip from "../models/trip.model.js";
import Bus from "../models/bus.model.js";
import generateSeats from "../utils/seatGenerator.js";
import Staff from "../models/staff.model.js";
import FareRule from "../models/giave.model.js";
import Booking from "../models/booking.model.js";
import Journey from "../models/journey.model.js";
import {TURN_AROUND_MINUTES,LOCATION_CHECK_MAX_GAP_MINUTES,checkBusAvailability,checkStaffAvailability,} from "../services/Tripavailability.service.js";
import { calculateTicketPrice } from "../services/tripPricing.service.js";
const updateTripStatus = async () => {
  const now = new Date();

  // ==============================
  // Sắp chạy -> Đang chạy
  // KHÔNG tự động theo giờ nữa.
  // Chỉ tài xế check-in mới kích hoạt (xem attendance.controller.js)
  // ==============================

  // ==============================
  // Đang chạy -> Hoàn thành
  // KHÔNG tự động theo giờ nữa.
  // Chỉ tài xế check-out mới kích hoạt (xem attendance.controller.js)
  // ==============================
};
export const getAll = asyncHandler(async (req, res) => {
  await updateTripStatus();

  const trips = await Trip.find()
    .populate("journey")
    .populate("bus")
    .populate("staff")
    .populate("assistantDriver")
    .populate("fareRule");

  return res.json(trips);
});

export const getOne = asyncHandler(async (req, res) => {
  await updateTripStatus();

  const trip = await Trip.findById(req.params.id)
    .populate("journey")
    .populate("bus")
    .populate("staff")
    .populate("assistantDriver")
    .populate("fareRule");

  if (!trip) {
    return res.status(404).json({
      message: "Không tìm thấy chuyến xe",
    });
  }

  return res.json(trip);
});

export const getDrivers = asyncHandler(async (req, res) => {
  const drivers = await Staff.find({
    chucVu: "Driver",
    trangThai: "Hoạt động",
  });

  res.json(drivers);
});

export const getAssistantDrivers = asyncHandler(async (req, res) => {
  const assistantDrivers = await Staff.find({
    chucVu: "Assistant_Driver",
    trangThai: "Hoạt động",
  });

  res.json(assistantDrivers);
});

export const getAvailableDrivers = asyncHandler(
  async (req, res) => {
    await updateTripStatus();

    const {
      weekdays,
      startDate,
      endDate,
      departureHour,
      arrivalHour,
      journey,
      excludeTripId,
    } = req.query;

    // ==================================================
    // VALIDATE
    // ==================================================

    if (
      !weekdays ||
      !startDate ||
      !endDate ||
      !departureHour ||
      !arrivalHour ||
      !journey
    ) {
      return res.status(400).json({
        message:
          "Thiếu thông tin để kiểm tra tài xế rảnh.",
      });
    }

    // ==================================================
    // NGÀY CHẠY
    // ==================================================

    const weekdaysArr = String(weekdays)
      .split(",")
      .map(Number)
      .filter(
        (n) =>
          !Number.isNaN(n) &&
          n >= 0 &&
          n <= 6
      );

    // ==================================================
    // GIỜ
    // ==================================================

    const [depHour, depMinute] =
      departureHour.split(":").map(Number);

    const [arrHour, arrMinute] =
      arrivalHour.split(":").map(Number);

    const depMinutes =
      depHour * 60 + depMinute;

    const arrMinutes =
      arrHour * 60 + arrMinute;

    if (arrMinutes <= depMinutes) {
      return res.status(400).json({
        message:
          "Giờ đến phải sau giờ khởi hành trong cùng ngày.",
      });
    }

    // ==================================================
    // TUYẾN
    // ==================================================

    const journeyInfo =
      await Journey.findById(journey);

    if (!journeyInfo) {
      return res.status(404).json({
        message:
          "Không tìm thấy tuyến đường.",
      });
    }

    // ==================================================
    // TẠO SLOT
    // ==================================================

    const slots = [];

    let current = new Date(startDate);
    const end = new Date(endDate);

    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      if (
        weekdaysArr.includes(
          current.getDay()
        )
      ) {
        const departureTime =
          new Date(current);

        departureTime.setHours(
          depHour,
          depMinute,
          0,
          0
        );

        const arrivalTime =
          new Date(current);

        arrivalTime.setHours(
          arrHour,
          arrMinute,
          0,
          0
        );

        slots.push({
          departureTime,
          arrivalTime,
        });
      }

      current.setDate(
        current.getDate() + 1
      );
    }

    // ==================================================
    // LẤY TÀI XẾ
    // ==================================================

    const allDrivers = await Staff.find({
      trangThai: "Hoạt động",
      chucVu: "Driver",
    });

    const availableDrivers = [];

    // ==================================================
    // CHECK TỪNG TÀI XẾ
    // ==================================================

    for (const driver of allDrivers) {
      let available = true;

      for (const slot of slots) {
        const error =
          await checkStaffAvailability(
            driver._id,
            journeyInfo,
            slot.departureTime,
            slot.arrivalTime,
            excludeTripId || null
          );

        if (error) {
          available = false;
          break;
        }
      }

      if (available) {
        availableDrivers.push(driver);
      }
    }

    return res.json(availableDrivers);
  }
);
export const getAvailableAssistantDrivers = asyncHandler(
  async (req, res) => {
    await updateTripStatus();

    const {
      weekdays,
      startDate,
      endDate,
      departureHour,
      arrivalHour,
      journey,
      excludeTripId,
    } = req.query;

    if (
      !weekdays ||
      !startDate ||
      !endDate ||
      !departureHour ||
      !arrivalHour ||
      !journey
    ) {
      return res.status(400).json({
        message:
          "Thiếu thông tin để kiểm tra phụ xe rảnh.",
      });
    }

    const weekdaysArr = String(weekdays)
      .split(",")
      .map(Number)
      .filter(
        (n) =>
          !Number.isNaN(n) &&
          n >= 0 &&
          n <= 6
      );

    const [depHour, depMinute] =
      departureHour.split(":").map(Number);

    const [arrHour, arrMinute] =
      arrivalHour.split(":").map(Number);

    const depMinutes =
      depHour * 60 + depMinute;

    const arrMinutes =
      arrHour * 60 + arrMinute;

    if (arrMinutes <= depMinutes) {
      return res.status(400).json({
        message:
          "Giờ đến phải sau giờ khởi hành trong cùng ngày.",
      });
    }

    const journeyInfo =
      await Journey.findById(journey);

    if (!journeyInfo) {
      return res.status(404).json({
        message:
          "Không tìm thấy tuyến đường.",
      });
    }

    const slots = [];

    let current = new Date(startDate);
    const end = new Date(endDate);

    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      if (
        weekdaysArr.includes(
          current.getDay()
        )
      ) {
        const departureTime =
          new Date(current);

        departureTime.setHours(
          depHour,
          depMinute,
          0,
          0
        );

        const arrivalTime =
          new Date(current);

        arrivalTime.setHours(
          arrHour,
          arrMinute,
          0,
          0
        );

        slots.push({
          departureTime,
          arrivalTime,
        });
      }

      current.setDate(
        current.getDate() + 1
      );
    }

    // LẤY PHỤ XE
    const allAssistantDrivers =
      await Staff.find({
        chucVu: "Assistant_Driver",
        trangThai: "Hoạt động",
      });

    const availableAssistantDrivers = [];

    // CHECK TỪNG PHỤ XE
    for (const assistant of allAssistantDrivers) {
      let available = true;

      for (const slot of slots) {
        const error =
          await checkStaffAvailability(
            assistant._id,
            journeyInfo,
            slot.departureTime,
            slot.arrivalTime,
            excludeTripId || null
          );

        if (error) {
          available = false;
          break;
        }
      }

      if (available) {
        availableAssistantDrivers.push(
          assistant
        );
      }
    }

    return res.json(
      availableAssistantDrivers
    );
  }
);
export const getAvailableBuses = asyncHandler(async (req, res) => {
  await updateTripStatus();

  const {
    weekdays,
    startDate,
    endDate,
    departureHour,
    arrivalHour,
    journey,
    excludeTripId,
  } = req.query;

  if (
    !weekdays ||
    !startDate ||
    !endDate ||
    !departureHour ||
    !arrivalHour ||
    !journey
  ) {
    return res.status(400).json({
      message: "Thiếu thông tin để kiểm tra xe rảnh.",
    });
  }

  const weekdaysArr = String(weekdays)
    .split(",")
    .map(Number)
    .filter((n) => !Number.isNaN(n));

  const journeyInfo = await Journey.findById(journey);

  if (!journeyInfo) {
    return res.status(404).json({
      message: "Không tìm thấy tuyến đường",
    });
  }

  const [depHour, depMinute] = departureHour
    .split(":")
    .map(Number);

  const [arrHour, arrMinute] = arrivalHour
    .split(":")
    .map(Number);

  // =====================================================
  // TẠO CÁC SLOT CẦN KIỂM TRA
  // =====================================================

  const slots = [];

  let current = new Date(startDate);
  const end = new Date(endDate);

  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    if (weekdaysArr.includes(current.getDay())) {
      const departureTime = new Date(current);

      departureTime.setHours(
        depHour,
        depMinute,
        0,
        0
      );

      const arrivalTime = new Date(current);

      arrivalTime.setHours(
        arrHour,
        arrMinute,
        0,
        0
      );

      slots.push({
        departureTime,
        arrivalTime,
      });
    }

    current.setDate(
      current.getDate() + 1
    );
  }

  // =====================================================
  // LẤY XE HOẠT ĐỘNG
  // =====================================================

  const allBuses = await Bus.find({
    status: "hoạt động",
  });

  const availableBuses = [];

  // =====================================================
  // CHECK TỪNG XE
  // =====================================================

  for (const bus of allBuses) {
    let available = true;

    for (const slot of slots) {

      const error = await checkBusAvailability(
        bus._id,
        journeyInfo,
        slot.departureTime,
        slot.arrivalTime,
        excludeTripId || null
      );

      if (error) {
        available = false;
        break;
      }
    }

    if (available) {
      availableBuses.push(bus);
    }
  }

  return res.json(availableBuses);
});

export const createOne = asyncHandler(async (req, res) => {
  const {
    journey,
    bus,
    staff,
    assistantDriver,
    departureTime,
    arrivalTime,
    fareRule,
  } = req.body;

  const busInfo = await Bus.findById(bus);

  if (!busInfo) {
    return res.status(422).json({
      success: false,
      message:
        "Không tìm thấy thông tin xe khách tương ứng để tự động sinh ghế.",
    });
  }

  const autoSeats = generateSeats(
    busInfo.capacity,
    busInfo.type
  );

  if (!autoSeats.length) {
    return res.status(400).json({
      success: false,
      message:
        "Cấu hình số chỗ hoặc loại xe không hợp lệ.",
    });
  }

  const journeyInfo = await Journey.findById(journey);

  if (!journeyInfo) {
    return res.status(404).json({
      message: "Không tìm thấy tuyến đường",
    });
  }

  const newDeparture = new Date(departureTime);
  const newArrival = new Date(arrivalTime);

  if (newArrival <= newDeparture) {
    return res.status(400).json({
      message: "Thời gian đến phải sau thời gian khởi hành",
    });
  }

  // ===========================
  // Kiểm tra xe
  // ===========================

  const busError = await checkBusAvailability(
    bus,
    journeyInfo,
    newDeparture,
    newArrival,
    null
  );

  if (busError) {
    return res.status(400).json({
      message: busError,
    });
  }

  // ===========================
  // Kiểm tra tài xế
  // ===========================

  if (staff) {
    const staffError = await checkStaffAvailability(
      staff,
      journeyInfo,
      newDeparture,
      newArrival,
      null
    );

    if (staffError) {
      return res.status(400).json({
        message: staffError,
      });
    }
  }

  // ===========================
  // Kiểm tra phụ xe
  // ===========================

  if (assistantDriver) {
    // Không cho tài xế và phụ xe là cùng một người
    if (staff && String(staff) === String(assistantDriver)) {
      return res.status(400).json({
        message: "Tài xế và phụ xe không được là cùng một người",
      });
    }

    // Kiểm tra phụ xe có tồn tại không
    const assistant = await Staff.findById(assistantDriver);

    if (!assistant) {
      return res.status(404).json({
        message: "Không tìm thấy phụ xe",
      });
    }

    // Kiểm tra đúng chức vụ phụ xe
    if (assistant.chucVu !== "Assistant_Driver") {
      return res.status(400).json({
        message: "Nhân viên được chọn không phải là phụ xe",
      });
    }

    // Kiểm tra phụ xe còn làm việc
    if (assistant.trangThai !== "Hoạt động") {
      return res.status(400).json({
        message: "Phụ xe hiện không còn làm việc",
      });
    }

    // Kiểm tra phụ xe có bị trùng lịch không
    const assistantError = await checkStaffAvailability(
      assistantDriver,
      journeyInfo,
      newDeparture,
      newArrival,
      null
    );

    if (assistantError) {
      return res.status(400).json({
        message: `Phụ xe: ${assistantError}`,
      });
    }
  }

  // ===========================
  // Lấy bảng giá
  // ===========================

  const fare = await FareRule.findById(fareRule);

  if (!fare) {
    return res.status(404).json({
      message: "Không tìm thấy bảng giá",
    });
  }

  // Chặn trường hợp bảng giá không khớp số chỗ
  if (fare.capacity !== busInfo.capacity) {
    return res.status(400).json({
      message: `Bảng giá này áp dụng cho xe ${fare.capacity} chỗ, không khớp với xe đang chọn (${busInfo.capacity} chỗ)`,
    });
  }

  // ===========================
  // Tính giá theo ngày
  // ===========================

  const ticketPrice = await calculateTicketPrice(
    fare,
    newDeparture
  );

  // ===========================
  // Tạo chuyến
  // ===========================

  const trip = await Trip.create({
    journey,
    bus,
    staff,
    assistantDriver: assistantDriver || null,
    fareRule,
    ticketPrice,
    departureTime,
    arrivalTime,
    seats: autoSeats,
  });

  return res.status(201).json({
    message:
      "Thêm chuyến xe và tự động kích hoạt sơ đồ ghế thành công!",
    data: trip,
  });
});

export const updateOne = asyncHandler(async (req, res) => {
  const {
    bus,
    staff,
    assistantDriver,
    departureTime,
    arrivalTime,
    fareRule,
  } = req.body;

  // Lấy chuyến hiện tại
  const oldTrip = await Trip.findById(req.params.id);

  if (!oldTrip) {
    return res.status(404).json({
      message: "Không tìm thấy chuyến xe",
    });
  }

  const journeyId = req.body.journey || oldTrip.journey;
  const journeyInfo = await Journey.findById(journeyId);

  if (!journeyInfo) {
    return res.status(404).json({
      message: "Không tìm thấy tuyến đường",
    });
  }

  const busId = bus || oldTrip.bus;
  const busInfo = await Bus.findById(busId);

  if (!busInfo) {
    return res.status(404).json({
      message: "Không tìm thấy xe",
    });
  }

  const newDeparture = new Date(
    departureTime || oldTrip.departureTime
  );

  const newArrival = new Date(
    arrivalTime || oldTrip.arrivalTime
  );

  if (newArrival <= newDeparture) {
    return res.status(400).json({
      message: "Thời gian đến phải sau thời gian khởi hành",
    });
  }

  // ==========================
  // Kiểm tra xe
  // ==========================

  const busError = await checkBusAvailability(
    busId,
    journeyInfo,
    newDeparture,
    newArrival,
    req.params.id
  );

  if (busError) {
    return res.status(400).json({
      message: busError,
    });
  }

  // ==========================
  // Kiểm tra tài xế
  // ==========================

  const staffId = staff || oldTrip.staff;

  if (staffId) {
    const staffError = await checkStaffAvailability(
      staffId,
      journeyInfo,
      newDeparture,
      newArrival,
      req.params.id
    );

    if (staffError) {
      return res.status(400).json({
        message: staffError,
      });
    }
  }

  // ==========================
  // Kiểm tra phụ xe
  // ==========================

  // Nếu req.body không gửi assistantDriver
  // thì giữ lại phụ xe cũ
  const assistantDriverId =
    assistantDriver !== undefined
      ? assistantDriver
      : oldTrip.assistantDriver;

  if (assistantDriverId) {
    // Không cho tài xế và phụ xe là cùng người
    if (
      staffId &&
      String(staffId) === String(assistantDriverId)
    ) {
      return res.status(400).json({
        message:
          "Tài xế và phụ xe không được là cùng một người",
      });
    }

    // Kiểm tra phụ xe tồn tại
    const assistant = await Staff.findById(
      assistantDriverId
    );

    if (!assistant) {
      return res.status(404).json({
        message: "Không tìm thấy phụ xe",
      });
    }

    // Kiểm tra đúng chức vụ
    if (assistant.chucVu !== "Assistant_Driver") {
      return res.status(400).json({
        message:
          "Nhân viên được chọn không phải là phụ xe",
      });
    }

    // Kiểm tra còn làm việc
    if (assistant.trangThai !== "Hoạt động") {
      return res.status(400).json({
        message:
          "Phụ xe hiện không còn làm việc",
      });
    }

    // Kiểm tra phụ xe có bị trùng lịch
    const assistantError =
      await checkStaffAvailability(
        assistantDriverId,
        journeyInfo,
        newDeparture,
        newArrival,
        req.params.id
      );

    if (assistantError) {
      return res.status(400).json({
        message: `Phụ xe: ${assistantError}`,
      });
    }
  }

  // ==========================
  // Tính lại giá vé
  // ==========================

  const fareId =
    fareRule || oldTrip.fareRule;

  const fare = await FareRule.findById(fareId);

  if (!fare) {
    return res.status(404).json({
      message: "Không tìm thấy bảng giá",
    });
  }

  // Kiểm tra bảng giá với số chỗ
  if (fare.capacity !== busInfo.capacity) {
    return res.status(400).json({
      message: `Bảng giá này áp dụng cho xe ${fare.capacity} chỗ, không khớp với xe đang chọn (${busInfo.capacity} chỗ)`,
    });
  }

  req.body.ticketPrice =
    await calculateTicketPrice(
      fare,
      newDeparture
    );

  // Giữ phụ xe cũ nếu không gửi giá trị mới
  req.body.assistantDriver =
    assistantDriverId || null;

  // ==========================
  // Cập nhật chuyến
  // ==========================

  const trip =
    await Trip.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    )
      .populate("journey")
      .populate("bus")
      .populate("staff")
      .populate("assistantDriver")
      .populate("fareRule");

  return res.json({
    message: "Cập nhật chuyến xe thành công",
    data: trip,
  });
});

export const deleteOne = asyncHandler(async (req, res) => {
  const tripId = req.params.id;

  const trip = await Trip.findById(tripId);

  if (!trip) {
    return res.status(404).json({
      message: "Không tìm thấy chuyến xe",
    });
  }

  // Không cho xóa khi chuyến đang chạy (xe đang trên đường, không thể xóa
  // giữa chừng - dữ liệu chuyến cần giữ lại để đối chiếu)
  if (trip.status === "đang chạy") {
    return res.status(400).json({
      message: "Chuyến xe đang chạy, không thể xoá.",
    });
  }

  // Kiểm tra chuyến có người đặt vé chưa - dùng đúng giá trị status tiếng Việt
  // khớp với booking.controller.js ("Chờ xác nhận"/"Đã xác nhận"), trước đây
  // đang check nhầm "Pending"/"Confirmed" (tiếng Anh) nên không bao giờ khớp
  // được dữ liệu thật, khiến chuyến luôn xóa được dù đã có khách đặt vé
  const booked = await Booking.exists({
    trip: tripId,
    status: {
      $in: ["Chờ xác nhận", "Đã xác nhận"],
    },
  });

  if (booked) {
    return res.status(400).json({
      message:
        "Chuyến xe đã có khách đặt vé, không thể xoá.",
    });
  }

  await Trip.findByIdAndDelete(tripId);

  return res.json({
    message: "Xóa chuyến xe thành công",
  });
});

export const createSchedule = asyncHandler(async (req, res) => {
  const {
    journey,
    bus,
    staff,
    assistantDriver,
    fareRule,
    departureHour,
    arrivalHour,
    weekdays,
    startDate,
    endDate,
    status,
  } = req.body;

  // ==========================
  // Validate giờ
  // ==========================

  const [depH, depM] = departureHour.split(":").map(Number);
  const [arrH, arrM] = arrivalHour.split(":").map(Number);

  const depMinutesOfDay = depH * 60 + depM;
  const arrMinutesOfDay = arrH * 60 + arrM;

  if (arrMinutesOfDay <= depMinutesOfDay) {
    return res.status(400).json({
      message:
        "Giờ đến phải sau giờ khởi hành trong cùng ngày",
    });
  }

  // ==========================
  // Kiểm tra tài xế và phụ xe
  // ==========================

  if (
    staff &&
    assistantDriver &&
    String(staff) === String(assistantDriver)
  ) {
    return res.status(400).json({
      message:
        "Tài xế và phụ xe không được là cùng một người",
    });
  }

  if (assistantDriver) {
    const assistant = await Staff.findById(assistantDriver);

    if (!assistant) {
      return res.status(404).json({
        message: "Không tìm thấy phụ xe",
      });
    }

    if (assistant.chucVu !== "Assistant_Driver") {
      return res.status(400).json({
        message:
          "Nhân viên được chọn không phải là phụ xe",
      });
    }

    if (assistant.trangThai !== "Hoạt động") {
      return res.status(400).json({
        message:
          "Phụ xe hiện không còn làm việc",
      });
    }
  }

  // ==========================
  // Xe
  // ==========================

  const busInfo = await Bus.findById(bus);

  if (!busInfo) {
    return res.status(404).json({
      message: "Không tìm thấy xe",
    });
  }

  const autoSeats = generateSeats(
    busInfo.capacity,
    busInfo.type
  );

  if (!autoSeats.length) {
    return res.status(400).json({
      message: "Không thể sinh ghế",
    });
  }

  // ==========================
  // Tuyến
  // ==========================

  const journeyInfo = await Journey.findById(journey);

  if (!journeyInfo) {
    return res.status(404).json({
      message: "Không tìm thấy tuyến đường",
    });
  }

  // ==========================
  // Bảng giá
  // ==========================

  const fare = await FareRule.findById(fareRule);

  if (!fare) {
    return res.status(404).json({
      message: "Không tìm thấy bảng giá",
    });
  }

  if (fare.capacity !== busInfo.capacity) {
    return res.status(400).json({
      message: `Bảng giá này áp dụng cho xe ${fare.capacity} chỗ, không khớp với xe đang chọn (${busInfo.capacity} chỗ)`,
    });
  }

  // ==========================
  // Chuyến xe hiện có
  // ==========================

  const existingBusTrips = await Trip.find({ bus })
    .populate("journey")
    .sort({ departureTime: 1 });

  const existingStaffTrips = staff
    ? await Trip.find({ staff })
        .populate("journey")
        .sort({ departureTime: 1 })
    : [];

  // LẤY CÁC CHUYẾN CỦA PHỤ XE
  const existingAssistantTrips = assistantDriver
    ? await Trip.find({ assistantDriver })
        .populate("journey")
        .sort({ departureTime: 1 })
    : [];

  const trips = [];
  const duplicateTrips = [];

  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    if (weekdays.includes(current.getDay())) {
      const departureTime = new Date(current);

      departureTime.setHours(
        Number(depH),
        Number(depM),
        0,
        0
      );

      const arrivalTime = new Date(current);

      arrivalTime.setHours(
        Number(arrH),
        Number(arrM),
        0,
        0
      );

      // ==========================
      // Kiểm tra xe
      // ==========================

      const allBusTripsToCheck = [
        ...existingBusTrips,
        ...trips.map((t) => ({
          departureTime: t.departureTime,
          arrivalTime: t.arrivalTime,
          journey: journeyInfo,
        })),
      ];

      let predecessor = null;
      let successor = null;
      let overlapMessage = null;

      for (const ot of allBusTripsToCheck) {
        const oldDeparture = new Date(
          ot.departureTime
        );

        const oldArrival = new Date(
          ot.arrivalTime
        );

        if (
          departureTime < oldArrival &&
          arrivalTime > oldDeparture
        ) {
          overlapMessage =
            `Xe đã có chuyến từ ${oldDeparture.toLocaleString(
              "vi-VN"
            )} đến ${oldArrival.toLocaleString(
              "vi-VN"
            )}`;

          break;
        }

        if (
          oldArrival <= departureTime &&
          (!predecessor ||
            oldArrival >
              new Date(
                predecessor.arrivalTime
              ))
        ) {
          predecessor = ot;
        }

        if (
          oldDeparture >= arrivalTime &&
          (!successor ||
            oldDeparture <
              new Date(
                successor.departureTime
              ))
        ) {
          successor = ot;
        }
      }

      if (overlapMessage) {
        duplicateTrips.push(overlapMessage);

        current.setDate(
          current.getDate() + 1
        );

        continue;
      }

      let busConflict = null;

      if (predecessor) {
        const gapMinutes =
          (departureTime -
            new Date(
              predecessor.arrivalTime
            )) /
          60000;

        if (
          gapMinutes <
          TURN_AROUND_MINUTES
        ) {
          busConflict =
            `Xe chưa nghỉ đủ ${TURN_AROUND_MINUTES} phút: ${departureTime.toLocaleString(
              "vi-VN"
            )}`;
        } else if (
          gapMinutes <=
            LOCATION_CHECK_MAX_GAP_MINUTES &&
          predecessor.journey.diemDen !==
            journeyInfo.diemDi
        ) {
          busConflict =
            `Xe đang ở ${predecessor.journey.diemDen} sau chuyến trước, không thể xuất phát từ ${journeyInfo.diemDi} lúc ${departureTime.toLocaleString(
              "vi-VN"
            )}`;
        }
      }

      if (!busConflict && successor) {
        const gapMinutes =
          (new Date(
            successor.departureTime
          ) -
            arrivalTime) /
          60000;

        if (
          gapMinutes <
          TURN_AROUND_MINUTES
        ) {
          busConflict =
            `Không đủ ${TURN_AROUND_MINUTES} phút chuẩn bị trước chuyến tiếp theo: ${departureTime.toLocaleString(
              "vi-VN"
            )}`;
        } else if (
          gapMinutes <=
            LOCATION_CHECK_MAX_GAP_MINUTES &&
          journeyInfo.diemDen !==
            successor.journey.diemDi
        ) {
          busConflict =
            `Chuyến ${departureTime.toLocaleString(
              "vi-VN"
            )} kết thúc tại ${journeyInfo.diemDen}, nhưng chuyến tiếp theo của xe lại xuất phát từ ${successor.journey.diemDi}`;
        }
      }

      if (busConflict) {
        duplicateTrips.push(busConflict);

        current.setDate(
          current.getDate() + 1
        );

        continue;
      }

      // ==========================
      // Kiểm tra tài xế
      // ==========================

      if (staff) {
        const allStaffTripsToCheck = [
          ...existingStaffTrips,
          ...trips.map((t) => ({
            departureTime: t.departureTime,
            arrivalTime: t.arrivalTime,
            journey: journeyInfo,
          })),
        ];

        let staffConflict = null;

        for (const ot of allStaffTripsToCheck) {
          const oldDeparture = new Date(
            ot.departureTime
          );

          const oldArrival = new Date(
            ot.arrivalTime
          );

          if (
            departureTime < oldArrival &&
            arrivalTime > oldDeparture
          ) {
            staffConflict =
              `Tài xế đã có lịch: ${departureTime.toLocaleString(
                "vi-VN"
              )}`;

            break;
          }
        }

        if (staffConflict) {
          duplicateTrips.push(staffConflict);

          current.setDate(
            current.getDate() + 1
          );

          continue;
        }

        const staffError =
          await checkStaffAvailability(
            staff,
            journeyInfo,
            departureTime,
            arrivalTime,
            null
          );

        if (staffError) {
          duplicateTrips.push(
            `Tài xế: ${staffError}`
          );

          current.setDate(
            current.getDate() + 1
          );

          continue;
        }
      }

      // ==========================
      // Kiểm tra phụ xe
      // ==========================

      if (assistantDriver) {
        const allAssistantTripsToCheck = [
          ...existingAssistantTrips,
          ...trips.map((t) => ({
            departureTime: t.departureTime,
            arrivalTime: t.arrivalTime,
            journey: journeyInfo,
          })),
        ];

        let assistantConflict = null;

        for (
          const ot of allAssistantTripsToCheck
        ) {
          const oldDeparture =
            new Date(
              ot.departureTime
            );

          const oldArrival =
            new Date(
              ot.arrivalTime
            );

          // Trùng giờ
          if (
            departureTime < oldArrival &&
            arrivalTime > oldDeparture
          ) {
            assistantConflict =
              `Phụ xe đã có lịch: ${departureTime.toLocaleString(
                "vi-VN"
              )}`;

            break;
          }
        }

        if (assistantConflict) {
          duplicateTrips.push(
            assistantConflict
          );

          current.setDate(
            current.getDate() + 1
          );

          continue;
        }

        // Kiểm tra nghỉ tối thiểu + vị trí
        const assistantError =
          await checkStaffAvailability(
            assistantDriver,
            journeyInfo,
            departureTime,
            arrivalTime,
            null
          );

        if (assistantError) {
          duplicateTrips.push(
            `Phụ xe: ${assistantError}`
          );

          current.setDate(
            current.getDate() + 1
          );

          continue;
        }
      }

      // ==========================
      // Tính giá
      // ==========================

      const ticketPrice =
        await calculateTicketPrice(
          fare,
          departureTime
        );

      // ==========================
      // Thêm chuyến
      // ==========================

      trips.push({
        journey,
        bus,
        staff,
        assistantDriver:
          assistantDriver || null,
        fareRule,
        ticketPrice,
        departureTime,
        arrivalTime,
        status: status || "sắp chạy",
        seats: JSON.parse(
          JSON.stringify(autoSeats)
        ),
      });
    }

    current.setDate(
      current.getDate() + 1
    );
  }

  // ==========================
  // Có chuyến bị trùng
  // ==========================

  if (duplicateTrips.length > 0) {
    return res.status(400).json({
      message: duplicateTrips.join(" | "),
    });
  }

  if (trips.length === 0) {
    return res.status(400).json({
      message: "Không có chuyến nào được tạo",
    });
  }

  // ==========================
  // Lưu DB
  // ==========================

  const result =
    await Trip.insertMany(trips);

  return res.status(201).json({
    message: `Đã tạo ${result.length} chuyến`,
    data: result,
  });
});

export const getTripsByStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const trips = await Trip.find({
    $or: [
      { staff: staffId },
      { assistantDriver: staffId },
    ],
  })
    .populate("journey")
    .populate("bus")
    .populate("fareRule")
    .populate("staff")
    .populate("assistantDriver");

  return res.json({
    success: true,
    data: trips,
  });
});
// Tài xế xác nhận chạy chuyến
// Tài xế / phụ xe xác nhận chạy chuyến
export const confirmTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { staffId } = req.body;

  if (!staffId) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin staffId",
    });
  }

  const trip = await Trip.findById(tripId);

  if (!trip) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy chuyến xe",
    });
  }

  // Kiểm tra nhân viên có phải tài xế hoặc phụ xe của chuyến không
  const isDriver =
    trip.staff &&
    trip.staff.toString() === staffId;

  const isAssistantDriver =
    trip.assistantDriver &&
    trip.assistantDriver.toString() === staffId;

  if (!isDriver && !isAssistantDriver) {
    return res.status(403).json({
      success: false,
      message:
        "Bạn không được phân công cho chuyến xe này",
    });
  }

  // Không cho xác nhận chuyến đã hoàn thành / huỷ
  if (
    trip.status === "hoàn thành" ||
    trip.status === "huỷ"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Chuyến xe đã hoàn thành hoặc bị huỷ, không thể xác nhận",
    });
  }

  // Không cho xác nhận sau giờ khởi hành
  const now = new Date();
  const departureTime =
    new Date(trip.departureTime);

  if (now >= departureTime) {
    return res.status(400).json({
      success: false,
      message:
        "Đã đến giờ khởi hành, không thể xác nhận chạy chuyến nữa!",
    });
  }

  // ==========================
  // TÀI XẾ XÁC NHẬN
  // ==========================

  if (isDriver) {
    if (trip.driverConfirmed) {
      return res.status(400).json({
        success: false,
        message:
          "Bạn đã xác nhận chạy chuyến này rồi",
      });
    }

    trip.driverConfirmed = true;
    trip.driverConfirmedAt = new Date();
  }

  // ==========================
  // PHỤ XE XÁC NHẬN
  // ==========================

  if (isAssistantDriver) {
    if (trip.assistantDriverConfirmed) {
      return res.status(400).json({
        success: false,
        message:
          "Bạn đã xác nhận chuyến này rồi",
      });
    }

    trip.assistantDriverConfirmed = true;
    trip.assistantDriverConfirmedAt = new Date();
  }

  await trip.save();

  return res.json({
    success: true,
    message: isDriver
      ? "Tài xế xác nhận chạy chuyến thành công!"
      : "Phụ xe xác nhận chạy chuyến thành công!",
    data: trip,
  });
});