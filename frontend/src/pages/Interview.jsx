import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "@/providers/auth-context";
import axios from "axios";
import { Loader2 } from "lucide-react";
import NoPageFound from "./404";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Markdown from "react-markdown";

function Interview() {
    const location = useLocation();
    const { interviewId } = location.state || {};
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [interview, setInterview] = useState(null);

    if (!interviewId) {
        return <NoPageFound />;
    }

    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const result = await axios
                    .get(`${process.env.SERVER_URL}/interview/${interviewId}`, {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    })
                    .then((res) => res.data);
                console.log(result);
                setInterview(result.data.interview);
            } catch (e) {
                setError("Failed to load interview");
            } finally {
                setLoading(false);
            }
        };

        fetchInterview();
    }, [interviewId, user.token]);

    if (loading) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center h-full-w-nav">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading interview...</p>
            </div>
        );
    }

    if (error || !interview) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center h-full-w-nav">
                <h1 className="text-2xl font-bold text-red-500">{error}</h1>
            </div>
        );
    }

    return (
        <div className="container p-4">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold">
                        {interview.role} Interview
                    </h1>
                    <p className="text-gray-500">
                        {interview.company} • {interview.yoe} years of
                        experience
                    </p>
                </div>

                <div className="w-full flex flex-col md:flex-row gap-2">
                    <div className="flex-1">
                        <h2 className="text-2xl font-semibold mb-4">
                            Resume Analysis
                        </h2>
                        <div className="prose min-w-full">
                            <Markdown>
                                {interview.resumeAnalysis?.analysis}
                            </Markdown>
                        </div>
                        <Badge variant="outline" className="mt-2">
                            Score: {interview.resumeAnalysis?.rating}/10
                        </Badge>
                    </div>

                    <div className="flex-1">
                        <h2 className="text-2xl font-semibold mb-4">
                            Questions
                        </h2>
                        <div className="space-y-4">
                            {interview.questionAnswer.map((qa, index) => (
                                <div
                                    key={qa.id}
                                    className="p-4 border rounded-lg"
                                >
                                    <h3 className="font-medium">
                                        Question {index + 1}
                                    </h3>
                                    <p className="mt-2">{qa.question}</p>
                                    <p className="mt-2 text-gray-500">
                                        Expected Answer: {qa.expectedAnswer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Interview;
