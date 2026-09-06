import { Router } from "express";
import {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} from "../controllers/station.controller.js";

const stationRouter = Router();

stationRouter.get("/", getAll);
stationRouter.get("/:id", getOne);
stationRouter.post("/add", createOne);
stationRouter.put("/update/:id", updateOne);
stationRouter.delete("/delete/:id", deleteOne);

export default stationRouter;
