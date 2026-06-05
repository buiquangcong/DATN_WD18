import { Router } from "express";
import busRouter from "./bus.router";
import danhmucxeRouter from "./danhmucxe.router";   
import journeyRouter from "./journey.router";
const router = Router();

router.use("/bus", busRouter);
router.use("/danhmucxe",danhmucxeRouter);
router.use("/journey", journeyRouter);
export default router;