import { Router } from "express";
import { createOne, deleteOne, getAll, updateOne,createSchedule, getDrivers,getTripsByStaff, } from "../controllers/trip.controller";
import { getOne } from "../controllers/trip.controller";


const tripRouter = Router();

tripRouter.get("/", getAll);
tripRouter.get("/drivers", getDrivers);
tripRouter.get("/staff/:staffId", getTripsByStaff);
tripRouter.get("/:id", getOne);
tripRouter.post("/add",  createOne);
tripRouter.post("/generate",createSchedule);
tripRouter.put("/update/:id",  updateOne);
tripRouter.delete("/delete/:id", deleteOne);

export default tripRouter;