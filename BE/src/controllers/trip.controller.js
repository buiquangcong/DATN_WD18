import asyncHandler from "../utils/asyncHandler.js";
import Trip from "../models/trip.model.js";
import Bus from "../models/bus.model.js";
import generateSeats from "../utils/seatGenerator.js";
import Staff from "../models/staff.model.js";
import FareRule from "../models/giave.model.js";
import Booking from "../models/booking.model.js";
import Holiday from "../models/holiday.model.js";
import Journey from "../models/journey.model.js";

const isHoliday = async (date) => {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const holiday = await Holiday.findOne({
    day,
    month,
    status: true,
  });

  return !!holiday;
};

const TURN_AROUND_MINUTES = 30;

// Chỉ bắt buộc khớp vị trí bến nếu 2 chuyến cách nhau trong khoảng thời gian này
// (coi như cùng 1 ca vận hành liên tục của xe). Cách xa hơn (VD: sang ngày khác)
// thì bỏ qua yêu cầu khớp vị trí, vì xe có thể đã được điều chuyển bằng cách khác
// ngoài hệ thống (chạy rỗng, đổi tài xế, v.v.)
const LOCATION_CHECK_MAX_GAP_MINUTES = 12 * 60; // 12 tiếng

// Kiểm tra xe có khả dụng không: check trùng giờ, thời gian nghỉ tối thiểu,
// và vị trí bến (chỉ bắt buộc khớp nếu 2 chuyến cách nhau đủ gần)
const checkBusAvailability = async (
  busId,
  newJourney,
  newDeparture,
  newArrival,
  excludeTripId
) => {
  const query = { bus: busId };
  if (excludeTripId) {
    query._id = { $ne: excludeTripId };
  }

  const busTrips = await Trip.find(query)
    .populate("journey")
    .sort({ departureTime: 1 });

  let predecessor = null;
  let successor = null;

  for (const ot of busTrips) {
    const oldDeparture = new Date(ot.departureTime);
    const oldArrival = new Date(ot.arrivalTime);

    if (newDeparture < oldArrival && newArrival > oldDeparture) {
      return `Xe đã có chuyến từ ${oldDeparture.toLocaleString(
        "vi-VN"
      )} đến ${oldArrival.toLocaleString("vi-VN")}`;
    }

    if (
      oldArrival <= newDeparture &&
      (!predecessor || oldArrival > new Date(predecessor.arrivalTime))
    ) {
      predecessor = ot;
    }

    if (
      oldDeparture >= newArrival &&
      (!successor || oldDeparture < new Date(successor.departureTime))
    ) {
      successor = ot;
    }
  }

  if (predecessor) {
    const gapMinutes =
      (newDeparture - new Date(predecessor.arrivalTime)) / 60000;

    if (gapMinutes < TURN_AROUND_MINUTES) {
      return `Xe cần nghỉ tối thiểu ${TURN_AROUND_MINUTES} phút sau chuyến trước.`;
    }

    if (
      gapMinutes <= LOCATION_CHECK_MAX_GAP_MINUTES &&
      predecessor.journey.diemDen !== newJourney.diemDi
    ) {
      return `Xe đang ở ${predecessor.journey.diemDen} sau chuyến trước, không thể xuất phát từ ${newJourney.diemDi}.`;
    }
  }

  if (successor) {
    const gapMinutes =
      (new Date(successor.departureTime) - newArrival) / 60000;

    if (gapMinutes < TURN_AROUND_MINUTES) {
      return `Không đủ ${TURN_AROUND_MINUTES} phút chuẩn bị trước chuyến tiếp theo của xe.`;
    }

    if (
      gapMinutes <= LOCATION_CHECK_MAX_GAP_MINUTES &&
      newJourney.diemDen !== successor.journey.diemDi
    ) {
      return `Chuyến này kết thúc tại ${newJourney.diemDen}, nhưng chuyến tiếp theo của xe lại xuất phát từ ${successor.journey.diemDi}.`;
    }
  }

  return null;
};

// Kiểm tra tài xế có khả dụng không: check trùng giờ, thời gian nghỉ tối thiểu,
// và vị trí (tài xế phải đang ở đúng bến để lái chuyến tiếp theo)
const checkStaffAvailability = async (
  staffId,
  newJourney,
  newDeparture,
  newArrival,
  excludeTripId
) => {
  const query = { staff: staffId };
  if (excludeTripId) {
    query._id = { $ne: excludeTripId };
  }

  const staffTrips = await Trip.find(query)
    .populate("journey")
    .sort({ departureTime: 1 });

  let predecessor = null;
  let successor = null;

  for (const ot of staffTrips) {
    const oldDeparture = new Date(ot.departureTime);
    const oldArrival = new Date(ot.arrivalTime);

    if (newDeparture < oldArrival && newArrival > oldDeparture) {
      return `Tài xế đã có chuyến từ ${oldDeparture.toLocaleString(
        "vi-VN"
      )} đến ${oldArrival.toLocaleString("vi-VN")}`;
    }

    if (
      oldArrival <= newDeparture &&
      (!predecessor || oldArrival > new Date(predecessor.arrivalTime))
    ) {
      predecessor = ot;
    }

    if (
      oldDeparture >= newArrival &&
      (!successor || oldDeparture < new Date(successor.departureTime))
    ) {
      successor = ot;
    }
  }

  if (predecessor) {
    const gapMinutes =
      (newDeparture - new Date(predecessor.arrivalTime)) / 60000;

    if (gapMinutes < TURN_AROUND_MINUTES) {
      return `Tài xế cần nghỉ tối thiểu ${TURN_AROUND_MINUTES} phút sau chuyến trước.`;
    }

    if (
      gapMinutes <= LOCATION_CHECK_MAX_GAP_MINUTES &&
      predecessor.journey.diemDen !== newJourney.diemDi
    ) {
      return `Tài xế đang ở ${predecessor.journey.diemDen} sau chuyến trước, không thể xuất phát từ ${newJourney.diemDi}.`;
    }
  }

  if (successor) {
    const gapMinutes =
      (new Date(successor.departureTime) - newArrival) / 60000;

    if (gapMinutes < TURN_AROUND_MINUTES) {
      return `Không đủ ${TURN_AROUND_MINUTES} phút nghỉ trước chuyến tiếp theo của tài xế.`;
    }

    if (
      gapMinutes <= LOCATION_CHECK_MAX_GAP_MINUTES &&
      newJourney.diemDen !== successor.journey.diemDi
    ) {
      return `Chuyến này kết thúc tại ${newJourney.diemDen}, nhưng chuyến tiếp theo của tài xế lại xuất phát từ ${successor.journey.diemDi}.`;
    }
  }

  return null;
};

