import { Router } from "express";
import { createSchedule, getSeats } from "../controllers/carseat.controller.js";

const carseatRouter = Router();

carseatRouter.post("/create", createSchedule);
carseatRouter.get("/get/:id", getSeats);

export default carseatRouter;