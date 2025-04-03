import { createDockerContainer } from "../utils/docker.js";
import { PrismaClient } from "@prisma/client";
import { get, set } from "../utils/keyvalue-db.js";

const prisma = new PrismaClient();

const executeCode = async (message, channel) => {
    const {
        code,
        language,
        submissionId,
        problemStatementId,
        temp,
        testcase,
        containsTestCase,
        interviewId,
    } = JSON.parse(message);
    if (
        code == "" ||
        language == "" ||
        submissionId == "" ||
        problemStatementId == "" ||
        code.trim() == "" ||
        language.trim() == "" ||
        (submissionId.trim() == "" && !temp) ||
        problemStatementId.trim() == ""
    ) {
        return;
    }
    const problemStatement = await prisma.codeProblem.findUnique({
        where: { id: problemStatementId },
        include: {
            testCases: temp
                ? {
                      where: {
                          hidden: false,
                      },
                  }
                : true,
        },
    });
    if (!problemStatement) {
        return;
    }
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            user: true,
        },
    });
    if (!submission && !temp) {
        return;
    }
    var testCases;
    if (containsTestCase && temp) {
        testCases = [{ input: testcase }];
    } else {
        testCases = problemStatement.testCases;
    }
    const container = await createDockerContainer(
        language,
        code,
        testCases.map((testCase) => testCase.input),
    );
    await container.start();
    var didTLE = false;
    var didRun = false;
    const tle = new Promise((resolve, reject) => {
        setTimeout(
            async () => {
                if (didRun) {
                    return;
                }
                resolve();
                didTLE = true;
                const result = {
                    status: "TimeLimitExceeded",
                    success: false,
                };
                if (temp) {
                    const prevData = JSON.parse(
                        await get(`temp-${submissionId}`),
                    );
                    await set(
                        `temp-${submissionId}`,
                        JSON.stringify({ ...prevData, ...result }),
                        60 * 5,
                    );
                } else {
                    await prisma.submission.update({
                        where: { id: submissionId },
                        data: {
                            status: "TimeLimitExceeded",
                            success: false,
                        },
                    });
                }
                try {
                    await container.kill();
                    await container.remove();
                } catch (e) {}
            },
            language == "java" ? process.env.TLE + 2000 : process.env.TLE,
        );
    });
    const wait = new Promise(async (resolve, reject) => {
        await container.wait();
        didRun = true;
        resolve();
    });
    await Promise.race([tle, wait]);
    if (didTLE) {
        return;
    }
    var rawLogs = String(await container.logs({ stdout: true, stderr: true }));
    var logs = rawLogs
        .replace(/\r?\n|\r/g, "")
        .normalize()
        .toLowerCase();
    var ms = parseInt(logs.split("---").at(-1)).toFixed(0);
    if (String(ms) == String(NaN)) {
        ms = null;
    }
    if (ms) {
        logs = logs.split("---").slice(0, -1).join("---") + "---";
        rawLogs = rawLogs.split("---").slice(0, -1).join("---") + "---";
        console.log(`Executed ${submissionId} in ${ms}ms`);
    } else {
        console.log(`Executed ${submissionId}`);
    }
    var correctResult = false;
    try {
        const outputResults = logs.split("---").filter((o) => o.trim() !== "");
        const passedTests = outputResults
            .map(
                (output, idx) =>
                    output.toLowerCase() ===
                    testCases[idx].output
                        .replace(/\r?\n|\r/g, "")
                        .normalize()
                        .toLowerCase(),
            )
            .filter((result) => result);

        const result = {
            interviewId,
            output: rawLogs,
            status: "Executed",
            execTime: ms ? parseInt(ms) : null,
            passedTestCases: passedTests.length,
        };

        if (temp) {
            const prevData = JSON.parse(await get(`temp-${submissionId}`));
            result.output = result.output.split("---");
            result.output = result.output.filter(
                (o) => o.trim().normalize() != "",
            );
            await set(
                `temp-${submissionId}`,
                JSON.stringify({ ...prevData, ...result }),
                60 * 5,
            );
        } else {
            correctResult = passedTests.length === testCases.length;
            result.success = correctResult;
            await prisma.submission.update({
                where: { id: submissionId },
                data: result,
            });
        }
    } catch (e) {
        console.log(e);
    }
    try {
        await container.remove();
    } catch (e) {}
};

export { executeCode };
