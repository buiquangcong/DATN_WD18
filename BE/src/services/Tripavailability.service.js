import Trip from "../models/trip.model.js";
import Attendance from "../models/attendance.model.js";

// ======================================================
// CẤU HÌNH
// ======================================================

// Sau khi check-out phải chờ tối thiểu 10 phút
export const CHECKOUT_GAP_MINUTES = 10;

// Khoảng cách <= 12 tiếng thì kiểm tra vị trí
export const LOCATION_CHECK_MAX_GAP_MINUTES = 12 * 60;


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
  // 2. CHỈ XÉT CHUYẾN CÙNG NGÀY
  // ====================================================

  const sameDayTrips = busTrips.filter((trip) => {
    const oldDeparture = new Date(
      trip.departureTime
    );

    return isSameDay(
      oldDeparture,
      newDeparture
    );
  });


  // ====================================================
  // 3. TÌM CHUYẾN TRƯỚC
  // ====================================================

  const previous = findPreviousTrip(
    sameDayTrips,
    newDeparture
  );


  // ====================================================
  // 4. TÌM CHUYẾN SAU
  // ====================================================

  const next = findNextTrip(
    sameDayTrips,
    newArrival
  );


  // ====================================================
  // 5. CHECK CHUYẾN TRƯỚC
  // ====================================================

  if (previous) {
    const previousArrival = new Date(
      previous.arrivalTime
    );

    // ----------------------------------------------
    // KIỂM TRA TÀI XẾ CỦA CHUYẾN TRƯỚC
    // ----------------------------------------------

    if (previous.staff) {
      const checkoutResult =
        await checkCheckoutGap(
          previous.staff,
          previous._id,
          newDeparture,
          "Tài xế"
        );

      if (checkoutResult.error) {
        return `Xe: ${checkoutResult.error}`;
      }
    }


    // ----------------------------------------------
    // KIỂM TRA VỊ TRÍ XE
    // ----------------------------------------------

    const gapMinutes =
      (newDeparture - previousArrival) / 60000;

    if (
      gapMinutes <=
        LOCATION_CHECK_MAX_GAP_MINUTES &&
      previous.journey &&
      newJourney &&
      previous.journey.diemDen !==
        newJourney.diemDi
    ) {
      return `Xe đang ở ${previous.journey.diemDen} sau chuyến trước, không thể xuất phát từ ${newJourney.diemDi}.`;
    }
  }


  // ====================================================
  // 6. CHECK CHUYẾN SAU
  // ====================================================

  if (next) {
    const nextDeparture = new Date(
      next.departureTime
    );

    const gapMinutes =
      (nextDeparture - newArrival) / 60000;


    // ----------------------------------------------
    // KIỂM TRA VỊ TRÍ
    // ----------------------------------------------

    if (
      gapMinutes <=
        LOCATION_CHECK_MAX_GAP_MINUTES &&
      next.journey &&
      newJourney &&
      newJourney.diemDen !==
        next.journey.diemDi
    ) {
      return `Chuyến này kết thúc tại ${newJourney.diemDen}, nhưng chuyến tiếp theo của xe lại xuất phát từ ${next.journey.diemDi}.`;
    }

    // ----------------------------------------------
    // KHÔNG CÒN CHECK 30 PHÚT
    // ----------------------------------------------
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
  // 1. CHỈ XÉT CHUYẾN CÙNG NGÀY
  // ====================================================

  const sameDayTrips = staffTrips.filter((trip) => {
    const oldDeparture = new Date(
      trip.departureTime
    );

    return isSameDay(
      oldDeparture,
      newDeparture
    );
  });


  // ====================================================
  // 2. KIỂM TRA TRÙNG / ĐÈ GIỜ
  // ====================================================

  for (const trip of sameDayTrips) {
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
  // 3. TÌM CHUYẾN TRƯỚC
  // ====================================================

  const previous = findPreviousTrip(
    sameDayTrips,
    newDeparture
  );


  // ====================================================
  // 4. TÌM CHUYẾN SAU
  // ====================================================

  const next = findNextTrip(
    sameDayTrips,
    newArrival
  );


  // ====================================================
  // 5. CHECK CHUYẾN TRƯỚC
  // ====================================================

  if (previous) {
    const previousArrival = new Date(
      previous.arrivalTime
    );


    // ==================================================
    // XÁC ĐỊNH NHÂN VIÊN LÀ TÀI XẾ HAY PHỤ XE
    // ==================================================

    const isDriver =
      previous.staff &&
      previous.staff.toString() ===
        staffId.toString();

    const isAssistant =
      previous.assistantDriver &&
      previous.assistantDriver.toString() ===
        staffId.toString();


    // ==================================================
    // TÌM ATTENDANCE
    // ==================================================

    const attendance =
      await Attendance.findOne({
        staff: staffId,
        trip: previous._id,
      }).sort({
        createdAt: -1,
      });


    // ==================================================
    // CHƯA CHECK-IN
    // ==================================================

    if (!attendance) {
      return `Nhân viên đã được phân công chuyến lúc ${new Date(
        previous.departureTime
      ).toLocaleString(
        "vi-VN"
      )} trong ngày hôm nay nhưng chưa nhận chuyến.`;
    }


    // ==================================================
    // ĐÃ CHECK-IN NHƯNG CHƯA CHECK-OUT
    // ==================================================

    if (
      attendance.status ===
      "checked_in"
    ) {
      return "Nhân viên vẫn đang thực hiện chuyến trước và chưa check-out.";
    }


    // ==================================================
    // ĐÃ CHECK-OUT
    // ==================================================

    if (
      attendance.status ===
      "checked_out"
    ) {
      if (!attendance.checkOutTime) {
        return "Nhân viên đã check-out nhưng không có thời gian check-out.";
      }

      const checkOutTime =
        new Date(
          attendance.checkOutTime
        );

      const gapFromCheckout =
        (newDeparture -
          checkOutTime) /
        60000;


      // ----------------------------------------------
      // CHỈ CẦN 10 PHÚT
      // ----------------------------------------------

      if (
        gapFromCheckout <
        CHECKOUT_GAP_MINUTES
      ) {
        return `Nhân viên cần nghỉ ít nhất ${CHECKOUT_GAP_MINUTES} phút sau khi check-out.`;
      }
    }


    // ==================================================
    // KIỂM TRA VỊ TRÍ NHÂN VIÊN
    // ==================================================

    const gapMinutes =
      (newDeparture -
        previousArrival) /
      60000;

    if (
      gapMinutes <=
        LOCATION_CHECK_MAX_GAP_MINUTES &&
      previous.journey &&
      newJourney &&
      previous.journey.diemDen !==
        newJourney.diemDi
    ) {
      return `Nhân viên đang ở ${previous.journey.diemDen} sau chuyến trước, không thể xuất phát từ ${newJourney.diemDi}.`;
    }
  }


  // ====================================================
  // 6. CHECK CHUYẾN SAU
  // ====================================================

  if (next) {
    const nextDeparture = new Date(
      next.departureTime
    );

    const gapMinutes =
      (nextDeparture -
        newArrival) /
      60000;


    // ----------------------------------------------
    // KIỂM TRA VỊ TRÍ
    // ----------------------------------------------

    if (
      gapMinutes <=
        LOCATION_CHECK_MAX_GAP_MINUTES &&
      next.journey &&
      newJourney &&
      newJourney.diemDen !==
        next.journey.diemDi
    ) {
      return `Chuyến này kết thúc tại ${newJourney.diemDen}, nhưng chuyến tiếp theo lại xuất phát từ ${next.journey.diemDi}.`;
    }


    // ----------------------------------------------
    // KHÔNG CÒN CHECK 30 PHÚT
    // ----------------------------------------------
  }


  // ====================================================
  // NHÂN VIÊN OK
  // ====================================================

  return null;
};