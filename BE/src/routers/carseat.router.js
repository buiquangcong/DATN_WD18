import { Router } from "express";
import { createSchedule, getSeats, getAllTrips } from "../controllers/carseat.controller.js";

const carseatRouter = Router();

carseatRouter.post("/create", createSchedule);
carseatRouter.get("/get/:id", getSeats);
carseatRouter.get("/", getAllTrips);

export default carseatRouter;