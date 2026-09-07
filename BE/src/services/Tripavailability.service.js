import Trip from "../models/trip.model.js";
import Attendance from "../models/attendance.model.js";
import Journey from "../models/journey.model.js";

// ======================================================
// CẤU HÌNH
// ======================================================

// Sau khi check-out phải chờ tối thiểu 10 phút
export const CHECKOUT_GAP_MINUTES = 10;

// Khoảng cách <= 12 tiếng thì kiểm tra vị trí
export const LOCATION_CHECK_MAX_GAP_MINUTES = 12 * 60;


// ======================================================
// HÀM LẤY ĐIỂM XUẤT PHÁT VÀ KẾT THÚC CỦA TUYẾN
// ======================================================

export const normalizeLocation = (loc) => {
  if (!loc || typeof loc !== "string") return "";
  return loc.trim().toLowerCase().replace(/\s+/g, " ");
};

export const getDepartureLocation = (journey) => {
  if (!journey) return "";
  if (Array.isArray(journey.diemDon) && journey.diemDon.length > 0) {
    // Sắp xếp tăng dần theo offsetMinutes (offset = 0 hoặc nhỏ nhất là bến xuất phát ban đầu)
    const sorted = [...journey.diemDon].sort(
      (a, b) => (Number(a.offsetMinutes) || 0) - (Number(b.offsetMinutes) || 0)
    );
    const station = sorted[0]?.diaDiem || sorted[0]?.dia_diem;
    if (station && typeof station === "string" && station.trim()) {
      return station.trim();
    }
  }
  return journey.diemDi && typeof journey.diemDi === "string"
    ? journey.diemDi.trim()
    : "";
};

export const getArrivalLocation = (journey) => {
  if (!journey) return "";
  if (Array.isArray(journey.diemTra) && journey.diemTra.length > 0) {
    // offsetMinutes của diemTra là số phút trước khi đến bến cuối (offset = 0 là tại bến cuối)
    const sorted = [...journey.diemTra].sort(
      (a, b) => (Number(a.offsetMinutes) || 0) - (Number(b.offsetMinutes) || 0)
    );
    const station = sorted[0]?.diaDiem || sorted[0]?.dia_diem;
    if (station && typeof station === "string" && station.trim()) {
      return station.trim();
    }
  }
  return journey.diemDen && typeof journey.diemDen === "string"
    ? journey.diemDen.trim()
    : "";
};

export const isLocationMatch = (prevJourney, nextJourney) => {
  if (!prevJourney || !nextJourney) return true;

  const prevArrival = normalizeLocation(getArrivalLocation(prevJourney));
  const nextDeparture = normalizeLocation(getDepartureLocation(nextJourney));

  if (!prevArrival || !nextDeparture) {
    const prevDen = normalizeLocation(prevJourney.diemDen);
    const nextDi = normalizeLocation(nextJourney.diemDi);
    return prevDen === nextDi;
  }

  return prevArrival === nextDeparture;
};


// ======================================================
// KIỂM TRA CÙNG NGÀY
// ======================================================

const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};


// ======================================================
// TÌM CHUYẾN TRƯỚC GẦN NHẤT
// ======================================================

const findPreviousTrip = (trips, newDeparture) => {
  let previous = null;

  for (const trip of trips) {
    const arrival = new Date(trip.arrivalTime);

    if (arrival <= newDeparture) {
      if (
        !previous ||
        arrival > new Date(previous.arrivalTime)
      ) {
        previous = trip;
      }
    }
  }

  return previous;
};


// ======================================================
// TÌM CHUYẾN SAU GẦN NHẤT
// ======================================================

const findNextTrip = (trips, newArrival) => {
  let next = null;

  for (const trip of trips) {
    const departure = new Date(trip.departureTime);

    if (departure >= newArrival) {
      if (
        !next ||
        departure < new Date(next.departureTime)
      ) {
        next = trip;
      }
    }
  }

  return next;
};


// ======================================================
// CHECK KHOẢNG CÁCH SAU CHECK-OUT
// ======================================================

