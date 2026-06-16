import { Router } from "express";
import busRouter from "./bus.router";
import danhmucxeRouter from "./danhmucxe.router";
import journeyRouter from "./journey.router";
import staffRouter from "./staff.router";
import authRouter from "./auth.router";
import tripRouter from "./trip.router";
import carseatRouter from "./carseat.router";
import bookingRouter from "./booking.router";
const router = Router();

router.use("/bus", busRouter);
router.use("/danhmucxe", danhmucxeRouter);
router.use("/journey", journeyRouter);
router.use("/staff", staffRouter);
router.use("/auth", authRouter);
router.use("/trip", tripRouter);
router.use("/carseat", carseatRouter);
router.use("/booking", bookingRouter);

export default router;
