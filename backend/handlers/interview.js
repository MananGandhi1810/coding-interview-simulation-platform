import { PrismaClient } from "@prisma/client";
import { sendQueueMessage } from "../utils/queue-manager.js";

const prisma = new PrismaClient();

const newInterviewHandler = async (req, res) => {
    const { jobRole, yoe, resumeUrl, company } = req.body;

    console.log({ jobRole, yoe, resumeUrl, company });
    if (!jobRole || !yoe || !resumeUrl || !company) {
        return res.status(400).json({
            success: false,
            message: "All fields are required",
        });
    }

    try {
        await sendQueueMessage(
            "new-interview",
            JSON.stringify({
                jobRole,
                yoe,
                resumeUrl,
                company,
                name: req.user.name,
            }),
        );
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "Failed to create interview",
            data: null,
        });
    }

    res.json({
        success: true,
        message: "Analyzing resume",
        data: null,
    });
};

export { newInterviewHandler };
