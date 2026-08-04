import express from "express";

import {getAll,getOne,createOne,updateOne,deleteOne,} from "../controllers/holiday.controller.js";

const router = express.Router();

router.get("/", getAll);

router.get("/:id", getOne);

router.post("/add", createOne);

router.put("/update/:id", updateOne);

router.delete("/delete/:id", deleteOne);

export default router;