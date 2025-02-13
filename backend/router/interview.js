import { Router } from "express";
import { checkAuth } from "../middlewares/auth.js";
import { newInterviewHandler } from "../handlers/interview.js";

const router = Router();

router.post("/new", checkAuth, newInterviewHandler);

export default router;
