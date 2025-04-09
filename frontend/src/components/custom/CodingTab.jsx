import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";

function CodingTab({ codeProblems = [], codeAnalysis = [] }) {
    const [expandedSections, setExpandedSections] = useState({});

    const toggleSection = (problemId, sectionType) => {
        setExpandedSections((prev) => ({
            ...prev,
            [`${problemId}-${sectionType}`]:
                !prev[`${problemId}-${sectionType}`],
        }));
    };

    return (
        <div className="space-y-6">
            {codeProblems.map((problem, index) => {
                const problemAnalysis = codeAnalysis?.find(
                    (analysis) =>
                        analysis.codeProblemId === problem.codeProblemId,
                );

                const problemId = problem.codeProblemId;
                const isStatementExpanded =
                    expandedSections[`${problemId}-statement`];
                const isCodeExpanded = expandedSections[`${problemId}-code`];

                // Get the user's code submission, if it exists
                const userSubmission =
                    problem.codeProblem.submissions &&
                    problem.codeProblem.submissions.length > 0
                        ? problem.codeProblem.submissions[0]
                        : null;

                return (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle>
                                Coding Problem {index + 1}:{" "}
                                {problem.codeProblem.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border rounded-md">
                                <div
                                    className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer"
                                    onClick={() =>
                                        toggleSection(problemId, "statement")
                                    }
                                >
                                    <h3 className="font-semibold">
                                        Problem Statement
                                    </h3>
                                    <Button variant="ghost" size="sm">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className={`transition-transform ${
                                                isStatementExpanded
                                                    ? "rotate-180"
                                                    : ""
                                            }`}
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </Button>
                                </div>
                                <div
                                    className={`p-3 transition-all ${
                                        isStatementExpanded ? "block" : "hidden"
                                    }`}
                                >
                                    <div className="prose dark:prose-invert min-w-full">
                                        <Markdown>
                                            {problem.codeProblem.description ||
                                                "No problem statement available."}
                                        </Markdown>
                                    </div>
                                </div>
                            </div>

                            <div className="border rounded-md">
                                <div
                                    className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer"
                                    onClick={() =>
                                        toggleSection(problemId, "code")
                                    }
                                >
                                    <h3 className="font-semibold">
                                        Your Code Submission
                                    </h3>
                                    <Button variant="ghost" size="sm">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className={`transition-transform ${
                                                isCodeExpanded
                                                    ? "rotate-180"
                                                    : ""
                                            }`}
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </Button>
                                </div>
                                <div
                                    className={`p-3 transition-all ${
                                        isCodeExpanded ? "block" : "hidden"
                                    }`}
                                >
                                    <pre className="bg-muted p-4 rounded-md overflow-auto">
                                        <code className="text-sm">
                                            {userSubmission
                                                ? userSubmission.code
                                                : "No code submission found."}
                                        </code>
                                    </pre>
                                    {userSubmission && (
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            <p>
                                                Language:{" "}
                                                {userSubmission.language}
                                            </p>
                                            <p>
                                                Execution Time:{" "}
                                                {userSubmission.execTime} ms
                                            </p>
                                            <p>
                                                Tests Passed:{" "}
                                                {userSubmission.passedTestCases}
                                                /{userSubmission.totalTestCases}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border rounded-md">
                                <div className="p-3 bg-muted/50">
                                    <h3 className="font-semibold">
                                        Code Analysis
                                    </h3>
                                </div>
                                <div className="p-3">
                                    {problemAnalysis ? (
                                        <div className="prose dark:prose-invert min-w-full">
                                            <Markdown>
                                                {problemAnalysis.review}
                                            </Markdown>
                                        </div>
                                    ) : (
                                        <p>
                                            No analysis available for this
                                            problem.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

export default CodingTab;
