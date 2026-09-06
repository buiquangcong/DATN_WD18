import cron from "node-cron";
import Trip from "../models/trip.model.js";
import Attendance from "../models/attendance.model.js";
import Staff from "../models/staff.model.js";
import Bus from "../models/bus.model.js";

// ===============================
// CRON JOB: TỰ ĐỘNG CHUYỂN TRẠNG THÁI
// Chạy mỗi phút 1 lần
//
// Điều kiện:
// 1. Trip đang "sắp chạy"
// 2. Đã đến giờ xuất phát
// 3. Tài xế đã check-in
//
// Khi đủ điều kiện:
// - Trip  -> "đang chạy"
// - Staff -> "đang làm"
// - Bus   -> "đang làm"
// ===============================

export const startTripStatusCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const trips = await Trip.find({
        status: "sắp chạy",
        departureTime: { $lte: now },
      });

      if (trips.length === 0) return;

      for (const trip of trips) {

        // ===============================
        // KIỂM TRA TÀI XẾ ĐÃ CHECK-IN
        // ===============================

        if (!trip.staff) {
          continue;
        }

        const driverAttendance =
          await Attendance.findOne({
            staff: trip.staff,
            trip: trip._id,
            status: "checked_in",
          });

        // Chưa check-in thì không chuyển trạng thái
        if (!driverAttendance) {
          continue;
        }

        // ===============================
        // TÀI XẾ -> ĐANG LÀM
        // ===============================

        await Staff.findByIdAndUpdate(
          trip.staff,
          {
            trangThai: "đang làm",
          }
        );

        // ===============================
        // XE -> ĐANG LÀM
        // ===============================

        if (trip.bus) {
          await Bus.findByIdAndUpdate(
            trip.bus,
            {
              status: "đang làm",
            }
          );
        }

        // ===============================
        // CHUYẾN -> ĐANG CHẠY
        // ===============================

        await Trip.findByIdAndUpdate(
          trip._id,
          {
            status: "đang chạy",
          }
        );

        console.log(
          `[CRON] Chuyến ${trip._id} -> đang chạy`
        );

        console.log(
          `[CRON] Tài xế ${trip.staff} -> đang làm`
        );

        console.log(
          `[CRON] Xe ${trip.bus} -> đang làm`
        );
      }

    } catch (err) {
      console.error(
        "[CRON] Lỗi cập nhật trạng thái:",
        err
      );
    }
  });

  console.log(
    "[CRON] Đã khởi động cron job (mỗi phút)"
  );
};