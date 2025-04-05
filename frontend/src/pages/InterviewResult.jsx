import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

// Import Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AuthContext from "@/providers/auth-context";
import Markdown from "react-markdown";

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
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-4">
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

    if (!interview || !interview.resumeAnalysis) {
        return (
            <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-4">
                <Alert variant="warning" className="max-w-2xl">
                    <AlertTitle>No Data</AlertTitle>
                    <AlertDescription>
                        No resume analysis data is available for this interview.
                    </AlertDescription>
                </Alert>
                <Button onClick={() => navigate(-1)} variant="default">
                    Go Back
                </Button>
            </div>
        );
    }

    const { resumeAnalysis } = interview;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Interview Results</h1>

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
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Resume Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="prose min-w-full">
                        <Markdown>{resumeAnalysis.analysis}</Markdown>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default InterviewResult;
