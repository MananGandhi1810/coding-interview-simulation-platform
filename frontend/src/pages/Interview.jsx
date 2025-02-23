import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AuthContext from "@/providers/auth-context";
import axios from "axios";
import { Loader2 } from "lucide-react";
import NoPageFound from "./404";
import Webcam from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { Button } from "@/components/ui/button";

function Interview() {
    const location = useLocation();
    const { interviewId } = location.state || {};
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [interview, setInterview] = useState(null);
    const {
        error,
        interimResult,
        isRecording,
        results,
        startSpeechToText,
        stopSpeechToText,
    } = useSpeechToText({
        continuous: true,
        useLegacyResults: false,
    });

    if (!interviewId) {
        return <NoPageFound />;
    }

    useEffect(() => {
        if (error) {
            setErrorMessage(error);
        }
    }, []);

    useEffect(() => {
        console.log(results);
    }, [results]);

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
                setInterview(result.data.interview);
            } catch (e) {
                setErrorMessage("Failed to load interview");
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

    if (errorMessage || !interview) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center h-full-w-nav">
                <h1 className="text-2xl font-bold text-red-500">
                    {errorMessage}
                </h1>
            </div>
        );
    }

    return (
        <div className="w-full p-4">
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

                <div className="w-full flex flex-col lg:flex-row gap-10">
                    <div className="overflow-hidden flex-1 flex items-center flex-col">
                        <div className="border rounded-lg w-full">
                            <Webcam
                                audio={false}
                                className="w-full aspect-video object-cover"
                            />
                        </div>
                        <div className="flex items-center flex-col py-4">
                            <Button
                                onClick={
                                    isRecording
                                        ? stopSpeechToText
                                        : startSpeechToText
                                }
                            >
                                {isRecording
                                    ? "Stop Answering"
                                    : "Start Answering"}
                            </Button>
                            {results.map((result) => {
                                console.log(result);
                                return (
                                    <span key={result.timestamp}>
                                        {result.transcript}{" "}
                                    </span>
                                );
                            })}
                            {interimResult && <span>{interimResult}</span>}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
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
