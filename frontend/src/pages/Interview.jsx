import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AuthContext from "@/providers/auth-context";
import axios from "axios";
import { ArrowRight, Loader2, Mic, MicOff } from "lucide-react";
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
    const [questionIndex, setQuestionIndex] = useState(0);
    const [userResponses, setUserResponses] = useState([]);
    const {
        error,
        interimResult,
        isRecording,
        results,
        startSpeechToText,
        stopSpeechToText,
        setResults,
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
        if (questionIndex == 0) return;
        setUserResponses((r) => [
            ...r,
            results.map((x) => x.transcript).join(""),
        ]);
    }, [questionIndex]);

    useEffect(() => {
        console.log(userResponses);
        setResults([]);
    }, [userResponses]);

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
                        <div className="border rounded-lg w-full relative">
                            <Webcam
                                audio={false}
                                className="w-full aspect-video object-cover"
                            />
                            <div
                                className="absolute bottom-4 right-4 p-3 rounded-full bg-white/80 backdrop-blur-sm cursor-pointer hover:bg-white/90 transition-colors"
                                onClick={
                                    isRecording
                                        ? stopSpeechToText
                                        : startSpeechToText
                                }
                            >
                                {isRecording ? (
                                    <Mic
                                        className="h-6 w-6 text-red-500"
                                        fill="rgba(239, 68, 68, 0.2)"
                                    />
                                ) : (
                                    <MicOff className="h-6 w-6" />
                                )}
                            </div>
                        </div>
                        <div className="items-center py-4">
                            {results.map((result) => {
                                return (
                                    <span key={result.timestamp}>
                                        {result.transcript}{" "}
                                    </span>
                                );
                            })}
                            {interimResult && (
                                <span className="text-center">
                                    {interimResult}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                        <div className="space-y-4 w-full">
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-medium">
                                    Question {questionIndex + 1}
                                </h3>
                                <p className="mt-2">
                                    {
                                        interview.questionAnswer[questionIndex]
                                            .question
                                    }
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                setQuestionIndex((i) => i + 1);
                            }}
                            className="mt-2 px-5 self-end"
                            disabled={
                                questionIndex >=
                                    interview.questionAnswer.length - 1 ||
                                results.length == 0
                            }
                        >
                            Next <ArrowRight className="ml-2" size={20} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Interview;
