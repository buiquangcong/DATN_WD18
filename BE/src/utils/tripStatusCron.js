import cron from "node-cron";
import Trip from "../models/trip.model.js";
import Attendance from "../models/attendance.model.js";

// ===============================
// CRON JOB: TỰ ĐỘNG CHUYỂN TRẠNG THÁI XE
// Chạy mỗi phút 1 lần
// Điều kiện chuyển "sắp chạy" -> "đang chạy":
//   1. Tài xế đã chấm công (có bản ghi Attendance)
//   2. Đã đến giờ xuất phát (now >= departureTime)
// ===============================

export const startTripStatusCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Lấy tất cả chuyến "sắp chạy" đã đến hoặc qua giờ xuất phát
      const trips = await Trip.find({
        status: "sắp chạy",
        departureTime: { $lte: now },
      });

      if (trips.length === 0) return;

      for (const trip of trips) {
        // Kiểm tra tài xế đã chấm công chưa
        const driverAttendance = await Attendance.findOne({
          staff: trip.staff,
          trip: trip._id,
          status: "checked_in",
        });

        if (driverAttendance) {
          // Đủ 2 điều kiện -> chuyển sang đang chạy
          await Trip.findByIdAndUpdate(trip._id, {
            status: "đang chạy",
          });

          console.log(
            `[CRON] Chuyến ${trip._id} -> đang chạy (tài xế đã chấm công + đến giờ xuất phát)`
          );
        }
      }
    } catch (err) {
      console.error("[CRON] Lỗi cron job cập nhật trạng thái xe:", err);
    }
  });

  console.log("[CRON] Đã khởi động cron job theo dõi trạng thái xe (mỗi phút)");
};
