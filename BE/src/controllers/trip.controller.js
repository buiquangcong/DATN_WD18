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
  // ==============================
  await Trip.updateMany(
    {
      departureTime: { $lte: now },
      arrivalTime: { $gt: now },
      status: "sắp chạy",
    },
    {
      $set: {
        status: "đang chạy",
      },
    }
  );

  // ==============================
  // Đang chạy -> Hoàn thành
  // ==============================
  await Trip.updateMany(
    {
      arrivalTime: { $lte: now },
      status: "đang chạy",
    },
    {
      $set: {
        status: "hoàn thành",
      },
    }
  );
};
export const getAll = asyncHandler(async (req, res) => {
  await updateTripStatus();
  const trips = await Trip.find()
    .populate("journey")
    .populate("bus")
    .populate("staff")
    .populate("fareRule");

  return res.json(trips);
});

export const getOne = asyncHandler(async (req, res) => {
  await updateTripStatus();
  const trip = await Trip.findById(req.params.id)
    .populate("journey")
    .populate("bus")
    .populate("staff")
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
  });

  res.json(drivers);
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
  // Kiểm tra xe (thời gian + vị trí bến)
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
  // Kiểm tra tài xế (trùng giờ + nghỉ tối thiểu + vị trí) - chỉ khi có gán tài xế
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
  // Lấy bảng giá
  // ===========================

  const fare = await FareRule.findById(fareRule);

  if (!fare) {
    return res.status(404).json({
      message: "Không tìm thấy bảng giá",
    });
  }

  // Chặn trường hợp bảng giá không khớp số chỗ với xe đang chọn (VD bảng giá
  // của xe 16 chỗ nhưng lại áp cho xe 34 chỗ) - tránh tính sai giá vé
  if (fare.capacity !== busInfo.capacity) {
    return res.status(400).json({
      message: `Bảng giá này áp dụng cho xe ${fare.capacity} chỗ, không khớp với xe đang chọn (${busInfo.capacity} chỗ)`,
    });
  }

  // ===========================
  // Tính giá theo ngày
  // ===========================

  const ticketPrice = await calculateTicketPrice(fare, newDeparture);

  const trip = await Trip.create({
    journey,
    bus,
    staff,
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

  const newDeparture = new Date(departureTime || oldTrip.departureTime);
  const newArrival = new Date(arrivalTime || oldTrip.arrivalTime);

  if (newArrival <= newDeparture) {
    return res.status(400).json({
      message: "Thời gian đến phải sau thời gian khởi hành",
    });
  }

  // ==========================
  // Kiểm tra xe (thời gian + vị trí bến)
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
  // Kiểm tra tài xế (trùng giờ + nghỉ tối thiểu + vị trí) - chỉ khi có gán tài xế
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
  // Tính lại giá vé
  // ==========================

  const fareId = fareRule || oldTrip.fareRule;

  const fare = await FareRule.findById(fareId);

  if (!fare) {
    return res.status(404).json({
      message: "Không tìm thấy bảng giá",
    });
  }

  // Chặn trường hợp bảng giá không khớp số chỗ với xe đang chọn (VD bảng giá
  // của xe 16 chỗ nhưng lại áp cho xe 34 chỗ) - tránh tính sai giá vé
  if (fare.capacity !== busInfo.capacity) {
    return res.status(400).json({
      message: `Bảng giá này áp dụng cho xe ${fare.capacity} chỗ, không khớp với xe đang chọn (${busInfo.capacity} chỗ)`,
    });
  }

  req.body.ticketPrice = await calculateTicketPrice(fare, newDeparture);

  // ==========================
  // Cập nhật chuyến
  // ==========================

  const trip = await Trip.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    }
  );

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
  const {journey,bus,staff,fareRule,departureHour,arrivalHour,weekdays,startDate,endDate,status,} = req.body;

  // Validate giờ đến phải sau giờ khởi hành trong cùng ngày
  // (chưa hỗ trợ lịch chạy xuyên đêm qua ngày hôm sau)
  const [depH, depM] = departureHour.split(":").map(Number);
  const [arrH, arrM] = arrivalHour.split(":").map(Number);
  const depMinutesOfDay = depH * 60 + depM;
  const arrMinutesOfDay = arrH * 60 + arrM;

  if (arrMinutesOfDay <= depMinutesOfDay) {
    return res.status(400).json({
      message: "Giờ đến phải sau giờ khởi hành trong cùng ngày",
    });
  }

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

  const journeyInfo = await Journey.findById(journey);

  if (!journeyInfo) {
    return res.status(404).json({
      message: "Không tìm thấy tuyến đường",
    });
  }

  // Lấy bảng giá
  const fare = await FareRule.findById(fareRule);

  if (!fare) {
    return res.status(404).json({
      message: "Không tìm thấy bảng giá",
    });
  }

  // Chặn trường hợp bảng giá không khớp số chỗ với xe đang chọn (VD bảng giá
  // của xe 16 chỗ nhưng lại áp cho xe 34 chỗ) - tránh tính sai giá vé
  if (fare.capacity !== busInfo.capacity) {
    return res.status(400).json({
      message: `Bảng giá này áp dụng cho xe ${fare.capacity} chỗ, không khớp với xe đang chọn (${busInfo.capacity} chỗ)`,
    });
  }

  // Lấy sẵn các chuyến hiện có của xe này trong DB (kèm journey để lấy diemDi/diemDen)
  const existingBusTrips = await Trip.find({ bus })
    .populate("journey")
    .sort({ departureTime: 1 });

  // Lấy sẵn các chuyến hiện có của tài xế này trong DB (nếu có gán tài xế)
  const existingStaffTrips = staff
    ? await Trip.find({ staff })
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

      const [depHour, depMinute] =
        departureHour.split(":");

      departureTime.setHours(
        Number(depHour),
        Number(depMinute),
        0,
        0
      );

      const arrivalTime = new Date(current);

      const [arrHour, arrMinute] =
        arrivalHour.split(":");

      arrivalTime.setHours(
        Number(arrHour),
        Number(arrMinute),
        0,
        0
      );

      // ==========================
      // Kiểm tra xe (thời gian + vị trí bến)
      // ==========================

      // Ghép chuyến đã có trong DB + chuyến vừa sinh trong vòng lặp này
      const allBusTripsToCheck = [
        ...existingBusTrips,
        ...trips.map((t) => ({
          departureTime: t.departureTime,
          arrivalTime: t.arrivalTime,
          journey: journeyInfo, // các chuyến trong lịch này đều dùng chung 1 journey
        })),
      ];

      let predecessor = null;
      let successor = null;
      let overlapMessage = null;

      for (const ot of allBusTripsToCheck) {
        const oldDeparture = new Date(ot.departureTime);
        const oldArrival = new Date(ot.arrivalTime);

        if (
          departureTime < oldArrival &&
          arrivalTime > oldDeparture
        ) {
          overlapMessage = `Xe đã có chuyến từ ${oldDeparture.toLocaleString(
            "vi-VN"
          )} đến ${oldArrival.toLocaleString("vi-VN")}`;
          break;
        }

        if (
          oldArrival <= departureTime &&
          (!predecessor || oldArrival > new Date(predecessor.arrivalTime))
        ) {
          predecessor = ot;
        }

        if (
          oldDeparture >= arrivalTime &&
          (!successor || oldDeparture < new Date(successor.departureTime))
        ) {
          successor = ot;
        }
      }

      if (overlapMessage) {
        duplicateTrips.push(overlapMessage);
        current.setDate(current.getDate() + 1);
        continue;
      }

      let busConflict = null;

      if (predecessor) {
        const gapMinutes =
          (departureTime - new Date(predecessor.arrivalTime)) / 60000;

        if (gapMinutes < TURN_AROUND_MINUTES) {
          busConflict = `Xe chưa nghỉ đủ ${TURN_AROUND_MINUTES} phút: ${departureTime.toLocaleString("vi-VN")}`;
        } else if (
          gapMinutes <= LOCATION_CHECK_MAX_GAP_MINUTES &&
          predecessor.journey.diemDen !== journeyInfo.diemDi
        ) {
          busConflict = `Xe đang ở ${predecessor.journey.diemDen} sau chuyến trước, không thể xuất phát từ ${journeyInfo.diemDi} lúc ${departureTime.toLocaleString("vi-VN")}`;
        }
      }

      if (!busConflict && successor) {
        const gapMinutes =
          (new Date(successor.departureTime) - arrivalTime) / 60000;

        if (gapMinutes < TURN_AROUND_MINUTES) {
          busConflict = `Không đủ ${TURN_AROUND_MINUTES} phút chuẩn bị trước chuyến tiếp theo: ${departureTime.toLocaleString("vi-VN")}`;
        } else if (
          gapMinutes <= LOCATION_CHECK_MAX_GAP_MINUTES &&
          journeyInfo.diemDen !== successor.journey.diemDi
        ) {
          busConflict = `Chuyến ${departureTime.toLocaleString("vi-VN")} kết thúc tại ${journeyInfo.diemDen}, nhưng chuyến tiếp theo của xe lại xuất phát từ ${successor.journey.diemDi}`;
        }
      }

      if (busConflict) {
        duplicateTrips.push(busConflict);
        current.setDate(current.getDate() + 1);
        continue;
      }

      // ==========================
      // Kiểm tra tài xế (chỉ khi có gán tài xế cho lịch này)
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

        let staffPredecessor = null;
        let staffSuccessor = null;
        let staffOverlapMessage = null;

        for (const ot of allStaffTripsToCheck) {
          const oldDeparture = new Date(ot.departureTime);
          const oldArrival = new Date(ot.arrivalTime);

          if (
            departureTime < oldArrival &&
            arrivalTime > oldDeparture
          ) {
            staffOverlapMessage = `Tài xế đã có lịch: ${departureTime.toLocaleString("vi-VN")}`;
            break;
          }

          if (
            oldArrival <= departureTime &&
            (!staffPredecessor || oldArrival > new Date(staffPredecessor.arrivalTime))
          ) {
            staffPredecessor = ot;
          }

          if (
            oldDeparture >= arrivalTime &&
            (!staffSuccessor || oldDeparture < new Date(staffSuccessor.departureTime))
          ) {
            staffSuccessor = ot;
          }
        }

        if (staffOverlapMessage) {
          duplicateTrips.push(staffOverlapMessage);
          current.setDate(current.getDate() + 1);
          continue;
        }

        let staffConflict = null;

        if (staffPredecessor) {
          const gapMinutes =
            (departureTime - new Date(staffPredecessor.arrivalTime)) / 60000;

          if (gapMinutes < TURN_AROUND_MINUTES) {
            staffConflict = `Tài xế chưa nghỉ đủ ${TURN_AROUND_MINUTES} phút: ${departureTime.toLocaleString("vi-VN")}`;
          } else if (
            gapMinutes <= LOCATION_CHECK_MAX_GAP_MINUTES &&
            staffPredecessor.journey.diemDen !== journeyInfo.diemDi
          ) {
            staffConflict = `Tài xế đang ở ${staffPredecessor.journey.diemDen} sau chuyến trước, không thể xuất phát từ ${journeyInfo.diemDi} lúc ${departureTime.toLocaleString("vi-VN")}`;
          }
        }

        if (!staffConflict && staffSuccessor) {
          const gapMinutes =
            (new Date(staffSuccessor.departureTime) - arrivalTime) / 60000;

          if (gapMinutes < TURN_AROUND_MINUTES) {
            staffConflict = `Không đủ ${TURN_AROUND_MINUTES} phút nghỉ trước chuyến tiếp theo của tài xế: ${departureTime.toLocaleString("vi-VN")}`;
          } else if (
            gapMinutes <= LOCATION_CHECK_MAX_GAP_MINUTES &&
            journeyInfo.diemDen !== staffSuccessor.journey.diemDi
          ) {
            staffConflict = `Chuyến ${departureTime.toLocaleString("vi-VN")} kết thúc tại ${journeyInfo.diemDen}, nhưng chuyến tiếp theo của tài xế lại xuất phát từ ${staffSuccessor.journey.diemDi}`;
          }
        }

        if (staffConflict) {
          duplicateTrips.push(staffConflict);
          current.setDate(current.getDate() + 1);
          continue;
        }
      }

      // ==========================
      // Tính giá theo ngày chạy
      // ==========================

      const ticketPrice = await calculateTicketPrice(fare, departureTime);

      // ==========================
      // Thêm chuyến
      // ==========================

      trips.push({
        journey,
        bus,
        staff,
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

  const result = await Trip.insertMany(trips);

  return res.status(201).json({
    message: `Đã tạo ${result.length} chuyến`,
    data: result,
  });
});

