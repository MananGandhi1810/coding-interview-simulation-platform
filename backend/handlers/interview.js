import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const newInterviewHandler = async (req, res) => {
    console.log(req.body);
    res.json({
        success: true,
        message: "New Interview Created",
        data: null,
    });
};

export { newInterviewHandler };
