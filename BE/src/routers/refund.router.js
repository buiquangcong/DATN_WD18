import { Router } from "express";
import { getAll, getOne, createOne, updateOne, deleteOne } from "../controllers/refund.controller.js";

const refundRouter = Router();

refundRouter.get("/", getAll);
refundRouter.post("/add", createOne);
refundRouter.put("/update/:id", updateOne);
refundRouter.delete("/delete/:id", deleteOne);
refundRouter.get("/:id", getOne);

export default refundRouter;
