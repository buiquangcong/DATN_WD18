import { Router } from "express";
import busRouter from "./list.bus.router";
import danhmucxeRouter from "./danhmucxe.router";
const router = Router();

router.use("/bus", busRouter);
router.use("/danhmucxe",danhmucxeRouter)

export default router;