const checkCheckoutGap = async (
  staffId,
  tripId,
  newDeparture,
  messageType
) => {
  const prevTrip = await Trip.findById(tripId);
  if (prevTrip) {
    // Nếu chuyến trước đã hoàn thành hoặc là chuyến trong tương lai chưa diễn ra
    if (
      prevTrip.status === "hoàn thành" ||
      new Date(prevTrip.departureTime) > new Date()
    ) {
      return { error: null };
    }
  }

  const attendance = await Attendance.findOne({
    staff: staffId,
    trip: tripId,
  }).sort({
    createdAt: -1,
  });

  // ----------------------------------------------
  // CHƯA CÓ ATTENDANCE
  // ----------------------------------------------

  if (!attendance) {
    return {
      error: `${messageType} đã được phân công chuyến trước nhưng chưa nhận chuyến.`,
    };
  }

  // ----------------------------------------------
  // ĐÃ CHECK-IN NHƯNG CHƯA CHECK-OUT
  // ----------------------------------------------

  if (attendance.status === "checked_in") {
    return {
      error: `${messageType} vẫn đang thực hiện chuyến trước và chưa check-out.`,
    };
  }

  // ----------------------------------------------
  // ĐÃ CHECK-OUT
  // ----------------------------------------------

  if (attendance.status === "checked_out") {
    if (!attendance.checkOutTime) {
      return {
        error: `${messageType} đã check-out nhưng không có thời gian check-out.`,
      };
    }

    const checkOutTime = new Date(
      attendance.checkOutTime
    );

    const gapFromCheckout =
      (newDeparture - checkOutTime) / 60000;

    // Chưa đủ 10 phút
    if (gapFromCheckout < CHECKOUT_GAP_MINUTES) {
      return {
        error: `${messageType} cần nghỉ ít nhất ${CHECKOUT_GAP_MINUTES} phút sau khi check-out.`,
      };
    }

    // Đủ 10 phút
    return {
      error: null,
    };
  }

  // Trạng thái Attendance không hợp lệ
  return {
    error: `${messageType} có trạng thái chấm công không hợp lệ.`,
  };
};


// ======================================================
// CHECK XE
// ======================================================

export const checkBusAvailability = async (
  busId,
  newJourney,
  newDeparture,
  newArrival,
  excludeTripId
) => {
  const query = {
    bus: busId,
    status: { $ne: "huỷ" },
  };

  // Khi sửa chuyến -> bỏ qua chính chuyến đó
  if (excludeTripId) {
    query._id = {
      $ne: excludeTripId,
    };
  }

  const busTrips = await Trip.find(query)
    .populate("journey")
    .sort({
      departureTime: 1,
    });


  // ====================================================
  // 1. KIỂM TRA TRÙNG / ĐÈ GIỜ
  // ====================================================

  for (const trip of busTrips) {
    const oldDeparture = new Date(
      trip.departureTime
    );

    const oldArrival = new Date(
      trip.arrivalTime
    );

    const overlap =
      newDeparture < oldArrival &&
      newArrival > oldDeparture;

    if (overlap) {
      return `Xe đã có chuyến từ ${oldDeparture.toLocaleString(
        "vi-VN"
      )} đến ${oldArrival.toLocaleString(
        "vi-VN"
      )}.`;
    }
  }


  // ====================================================
  // 2. TÌM CHUYẾN TRƯỚC GẦN NHẤT
  // ====================================================

  const previous = findPreviousTrip(
    busTrips,
    newDeparture
  );


  // ====================================================
  // 3. TÌM CHUYẾN SAU GẦN NHẤT
  // ====================================================

  const next = findNextTrip(
    busTrips,
    newArrival
  );


  // ====================================================
  // 4. CHECK CHUYẾN TRƯỚC
  // ====================================================

  if (previous) {
    // ----------------------------------------------
    // KIỂM TRA VỊ TRÍ XE (ĐIỂM TRẢ CHUYẾN TRƯỚC == ĐIỂM ĐÓN CHUYẾN MỚI)
    // ----------------------------------------------

    if (
      previous.journey &&
      newJourney &&
      !isLocationMatch(previous.journey, newJourney)
    ) {
      const prevArrival =
        getArrivalLocation(previous.journey) || previous.journey.diemDen;
      const newDepartureStation =
        getDepartureLocation(newJourney) || newJourney.diemDi;
      return `Xe đang ở ${prevArrival} sau chuyến trước, không thể xuất phát từ ${newDepartureStation}.`;
    }
  }


  // ====================================================
  // 5. CHECK CHUYẾN SAU
  // ====================================================

  if (next) {
    // ----------------------------------------------
    // KIỂM TRA VỊ TRÍ (ĐIỂM TRẢ CHUYẾN MỚI == ĐIỂM ĐÓN CHUYẾN TIẾP THEO)
    // ----------------------------------------------

    if (
      next.journey &&
      newJourney &&
      !isLocationMatch(newJourney, next.journey)
    ) {
      const newArrivalStation =
        getArrivalLocation(newJourney) || newJourney.diemDen;
      const nextDepartureStation =
        getDepartureLocation(next.journey) || next.journey.diemDi;
      return `Chuyến này kết thúc tại ${newArrivalStation}, nhưng chuyến tiếp theo của xe lại xuất phát từ ${nextDepartureStation}.`;
    }
  }


  // ====================================================
  // XE OK
  // ====================================================

  return null;
};


