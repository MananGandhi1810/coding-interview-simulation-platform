import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AuthContext from "@/providers/auth-context";
import ResumeTab from "@/components/custom/ResumeTab";
import QuestionsTab from "@/components/custom/QuestionsTab";
import CodingTab from "@/components/custom/CodingTab";

function InterviewResult() {
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    const { interviewId } = location.state || {};
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchInterviewData = async () => {
        try {
            const response = await axios.get(
                `${process.env.SERVER_URL}/interview/${interviewId}`,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                },
            );
            if (response.data.success) {
                setInterview(response.data.data.interview);
            } else {
                setError(
                    response.data.message || "Failed to fetch interview data",
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "An error occurred while fetching the data",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (interviewId) {
            fetchInterviewData();
        } else {
            setError("Interview ID is required");
            setLoading(false);
        }
    }, [interviewId]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-4">
                <Card className="w-full max-w-3xl">
                    <CardContent className="space-y-4 p-6">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-4">
                <Alert variant="destructive" className="max-w-2xl">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={() => navigate(-1)} variant="default">
                    Go Back
                </Button>
            </div>
        );
    }

    if (!interview) {
        return (
            <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-4">
                <Alert variant="warning" className="max-w-2xl">
                    <AlertTitle>No Data</AlertTitle>
                    <AlertDescription>
                        No data is available for this interview.
                    </AlertDescription>
                </Alert>
                <Button onClick={() => navigate(-1)} variant="default">
                    Go Back
                </Button>
            </div>
        );
    }

    const {
        resumeAnalysis,
        questionAnswer = [],
        codeAnalysis = [],
        interviewCodeProblems = [],
    } = interview;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Interview Results</h1>
                <Button onClick={() => navigate("/")} variant="outline">
                    Back to Home
                </Button>
            </div>

            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">
                                {interview.role} at {interview.company}
                            </h2>
                            <p className="text-muted-foreground">
                                Experience: {interview.yoe} years
                            </p>
                            <div className="mt-2">
                                <Badge
                                    variant={
                                        interview.state === "PROCESSED"
                                            ? "success"
                                            : "secondary"
                                    }
                                >
                                    {interview.state}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                                Completed on:{" "}
                                {new Date(
                                    interview.updatedAt,
                                ).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="resume" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="resume">Resume Analysis</TabsTrigger>
                    <TabsTrigger value="questions">
                        Interview Questions
                    </TabsTrigger>
                    {interviewCodeProblems?.length > 0 && (
                        <TabsTrigger value="coding">
                            Coding Problems
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="resume">
                    <ResumeTab resumeAnalysis={resumeAnalysis} />
                </TabsContent>

                <TabsContent value="questions">
                    <QuestionsTab questionAnswers={questionAnswer} />
                </TabsContent>

                {interviewCodeProblems?.length > 0 && (
                    <TabsContent value="coding">
                        <CodingTab
                            codeProblems={interviewCodeProblems}
                            codeAnalysis={codeAnalysis}
                        />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

export default InterviewResult;
