import { Router } from "express";
import { createOne, deleteOne, getAll, updateOne } from "../controllers/staff.controller";
import { getOne } from "../controllers/staff.controller";


const staffRouter = Router();

staffRouter.get("/", getAll);
staffRouter.get("/detail/:id", getOne);

staffRouter.post("/add",  createOne);
staffRouter.put("/edit/:id",  updateOne);
staffRouter.put("/update/:id",  updateOne);
staffRouter.delete("/delete/:id", deleteOne);

export default staffRouter;