import { Router } from "express";
import {createOne, getAll, getOne, updateOne, deleteOne, changePassword, login} from "../controllers/tk.controller.js";

const TkRouter = Router();

TkRouter.post("/login", login);

TkRouter.get("/", getAll);
TkRouter.get("/:id", getOne);

TkRouter.post("/add", createOne);

TkRouter.put("/update/:id", updateOne);
TkRouter.put("/change-password/:id", changePassword);

TkRouter.delete("/delete/:id", deleteOne);

export default TkRouter;