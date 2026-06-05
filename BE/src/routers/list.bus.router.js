import { Router } from "express";
import { getAll } from "../controllers/list.bus.controller";

const busRouter = Router();

busRouter.get("/", getAll);

export default busRouter;