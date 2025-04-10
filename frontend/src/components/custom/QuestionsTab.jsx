import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";

function QuestionsTab({ questionAnswers = [] }) {
    const [expandedFeedback, setExpandedFeedback] = useState({});

    const toggleFeedback = (questionId) => {
        setExpandedFeedback((prev) => ({
            ...prev,
            [questionId]: !prev[questionId],
        }));
    };

    if (!questionAnswers || questionAnswers.length === 0) {
        return (
            <Alert>
                <AlertTitle>No Questions</AlertTitle>
                <AlertDescription>
                    No interview questions were found for this interview.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {questionAnswers.map((qa, index) => {
                console.log(qa);
                return (
                    <Card key={qa.id}>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Question {index + 1}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Question:
                                </h3>
                                <p>{qa.question}</p>
                            </div>
                            {qa.answer && (
                                <div>
                                    <h3 className="font-semibold mb-2">
                                        Your Answer:
                                    </h3>
                                    <p>{qa.answer}</p>
                                </div>
                            )}
                            {qa.QaAnalysis && qa.QaAnalysis.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold">
                                            Feedback:
                                        </h3>
                                        {qa.QaAnalysis.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    toggleFeedback(qa.id)
                                                }
                                            >
                                                {expandedFeedback[qa.id]
                                                    ? "Show Latest Feedback"
                                                    : `Show All Feedback (${qa.QaAnalysis.length})`}
                                            </Button>
                                        )}
                                    </div>

                                    {!expandedFeedback[qa.id] ? (
                                        <div className="rounded-md border p-3 bg-muted/30">
                                            <p className="mb-2 font-medium">
                                                Assessment:{" "}
                                                <Badge
                                                    variant={
                                                        qa.QaAnalysis[0]
                                                            .correctness ===
                                                        "correct"
                                                            ? "success"
                                                            : "destructive"
                                                    }
                                                >
                                                    {
                                                        qa.QaAnalysis[0]
                                                            .correctness
                                                    }
                                                </Badge>
                                            </p>
                                            <div className="prose dark:prose-invert min-w-full">
                                                <Markdown>
                                                    {
                                                        qa.QaAnalysis[0]
                                                            .explanation
                                                    }
                                                </Markdown>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {qa.QaAnalysis.map(
                                                (analysis, analysisIndex) => (
                                                    <div
                                                        key={analysis.id}
                                                        className="rounded-md border p-3 bg-muted/30"
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <p className="font-medium">
                                                                Assessment{" "}
                                                                {analysisIndex +
                                                                    1}
                                                                :{" "}
                                                                <Badge
                                                                    variant={
                                                                        analysis.correctness ===
                                                                        "correct"
                                                                            ? "success"
                                                                            : "destructive"
                                                                    }
                                                                >
                                                                    {
                                                                        analysis.correctness
                                                                    }
                                                                </Badge>
                                                            </p>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(
                                                                    analysis.createdAt,
                                                                ).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="prose dark:prose-invert min-w-full">
                                                            <Markdown>
                                                                {
                                                                    analysis.explanation
                                                                }
                                                            </Markdown>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

export default QuestionsTab;
