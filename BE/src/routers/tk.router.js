import { Router } from "express";
import {createOne,getAll,getOne,updateOne,deleteOne} from "../controllers/tk.controller.js";

const TkRouter = Router();

TkRouter.get("/", getAll);
TkRouter.get("/:id", getOne);

TkRouter.post("/add", createOne);

TkRouter.put("/update/:id", updateOne);

TkRouter.delete("/delete/:id", deleteOne);

export default TkRouter;