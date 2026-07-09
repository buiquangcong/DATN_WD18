import { Router } from "express";
import { getDashboardStats } from "../controllers/statistics.controller.js";

const router = Router();

router.get("/dashboard", getDashboardStats);

export default router;
