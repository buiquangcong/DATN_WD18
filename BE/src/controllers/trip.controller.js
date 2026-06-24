import asyncHandler from "../utils/asyncHandler.js";
import Trip from "../models/trip.model.js";
import Bus from "../models/bus.model.js"; 
import generateSeats from "../utils/seatGenerator.js"; 


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
            message: "Không tìm thấy chuyến xe"
        });
    }

    return res.json(trip);
});


export const createOne = asyncHandler(async (req, res) => {

    const { journey, bus,staff, departureTime, arrivalTime, fareRule } = req.body; 

  
    const busInfo = await Bus.findById(bus);
    if (!busInfo) {
        return res.status(422).json({
            success: false,
            message: "Không tìm thấy thông tin xe khách tương ứng để tự động sinh ghế."
        });
    }


    const autoSeats = generateSeats(busInfo.capacity, busInfo.type);
    if (autoSeats.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Cấu hình số chỗ hoặc loại xe không hợp lệ, không thể sinh sơ đồ ghế."
        });
    }

    const trip = await Trip.create({
        journey,
        bus,
        staff,
        fareRule,
        departureTime,
        arrivalTime,
        seats: autoSeats 
    });

    return res.status(201).json({
        message: "Thêm chuyến xe và tự động kích hoạt sơ đồ ghế thành công!",
        data: trip
    });
});

export const updateOne = asyncHandler(async (req, res) => {
    const trip = await Trip.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    if (!trip) {
        return res.status(404).json({
            message: "Không tìm thấy chuyến xe"
        });
    }

    return res.json({
        message: "Cập nhật chuyến xe thành công",
        data: trip
    });
});


export const deleteOne = asyncHandler(async (req, res) => {
    const trip = await Trip.findByIdAndDelete(req.params.id);

    if (!trip) {
        return res.status(404).json({
            message: "Không tìm thấy chuyến xe"
        });
    }

    return res.json({
        message: "Xóa chuyến xe thành công"
    });
});

export const createSchedule = asyncHandler(async (req, res) => {
   console.log(req.body);
 const {
    journey,
    bus,
    staff,
    fareRule,
    departureHour,
    arrivalHour,
    weekdays,
    startDate,
    endDate,
    status,
} = req.body;

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
console.log(autoSeats);
  if (!autoSeats.length) {
    return res.status(400).json({
      message: "Không thể sinh ghế",
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

      // kiểm tra trùng xe cùng khoảng thời gian
      const existedTrip = await Trip.findOne({
        bus,
        departureTime: {
          $lt: arrivalTime,
        },
        arrivalTime: {
          $gt: departureTime,
        },
      });

      if (existedTrip) {
        duplicateTrips.push(
          departureTime.toLocaleString("vi-VN")
        );
      } else {
       trips.push({
    journey,
    bus,
    staff,
    fareRule,
    departureTime,
    arrivalTime,
    status: status || "sắp chạy",
    seats: JSON.parse(
        JSON.stringify(autoSeats)
    ),
});
      }
    }

    current.setDate(
      current.getDate() + 1
    );
  }

  if (duplicateTrips.length > 0) {
    return res.status(400).json({
      message:
        "Xe đã có lịch chạy tại: " +
        duplicateTrips.join(", "),
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