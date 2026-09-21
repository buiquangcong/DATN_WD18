import { Router } from "express";
import {
  createIncident,
  getAll,
  getOne,
  getByTrip,
  updateStatus,
  deleteOne,
} from "../controllers/incident.controller.js";

const incidentRouter = Router();

incidentRouter.post("/", createIncident);
incidentRouter.get("/", getAll);
incidentRouter.get("/trip/:tripId", getByTrip);
incidentRouter.get("/:id", getOne);
incidentRouter.put("/:id/status", updateStatus);
incidentRouter.delete("/:id", deleteOne);

export default incidentRouter;
