import { Router } from "express";
import { createOne, deleteOne, getAll, updateOne } from "../controllers/trip.controller";
import { getOne } from "../controllers/trip.controller";


const tripRouter = Router();

tripRouter.get("/", getAll);
tripRouter.get("/:id", getOne);

tripRouter.post("/add",  createOne);
tripRouter.put("/edit/:id",  updateOne);
tripRouter.put("/update/:id",  updateOne);
tripRouter.delete("/delete/:id", deleteOne);

export default tripRouter;