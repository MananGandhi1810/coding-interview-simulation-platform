import { PrismaClient } from "@prisma/client";
import fs from "fs";
const prisma = new PrismaClient();

async function main() {
    try {
        const rawData = fs.readFileSync("prisma/data.json", "utf8");
        const challenges = JSON.parse(rawData);

        console.log(`Found ${challenges.length} challenges to seed...`);

        for (const challenge of challenges) {
            const seededChallenge = await prisma.codeProblem.create({
                data: {
                    title: challenge.title,
                    description: challenge.description,
                    difficulty: challenge.difficulty.toUpperCase(),
                    testCases: {
                        create: challenge.testCase.map((tc) => ({
                            hidden: tc.hidden,
                            input: tc.input,
                            output: tc.output,
                        })),
                    },
                },
            });

            console.log(`Seeded challenge: ${seededChallenge.title}`);
        }
    } catch (error) {
        console.error("Error seeding data:", error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
