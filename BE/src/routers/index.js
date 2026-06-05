import { Router } from "express";
import busRouter from "./bus.router";

const router = Router();

router.use("/bus", busRouter);

export default router;