export const getTripsByStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const trips = await Trip.find({
    staff: staffId,
  })
    .populate("journey")
    .populate("bus")
    .populate("fareRule")
    .populate("staff");

  return res.json({
    success: true,
    data: trips,
  });
});
// Tài xế xác nhận chạy chuyến
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

  // Kiểm tra chuyến thuộc tài xế này
  if (trip.staff.toString() !== staffId) {
    return res.status(403).json({
      success: false,
      message: "Chuyến xe này không được phân công cho bạn",
    });
  }

  // Kiểm tra đã xác nhận chưa
  if (trip.driverConfirmed) {
    return res.status(400).json({
      success: false,
      message: "Bạn đã xác nhận chạy chuyến này rồi",
    });
  }

  // Kiểm tra chuyến chưa hoàn thành/huỷ
  if (trip.status === "hoàn thành" || trip.status === "huỷ") {
    return res.status(400).json({
      success: false,
      message: "Chuyến xe đã hoàn thành hoặc bị huỷ, không thể xác nhận",
    });
  }

// Kiểm tra đã đến giờ khởi hành chưa - nếu đã đến giờ thì không cho xác nhận
  const now = new Date();
  const departureTime = new Date(trip.departureTime);
  if (now >= departureTime) {
    return res.status(400).json({
      success: false,
      message: "Đã đến giờ khởi hành, không thể xác nhận chạy chuyến nữa!",
    });
  }

  trip.driverConfirmed = true;
  trip.driverConfirmedAt = new Date();
  await trip.save();

  return res.json({
    success: true,
    message: "Xác nhận chạy chuyến thành công!",
    data: trip,
  });
});