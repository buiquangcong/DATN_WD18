import { Router } from "express";
import { getOne, createOne, deleteOne, getAll, updateOne } from "../controllers/journey.controller";

const journeyRouter = Router();

journeyRouter.get("/", getAll);
journeyRouter.get("/:id", getOne);
journeyRouter.post("/add",  createOne);
journeyRouter.put("/edit/:id",  updateOne);
journeyRouter.delete("/delete/:id", deleteOne);

export default journeyRouter;


