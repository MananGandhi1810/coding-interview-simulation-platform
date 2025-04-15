import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "@/providers/auth-context";
import axios from "axios";
import { ArrowRight, CircleCheck, Loader2, Mic, MicOff } from "lucide-react";
import NoPageFound from "./404";
import Webcam from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function Interview() {
    const location = useLocation();
    const { interviewId } = location.state || {};
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [interview, setInterview] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [userResponses, setUserResponses] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

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
            toast({
                title: "Microphone Error",
                description: error,
                variant: "destructive",
            });
        }
    }, [error, toast]);

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

    const submitAnswer = async (answer, isLast = false) => {
        if (!answer || answer.trim() === "" || !interview) return;

        setIsSubmitting(true);

        try {
            const currentQuestion =
                interview.questionAnswer[questionIndex - (isLast ? 0 : 1)];
            console.log(
                currentQuestion,
                interview.questionAnswer,
                questionIndex,
                questionIndex - 1,
            );
            const response = await axios
                .post(
                    `${process.env.SERVER_URL}/interview/submitQa/${interviewId}`,
                    {
                        questionId: currentQuestion.id,
                        answer: answer,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                        validateStatus: false,
                    },
                )
                .then((res) => res.data);

            if (!response.success) {
                toast({
                    title: "Error",
                    description: response.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Success",
                    description: "Answer submitted successfully",
                });
            }
        } catch (error) {
            console.error("Error submitting answer:", error);
            toast({
                title: "Error",
                description: "Failed to submit answer",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (questionIndex === 0) return;
        console.log("questionIndex changed: " + questionIndex);

        const lastResponse = results.map((x) => x.transcript).join("");
        if (lastResponse.trim() !== "") {
            setUserResponses((r) => [...r, lastResponse]);
            submitAnswer(lastResponse);
        }

        setResults([]);
    }, [questionIndex]);

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
                    {errorMessage || "Interview not found"}
                </h1>
            </div>
        );
    }

    const handleNext = () => {
        if (isRecording) {
            stopSpeechToText();
        }

        if (questionIndex < interview.questionAnswer.length - 1) {
            setQuestionIndex((i) => i + 1);
        } else {
            const lastResponse = results.map((x) => x.transcript).join("");
            if (lastResponse.trim() !== "") {
                setUserResponses((r) => [...r, lastResponse]);
                submitAnswer(lastResponse, true);
            }
            navigate("/code-interview", { state: { interviewId } });
        }
    };

    const toggleMicrophone = () => {
        if (isRecording) {
            stopSpeechToText();
        } else {
            setResults([]);
            startSpeechToText();
        }
    };

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
                                onClick={toggleMicrophone}
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
                        <div className="items-center py-4 w-full">
                            {isRecording && (
                                <div className="mb-2 text-sm text-red-500">
                                    Recording...
                                </div>
                            )}
                            <div className="border p-3 rounded-lg min-h-24 w-full">
                                {results.map((result) => (
                                    <span key={result.timestamp}>
                                        {result.transcript}{" "}
                                    </span>
                                ))}
                                {interimResult && (
                                    <span className="text-gray-400">
                                        {interimResult}
                                    </span>
                                )}
                            </div>
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
                            onClick={handleNext}
                            className="mt-2 px-5 self-end"
                            disabled={isSubmitting || results.length === 0}
                        >
                            {questionIndex <
                            interview.questionAnswer.length - 1 ? (
                                <>
                                    Next{" "}
                                    <ArrowRight className="ml-2" size={20} />
                                </>
                            ) : (
                                <>
                                    Go to Code Interview{" "}
                                    <CircleCheck className="ml-2" size={20} />
                                </>
                            )}
                            {isSubmitting && (
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Interview;
