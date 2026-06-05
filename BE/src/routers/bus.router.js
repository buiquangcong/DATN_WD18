import { Router } from "express";
import { createOne, getAll, updateOne, deleteOne } from "../controllers/bus.controller";

const busRouter = Router();

busRouter.get("/", getAll);
busRouter.post("/add", createOne);
busRouter.put("/update/:id", updateOne);
busRouter.delete("/delete/:id", deleteOne);

export default busRouter;