import { Router } from "express";
import busRouter from "./list.bus.router";

const router = Router();

router.use("/list-bus", busRouter);

export default router;