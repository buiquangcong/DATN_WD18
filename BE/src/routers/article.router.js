import { Router } from "express";
import { createOne, deleteOne, getAll, updateOne } from "../controllers/article.controller";
import { checkPermission } from "../middlewares/checkPermission";


const articleRouter = Router();

articleRouter.get("/", getAll);
articleRouter.post("/", checkPermission, createOne);
articleRouter.put("/:id", checkPermission, updateOne);
articleRouter.delete("/:id", checkPermission, deleteOne);


export default articleRouter;