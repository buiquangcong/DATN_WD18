import { Router } from "express";
import { 
    createPaymentLink, 
    handlePayOSWebhook, 
    cancelPaymentAndReleaseSeats,
    getPaymentStatus 
} from "../controllers/payment.controller.js";

const paymentRouter = Router();

paymentRouter.post("/create-link", createPaymentLink);
paymentRouter.post("/webhook", handlePayOSWebhook);
paymentRouter.post("/cancel", cancelPaymentAndReleaseSeats);
paymentRouter.get("/cancel", cancelPaymentAndReleaseSeats);
paymentRouter.get("/status/:orderCode", getPaymentStatus);

export default paymentRouter;