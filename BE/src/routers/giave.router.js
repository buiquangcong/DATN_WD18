import { Router } from "express";

import {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} from "../controllers/giave.controller.js";

const fareRuleRouter = Router();

fareRuleRouter.get("/", getAll);

fareRuleRouter.get("/:id", getOne);

fareRuleRouter.post("/add", createOne);

fareRuleRouter.put(
  "/update/:id",
  updateOne
);

fareRuleRouter.delete(
  "/delete/:id",
  deleteOne
);

export default fareRuleRouter;