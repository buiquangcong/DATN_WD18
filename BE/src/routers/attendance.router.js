import { Router } from "express";
import {
  checkIn,
  checkOut,
  getByStaff,
  getByTrip,
  getByStaffTrips,
} from "../controllers/attendance.controller";

const attendanceRouter = Router();

attendanceRouter.post("/checkin", checkIn);
attendanceRouter.post("/checkout", checkOut);
attendanceRouter.get("/staff/:staffId", getByStaff);
attendanceRouter.get("/staff-trips/:staffId", getByStaffTrips);
attendanceRouter.get("/trip/:tripId", getByTrip);

export default attendanceRouter;
