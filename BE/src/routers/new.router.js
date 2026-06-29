import { Router } from "express";

import {getAll,getOne,createOne,updateOne,deleteOne,} from "../controllers/new.controller.js";

const newsRouter = Router();

newsRouter.get("/", getAll);

newsRouter.get("/:id", getOne);

newsRouter.post("/add", createOne);

newsRouter.put("/update/:id", updateOne);

newsRouter.delete("/delete/:id", deleteOne);

export default newsRouter;