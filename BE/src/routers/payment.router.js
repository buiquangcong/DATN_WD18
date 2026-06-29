import { Router } from "express";
import { createPaymentLink, handlePayOSWebhook} from "../controllers/payment.controller.js";

const paymentRouter = Router();

paymentRouter.post("/create-link", createPaymentLink);
paymentRouter.post("/webhook", handlePayOSWebhook);

export default paymentRouter;