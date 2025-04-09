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
        data: { interview },
    });
};

const getInterviewStatusHandler = async (req, res) => {
    const { interviewId } = req.params;

    if (!interviewId) {
        return res.status(400).json({
            success: false,
            message: "Interview ID is required",
            data: null,
        });
    }

    const interview = await prisma.interview.findUnique({
        where: {
            id: interviewId,
            userId: req.user.id,
        },
    });

    if (!interview) {
        return res.status(404).json({
            success: false,
            message: "Interview not found",
            data: null,
        });
    }

    return res.json({
        success: true,
        message: "Interview status retrieved",
        data: {
            state: interview.state,
            resultState: interview.resultState,
            resumeAnalysisId: interview.resumeAnalysisId,
        },
    });
};

const getInterviewHandler = async (req, res) => {
    const { interviewId } = req.params;

    if (!interviewId) {
        return res.status(400).json({
            success: false,
            message: "Interview ID is required",
            data: null,
        });
    }

    const interview = await prisma.interview.findUnique({
        where: {
            id: interviewId,
            userId: req.user.id,
        },
        include: {
            questionAnswer: {
                select: {
                    id: true,
                    question: true,
                    answer: true,
                    QaAnalysis: true,
                },
            },
            codeAnalysis: {
                include: {
                    codeProblem: true,
                },
            },
            resumeAnalysis: true,
            interviewCodeProblems: {
                select: {
                    codeProblem: {
                        include: {
                            submissions: {
                                where: {
                                    interviewId: interviewId,
                                    success: true,
                                },
                                orderBy: {
                                    execTime: "asc",
                                },
                                take: 1,
                            },
                        },
                    },
                    codeProblemId: true,
                },
            },
        },
    });

    if (!interview) {
        return res.status(404).json({
            success: false,
            message: "Interview not found",
            data: null,
        });
    }

    return res.json({
        success: true,
        message: "Interview retrieved",
        data: { interview },
    });
};

const submitQaHandler = async (req, res) => {
    const { interviewId } = req.params;
    const { questionId, answer } = req.body;
    if (!interviewId || !questionId || !answer) {
        console.log(interviewId, questionId, answer);
        return res.status(400).json({
            success: false,
            message: "All fields are required",
            data: null,
        });
    }
    const question = await prisma.questionAnswer.findUnique({
        where: {
            id: questionId,
            interviewId: interviewId,
            interview: {
                userId: req.user.id,
            },
        },
    });

    if (!question) {
        return res.status(404).json({
            success: false,
            message: "Question not found",
            data: null,
        });
    }

    if (question.answer != null) {
        console.log(question);
        return res.status(400).json({
            success: false,
            message: "Answer already submitted",
            data: null,
        });
    }

    const updatedQuestion = await prisma.questionAnswer.update({
        where: {
            id: questionId,
        },
        data: {
            answer,
        },
    });
    console.log(updatedQuestion);

    res.json({
        success: true,
        message: "Answer submitted successfully",
        data: null,
    });
};

const endInterviewHandler = async (req, res) => {
    const { interviewId } = req.params;

    if (!interviewId) {
        return res.status(400).json({
            success: false,
            message: "Interview ID is required",
            data: null,
        });
    }

    const interview = await prisma.interview.findUnique({
        where: {
            id: interviewId,
            userId: req.user.id,
        },
    });

    if (!interview) {
        return res.status(404).json({
            success: false,
            message: "Interview not found",
            data: null,
        });
    }

    // if (interview.hasEnded) {
    //     return res.status(400).json({
    //         success: false,
    //         message: "Interview has already ended",
    //         data: null,
    //     });
    // }

    sendQueueMessage("end-interview", JSON.stringify({ interviewId }));
    await prisma.interview.update({
        where: {
            id: interviewId,
        },
        data: {
            hasEnded: true,
        },
    });

    return res.json({
        success: true,
        message: "Interview ended successfully",
        data: null,
    });
};

export {
    newInterviewHandler,
    getInterviewStatusHandler,
    getInterviewHandler,
    submitQaHandler,
    endInterviewHandler,
};
