import { Router } from "express";
import { createRouteHandler, createUploadthing } from "uploadthing/express";
import { checkAuth } from "../middlewares/auth.js";
import {
    getInterviewStatusHandler,
    newInterviewHandler,
    getInterviewHandler,
    endInterviewHandler,
} from "../handlers/interview.js";
import { checkAuthForUpload } from "../middlewares/upload-auth.js";

const router = Router();
const f = createUploadthing();

router.use(
    "/upload-resume",
    createRouteHandler({
        router: {
            resumeUploader: f({
                pdf: {
                    minFileCount: 1,
                    maxFileCount: 1,
                    maxFileSize: "1MB",
                },
            })
                .middleware(async ({ req }) => {
                    const user = await checkAuthForUpload(req);
                    if (!user) {
                        throw "Not allowed";
                    }
                    return { user };
                })
                .onUploadComplete((data) => {
                    console.log("upload completed", data);
                    return { url: result.url };
                }),
        },
    }),
);

router.post("/new", checkAuth, newInterviewHandler);
router.get("/:interviewId/status", checkAuth, getInterviewStatusHandler);
router.get("/:interviewId", checkAuth, getInterviewHandler);
router.post("/end/:interviewId", checkAuth, endInterviewHandler);

export default router;
