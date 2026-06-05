import { Router } from "express";
import { createOne, deleteOne, getAll, updateOne } from "../controllers/danhmucxe.controller";


const danhmucxeRouter = Router();

danhmucxeRouter.get("/", getAll);

danhmucxeRouter.post("/",  createOne);
danhmucxeRouter.put("/:id",  updateOne);
danhmucxeRouter.delete("/:id", deleteOne);

export default danhmucxeRouter;