import { Router } from "express";
import articleRouter from "./article.router";
import authRouter from "./auth.router";

const router = Router();

router.use("/articles", articleRouter);
router.use("/auth", authRouter);

export default router;