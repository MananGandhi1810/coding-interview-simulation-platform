import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getProblemStatementByIdHandler = async (req, res) => {
    const { problemStatementId } = req.params;
    if (!problemStatementId) {
        return res.status(400).json({
            success: false,
            message: "Problem Statement Id is required",
            data: null,
        });
    }
    const { withHidden } = req.query;
    var problemStatement = await prisma.codeProblem.findUnique({
        where: { id: problemStatementId },
        include: {
            testCases:
                withHidden && req.user.admin
                    ? true
                    : {
                          where: { hidden: false },
                      },
        },
    });
    if (!problemStatement) {
        return res.status(404).json({
            success: false,
            message: "Problem Statement not found",
            data: null,
        });
    }
    res.json({
        success: true,
        message: "Fetched problem statement",
        data: { problemStatement },
    });
};

export { getProblemStatementByIdHandler };
