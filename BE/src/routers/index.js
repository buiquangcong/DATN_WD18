import { Router } from "express";
import busRouter from "./bus.router";
import danhmucxeRouter from "./danhmucxe.router";
import journeyRouter from "./journey.router";
import staffRouter from "./staff.router";
import authRouter from "./auth.router";

const router = Router();

router.use("/bus", busRouter);
router.use("/danhmucxe", danhmucxeRouter);
router.use("/journey", journeyRouter);
router.use("/staff", staffRouter);
router.use("/auth", authRouter);

export default router;