// ======================================================
// CHECK TÀI XẾ / PHỤ XE
// ======================================================

export const checkStaffAvailability = async (
  staffId,
  newJourney,
  newDeparture,
  newArrival,
  excludeTripId
) => {
  const query = {
    $or: [
      {
        staff: staffId,
      },
      {
        assistantDriver: staffId,
      },
    ],
    status: { $ne: "huỷ" },
  };

  // Khi sửa chuyến -> bỏ qua chính chuyến đó
  if (excludeTripId) {
    query._id = {
      $ne: excludeTripId,
    };
  }

  const staffTrips = await Trip.find(query)
    .populate("journey")
    .sort({
      departureTime: 1,
    });


  // ====================================================
  // 1. KIỂM TRA TRÙNG / ĐÈ GIỜ
  // ====================================================

  for (const trip of staffTrips) {
    const oldDeparture = new Date(
      trip.departureTime
    );

    const oldArrival = new Date(
      trip.arrivalTime
    );

    const overlap =
      newDeparture < oldArrival &&
      newArrival > oldDeparture;

    if (overlap) {
      return `Nhân viên đã có chuyến từ ${oldDeparture.toLocaleString(
        "vi-VN"
      )} đến ${oldArrival.toLocaleString(
        "vi-VN"
      )}.`;
    }
  }


  // ====================================================
  // 2. TÌM CHUYẾN TRƯỚC
  // ====================================================

  const previous = findPreviousTrip(
    staffTrips,
    newDeparture
  );


  // ====================================================
  // 3. TÌM CHUYẾN SAU
  // ====================================================

  const next = findNextTrip(
    staffTrips,
    newArrival
  );


  // ====================================================
  // 4. CHECK CHUYẾN TRƯỚC
  // ====================================================

  if (previous) {
    // ----------------------------------------------
    // KIỂM TRA ATTENDANCE NẾU ĐANG CHẠY / CHƯA CHECK-OUT
    // ----------------------------------------------

    if (
      previous.status !== "hoàn thành" &&
      new Date(previous.departureTime) <= new Date()
    ) {
      const attendance = await Attendance.findOne({
        staff: staffId,
        trip: previous._id,
      }).sort({
        createdAt: -1,
      });

      if (!attendance) {
        return `Nhân viên đã được phân công chuyến lúc ${new Date(
          previous.departureTime
        ).toLocaleString(
          "vi-VN"
        )} nhưng chưa nhận chuyến.`;
      }

      if (attendance.status === "checked_in") {
        return "Nhân viên vẫn đang thực hiện chuyến trước và chưa check-out.";
      }

      if (attendance.status === "checked_out") {
        if (!attendance.checkOutTime) {
          return "Nhân viên đã check-out nhưng không có thời gian check-out.";
        }

        const checkOutTime = new Date(
          attendance.checkOutTime
        );

        const gapFromCheckout =
          (newDeparture - checkOutTime) / 60000;

        if (gapFromCheckout < CHECKOUT_GAP_MINUTES) {
          return `Nhân viên cần nghỉ ít nhất ${CHECKOUT_GAP_MINUTES} phút sau khi check-out.`;
        }
      }
    }


    // ==================================================
    // KIỂM TRA VỊ TRÍ NHÂN VIÊN
    // ==================================================

    if (
      previous.journey &&
      newJourney &&
      !isLocationMatch(previous.journey, newJourney)
    ) {
      const prevArrival =
        getArrivalLocation(previous.journey) || previous.journey.diemDen;
      const newDepartureStation =
        getDepartureLocation(newJourney) || newJourney.diemDi;
      return `Nhân viên đang ở ${prevArrival} sau chuyến trước, không thể xuất phát từ ${newDepartureStation}.`;
    }
  }


  // ====================================================
  // 5. CHECK CHUYẾN SAU
  // ====================================================

  if (next) {
    // ----------------------------------------------
    // KIỂM TRA VỊ TRÍ
    // ----------------------------------------------

    if (
      next.journey &&
      newJourney &&
      !isLocationMatch(newJourney, next.journey)
    ) {
      const newArrivalStation =
        getArrivalLocation(newJourney) || newJourney.diemDen;
      const nextDepartureStation =
        getDepartureLocation(next.journey) || next.journey.diemDi;
      return `Chuyến này kết thúc tại ${newArrivalStation}, nhưng chuyến tiếp theo của nhân viên lại xuất phát từ ${nextDepartureStation}.`;
    }
  }


  // ====================================================
  // NHÂN VIÊN OK
  // ====================================================

  return null;
};