export const getAll = asyncHandler(async (req, res) => {
  const trips = await Trip.find()
    .populate("journey")
    .populate("bus")
    .populate("staff")
    .populate("fareRule");

  return res.json(trips);
});

export const getOne = asyncHandler(async (req, res) => {
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

export const getAvailableDrivers = asyncHandler(async (req, res) => {
  const {
    weekdays,
    startDate,
    endDate,
    departureHour,
    arrivalHour,
    excludeTripId,
  } = req.query;

  if (
    !weekdays ||
    !startDate ||
    !endDate ||
    !departureHour ||
    !arrivalHour
  ) {
    return res.status(400).json({
      message:
        "Thiếu thông tin để kiểm tra tài xế rảnh (ngày chạy, khoảng ngày, giờ)",
    });
  }

  const weekdaysArr = String(weekdays)
    .split(",")
    .map((n) => Number(n))
    .filter((n) => !Number.isNaN(n));

  const [depHour, depMinute] = departureHour.split(":");
  const [arrHour, arrMinute] = arrivalHour.split(":");

  // Sinh danh sách các khung giờ (departure/arrival) tương ứng với từng ngày chạy trong khoảng
  const slots = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    if (weekdaysArr.includes(current.getDay())) {
      const dep = new Date(current);
      dep.setHours(Number(depHour), Number(depMinute), 0, 0);

      const arr = new Date(current);
      arr.setHours(Number(arrHour), Number(arrMinute), 0, 0);

      slots.push({ dep, arr });
    }

    current.setDate(current.getDate() + 1);
  }

  const allDrivers = await Staff.find({
    chucVu: "Driver",
  });

  const availableDrivers = [];

  for (const driver of allDrivers) {
    let busy = false;

    for (const slot of slots) {
      const query = {
        staff: driver._id,
        departureTime: { $lt: slot.arr },
        arrivalTime: { $gt: slot.dep },
      };

      if (excludeTripId) {
        query._id = { $ne: excludeTripId };
      }

      const conflict = await Trip.findOne(query);

      if (conflict) {
        busy = true;
        break;
      }
    }

    if (!busy) {
      availableDrivers.push(driver);
    }
  }

  return res.json(availableDrivers);
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

  // ===========================
  // Kiểm tra xe (thời gian + vị trí bến)
  // ===========================

  const newDeparture = new Date(departureTime);
  const newArrival = new Date(arrivalTime);

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

  // ===========================
  // Tính giá theo ngày
  // ===========================

  const day = newDeparture.getDay();

  let ticketPrice = fare.weekdayPrice;

  if (day === 0 || day === 6) {
    ticketPrice = fare.weekendPrice;
  }

  const holidayToday = await isHoliday(newDeparture);

  if (holidayToday) {
    ticketPrice = fare.holidayPrice;
  }

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
  const newDeparture = new Date(departureTime || oldTrip.departureTime);
  const newArrival = new Date(arrivalTime || oldTrip.arrivalTime);

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

  const day = newDeparture.getDay();

  let ticketPrice = fare.weekdayPrice;

  if (day === 0 || day === 6) {
    ticketPrice = fare.weekendPrice;
  }

  const holidayToday = await isHoliday(newDeparture);

  if (holidayToday) {
    ticketPrice = fare.holidayPrice;
  }

  req.body.ticketPrice = ticketPrice;

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

  // Kiểm tra chuyến có người đặt vé chưa
  const booked = await Booking.exists({
    trip: tripId,
    status: {
      $in: ["Pending", "Confirmed"],
    },
  });

  if (booked) {
    return res.status(400).json({
      message:
        "Chuyến xe đã có khách đặt vé, không thể xoá.",
    });
  }

  const trip = await Trip.findByIdAndDelete(tripId);

  if (!trip) {
    return res.status(404).json({
      message: "Không tìm thấy chuyến xe",
    });
  }

  return res.json({
    message: "Xóa chuyến xe thành công",
  });
});

export const createSchedule = asyncHandler(async (req, res) => {
  const {journey,bus,staff,fareRule,departureHour,arrivalHour,weekdays,startDate,endDate,status,} = req.body;

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

      const day = departureTime.getDay();

      let ticketPrice = fare.weekdayPrice;

      if (day === 0 || day === 6) {
        ticketPrice = fare.weekendPrice;
      }

      const holidayToday = await isHoliday(departureTime);

      if (holidayToday) {
        ticketPrice = fare.holidayPrice;
      }

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