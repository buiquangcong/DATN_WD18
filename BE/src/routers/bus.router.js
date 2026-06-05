import { Router } from "express";
import { createOne, getAll } from "../controllers/bus.controller";

const busRouter = Router();

busRouter.get("/", getAll);
busRouter.post("/add", createOne);

export default busRouter;