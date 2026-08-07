import { Router } from "express";
import {
  checkIn,
  checkOut,
  getByStaff,
  getByTrip,
  getByStaffTrips,
  uploadProofImage,
  getAll,
} from "../controllers/attendance.controller";

const attendanceRouter = Router();
attendanceRouter.get("/", getAll);
attendanceRouter.post("/checkin", uploadProofImage, checkIn);
attendanceRouter.post("/checkout", checkOut);
attendanceRouter.get("/staff/:staffId", getByStaff);
attendanceRouter.get("/staff-trips/:staffId", getByStaffTrips);
attendanceRouter.get("/trip/:tripId", getByTrip);

export default attendanceRouter;
