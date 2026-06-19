import { Router } from "express";
import { createOne, getAll, updateOne, deleteOne } from "../controllers/booking.controller";
import { getOne } from "../controllers/booking.controller";

const bookingRouter = Router();

bookingRouter.get("/", getAll);

bookingRouter.post("/add", createOne);

bookingRouter.put("/update/:id", updateOne);

bookingRouter.delete("/delete/:id", deleteOne);

bookingRouter.get("/:id", getOne);

export default bookingRouter;