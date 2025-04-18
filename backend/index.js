import express from "express";
import authRouter from "./router/auth.js";
import interviewRouter from "./router/interview.js";
import codeRouter from "./router/code.js";
import problemStatementRouter from "./router/problem-statement.js";
import logger from "morgan";
import cors from "cors";

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(
    cors({
        origin: true,
        credentials: true,
    }),
);

app.use("/auth", authRouter);
app.use("/interview", interviewRouter);
app.use("/code", codeRouter);
app.use("/problem-statement", problemStatementRouter);

app.use(function (req, res, next) {
    res.status(404).json({
        success: false,
        message: "This route could not be found",
        data: null,
    });
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    res.status(err.status || 500).json({
        success: false,
        message: "An unexpected error occured",
        data: null,
    });
});

export default app;
