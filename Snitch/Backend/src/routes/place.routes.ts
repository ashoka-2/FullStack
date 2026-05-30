import express, { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getPlace, updatePlace } from "../controllers/place.controller.js";

const router: Router = express.Router();

router.use(verifyToken as any);

router.get("/", getPlace as any);
router.post("/update", updatePlace as any);

export default router;
