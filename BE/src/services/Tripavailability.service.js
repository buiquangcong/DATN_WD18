import Trip from "../models/trip.model.js";

export const TURN_AROUND_MINUTES = 30;

export const LOCATION_CHECK_MAX_GAP_MINUTES = 12 * 60; // 12 tiếng

export const checkBusAvailability = async (busId,newJourney,newDeparture,newArrival,excludeTripId) => {
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
export const checkStaffAvailability = async (
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