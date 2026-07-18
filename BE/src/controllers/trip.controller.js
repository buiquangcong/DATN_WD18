import asyncHandler from "../utils/asyncHandler.js";
import Trip from "../models/trip.model.js";
import Bus from "../models/bus.model.js";
import generateSeats from "../utils/seatGenerator.js";
import Staff from "../models/staff.model.js";
import FareRule from "../models/giave.model.js";
import Booking from "../models/booking.model.js";
import Holiday from "../models/holiday.model.js";

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

  // ===========================
  // Kiểm tra tài xế
  // ===========================
  const existedDriver = await Trip.findOne({
    staff,
    departureTime: {
      $lt: new Date(arrivalTime),
    },
    arrivalTime: {
      $gt: new Date(departureTime),
    },
  });

  if (existedDriver) {
    return res.status(400).json({
      message:
        "Tài xế đã có chuyến khác trong khoảng thời gian này",
    });
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
  const day = new Date(departureTime).getDay();

  let ticketPrice = fare.weekdayPrice;

  if (day === 0 || day === 6) {
    ticketPrice = fare.weekendPrice;
  }

  const holidayToday = await isHoliday(departureTime);

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

  // ==========================
  // Kiểm tra tài xế trùng lịch
  // ==========================

  const existedDriver = await Trip.findOne({
    _id: { $ne: req.params.id },
    staff: staff || oldTrip.staff,
    departureTime: {
      $lt: new Date(arrivalTime || oldTrip.arrivalTime),
    },
    arrivalTime: {
      $gt: new Date(departureTime || oldTrip.departureTime),
    },
  });

  if (existedDriver) {
    return res.status(400).json({
      message: "Tài xế đã có chuyến khác trong khoảng thời gian này",
    });
  }

  // ==========================
  // Tính lại giá vé
  // ==========================

  const fareId = fareRule || oldTrip.fareRule;
  const depTime = departureTime || oldTrip.departureTime;

  const fare = await FareRule.findById(fareId);

  if (!fare) {
    return res.status(404).json({
      message: "Không tìm thấy bảng giá",
    });
  }

  const day = new Date(depTime).getDay();

  let ticketPrice = fare.weekdayPrice;

  if (day === 0 || day === 6) {
    ticketPrice = fare.weekendPrice;
  }

  const holidayToday = await isHoliday(depTime);

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

  // Lấy bảng giá
  const fare = await FareRule.findById(fareRule);

  if (!fare) {
    return res.status(404).json({
      message: "Không tìm thấy bảng giá",
    });
  }

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
      // Kiểm tra xe
      // ==========================

      const existedBus = await Trip.findOne({
        bus,
        departureTime: {
          $lt: arrivalTime,
        },
        arrivalTime: {
          $gt: departureTime,
        },
      });

      if (existedBus) {
        duplicateTrips.push(
          `Xe đã có lịch: ${departureTime.toLocaleString("vi-VN")}`
        );

        current.setDate(current.getDate() + 1);

        continue;
      }

      // ==========================
      // Kiểm tra tài xế
      // ==========================

      const existedDriver = await Trip.findOne({
        staff,
        departureTime: {
          $lt: arrivalTime,
        },
        arrivalTime: {
          $gt: departureTime,
        },
      });

      if (existedDriver) {
        duplicateTrips.push(
          `Tài xế đã có lịch: ${departureTime.toLocaleString("vi-VN")}`
        );

        current.setDate(current.getDate() + 1);

        continue;
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