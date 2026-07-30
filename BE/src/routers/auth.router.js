import { Router } from "express";
import { signup, signin, forgotPassword, resetPassword } from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);

export default authRouter;