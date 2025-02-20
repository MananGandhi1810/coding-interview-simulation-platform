import { PrismaClient } from "@prisma/client";
import { sendQueueMessage } from "../utils/queue-manager.js";

const prisma = new PrismaClient();

const newInterviewHandler = async (req, res) => {
    const { jobRole, yoe, resumeUrl, company } = req.body;

    if (!jobRole || !yoe || !resumeUrl || !company) {
        return res.status(400).json({
            success: false,
            message: "All fields are required",
        });
    }

    var interview;
    try {
        interview = await prisma.interview.create({
            data: {
                company,
                resumeUrl,
                yoe: parseInt(yoe),
                role: jobRole,
                userId: req.user.id,
            },
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "Failed to create interview",
            data: null,
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
                id: interview.id,
            }),
        );
    } catch (e) {
        console.log(e);
        await prisma.interview.update({
            data: {
                state: "ERROR",
            },
            where: {
                id: interview.id,
            },
        });
        return res.status(500).json({
            success: false,
            message: "Failed to publish to queue",
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
