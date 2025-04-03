import { Router } from "express";
import { checkAuth } from "../middlewares/auth.js";
import { getProblemStatementByIdHandler } from "../handlers/problem-statement.js";

const router = Router();

router.get("/:problemStatementId", checkAuth, getProblemStatementByIdHandler);

export default router;
