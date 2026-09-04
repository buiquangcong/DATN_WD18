import Trip from "../models/trip.model.js";

export const TURN_AROUND_MINUTES = 30;

// Khoảng nghỉ <= 12 tiếng thì mới kiểm tra vị trí
export const LOCATION_CHECK_MAX_GAP_MINUTES = 12 * 60;


// ======================================================
// TÌM CHUYẾN TRƯỚC GẦN NHẤT
// ======================================================

const findPreviousTrip = (trips, newDeparture) => {
  let previous = null;

  for (const trip of trips) {
    const departure = new Date(trip.departureTime);
    const arrival = new Date(trip.arrivalTime);

    // Chỉ lấy chuyến đã kết thúc trước giờ xuất phát mới
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

    // Chỉ lấy chuyến bắt đầu sau khi chuyến mới kết thúc
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

  // Khi sửa chuyến thì bỏ qua chính nó
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
  // 1. CHECK TRÙNG / ĐÈ GIỜ
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
  // 2. TÌM ĐÚNG CHUYẾN TRƯỚC GẦN NHẤT
  // ====================================================

  const previous = findPreviousTrip(
    busTrips,
    newDeparture
  );


  // ====================================================
  // 3. TÌM ĐÚNG CHUYẾN SAU GẦN NHẤT
  // ====================================================

  const next = findNextTrip(
    busTrips,
    newArrival
  );


  // ====================================================
  // 4. CHECK CHUYẾN TRƯỚC
  // ====================================================

  if (previous) {

    const previousArrival = new Date(
      previous.arrivalTime
    );

    const gapMinutes =
      (newDeparture - previousArrival) / 60000;


    // ----------------------------------------------
    // Nghỉ tối thiểu 30 phút
    // ----------------------------------------------

    if (gapMinutes < TURN_AROUND_MINUTES) {
      return `Xe cần nghỉ tối thiểu ${TURN_AROUND_MINUTES} phút sau chuyến trước.`;
    }


    // ----------------------------------------------
    // Nghỉ <= 12 tiếng
    // -> phải ở đúng địa điểm
    // ----------------------------------------------

    if (
      gapMinutes <= LOCATION_CHECK_MAX_GAP_MINUTES &&
      previous.journey &&
      newJourney &&
      previous.journey.diemDen !== newJourney.diemDi
    ) {

      return `Xe đang ở ${previous.journey.diemDen} sau chuyến trước, không thể xuất phát từ ${newJourney.diemDi}.`;
    }
  }


  // ====================================================
  // 5. CHECK CHUYẾN SAU
  // ====================================================

  if (next) {

    const nextDeparture = new Date(
      next.departureTime
    );

    const gapMinutes =
      (nextDeparture - newArrival) / 60000;


    // ----------------------------------------------
    // Phải còn ít nhất 30 phút
    // ----------------------------------------------

    if (gapMinutes < TURN_AROUND_MINUTES) {
      return `Không đủ ${TURN_AROUND_MINUTES} phút chuẩn bị trước chuyến tiếp theo của xe.`;
    }


    // ----------------------------------------------
    // Nghỉ <= 12 tiếng
    // -> phải kết thúc đúng nơi chuyến sau xuất phát
    // ----------------------------------------------

    if (
      gapMinutes <= LOCATION_CHECK_MAX_GAP_MINUTES &&
      next.journey &&
      newJourney &&
      newJourney.diemDen !== next.journey.diemDi
    ) {

      return `Chuyến này kết thúc tại ${newJourney.diemDen}, nhưng chuyến tiếp theo của xe lại xuất phát từ ${next.journey.diemDi}.`;
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

  // Tìm tất cả chuyến mà nhân viên này là:
  // - tài xế
  // - hoặc phụ xe
  const query = {
    $or: [
      { staff: staffId },
      { assistantDriver: staffId },
    ],
  };

  // Khi sửa chuyến thì bỏ qua chính chuyến đó
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
  // XÁC ĐỊNH NHÂN VIÊN LÀ TÀI XẾ HAY PHỤ XE
  // ====================================================

  const isAssistant = staffTrips.some(
    (trip) =>
      trip.assistantDriver &&
      trip.assistantDriver.toString() ===
        staffId.toString()
  );

  const roleName = isAssistant
    ? "Phụ xe"
    : "Tài xế";


  // ====================================================
  // 1. CHECK TRÙNG GIỜ
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
      return `${roleName} đã có chuyến từ ${oldDeparture.toLocaleString(
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
    staffTrips,
    newDeparture
  );


  // ====================================================
  // 3. TÌM CHUYẾN SAU GẦN NHẤT
  // ====================================================

  const next = findNextTrip(
    staffTrips,
    newArrival
  );


  // ====================================================
  // 4. CHECK CHUYẾN TRƯỚC
  // ====================================================

  if (previous) {

    const previousArrival = new Date(
      previous.arrivalTime
    );

    const gapMinutes =
      (newDeparture - previousArrival) /
      60000;


    // ----------------------------------------------
    // Nghỉ tối thiểu 30 phút
    // ----------------------------------------------

    if (
      gapMinutes < TURN_AROUND_MINUTES
    ) {
      return `${roleName} cần nghỉ tối thiểu ${TURN_AROUND_MINUTES} phút sau chuyến trước.`;
    }


    // ----------------------------------------------
    // Nghỉ <= 12 tiếng
    // -> phải ở đúng địa điểm
    // ----------------------------------------------

    if (
      gapMinutes <=
        LOCATION_CHECK_MAX_GAP_MINUTES &&
      previous.journey &&
      newJourney &&
      previous.journey.diemDen !==
        newJourney.diemDi
    ) {
      return `${roleName} đang ở ${previous.journey.diemDen} sau chuyến trước, không thể xuất phát từ ${newJourney.diemDi}.`;
    }
  }


  // ====================================================
  // 5. CHECK CHUYẾN SAU
  // ====================================================

  if (next) {

    const nextDeparture = new Date(
      next.departureTime
    );

    const gapMinutes =
      (nextDeparture - newArrival) /
      60000;


    // ----------------------------------------------
    // Phải còn ít nhất 30 phút
    // ----------------------------------------------

    if (
      gapMinutes < TURN_AROUND_MINUTES
    ) {
      return `Không đủ ${TURN_AROUND_MINUTES} phút nghỉ trước chuyến tiếp theo của ${roleName.toLowerCase()}.`;
    }


    // ----------------------------------------------
    // Nghỉ <= 12 tiếng
    // -> phải kết thúc đúng nơi chuyến sau xuất phát
    // ----------------------------------------------

    if (
      gapMinutes <=
        LOCATION_CHECK_MAX_GAP_MINUTES &&
      next.journey &&
      newJourney &&
      newJourney.diemDen !==
        next.journey.diemDi
    ) {
      return `Chuyến này kết thúc tại ${newJourney.diemDen}, nhưng chuyến tiếp theo của ${roleName.toLowerCase()} lại xuất phát từ ${next.journey.diemDi}.`;
    }
  }


  // ====================================================
  // NHÂN VIÊN OK
  // ====================================================

  return null;
};