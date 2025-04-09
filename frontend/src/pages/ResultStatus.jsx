import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import AuthContext from "@/providers/auth-context";
import { Loader2 } from "lucide-react";

function ResultStatus() {
    const [status, setStatus] = useState("PROCESSING");
    const [error, setError] = useState(null);
    const location = useLocation();
    const { interviewId } = location.state || {};
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const POLL_INTERVAL = 1000;

    useEffect(() => {
        if (!interviewId) {
            setError("Interview ID is missing");
            return;
        }

        const checkStatus = async () => {
            try {
                const response = await axios.get(
                    `${process.env.SERVER_URL}/interview/${interviewId}/status`,
                    {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    },
                );

                if (response.data.success) {
                    const { resultState } = response.data.data;
                    setStatus(resultState);

                    if (
                        resultState === "PROCESSED" ||
                        resultState === "COMPLETED"
                    ) {
                        clearInterval(statusInterval);

                        navigate("/interview-result", {
                            state: { interviewId },
                        });
                    }

                    if (resultState === "ERROR") {
                        clearInterval(statusInterval);
                        setError(
                            "An error occurred while processing your interview results.",
                        );
                    }
                } else {
                    setError(response.data.message || "Failed to fetch status");
                }
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                        "Failed to connect to server",
                );
            }
        };

        checkStatus();

        const statusInterval = setInterval(checkStatus, POLL_INTERVAL);

        return () => {
            clearInterval(statusInterval);
        };
    }, [interviewId, user.token, navigate]);

    const handleGoBack = () => {
        navigate("/");
    };

    const renderStatusMessage = () => {
        switch (status) {
            case "PROCESSING":
                return "Your interview results are being processed...";
            case "ANALYZING":
                return "Analyzing your interview responses...";
            case "PROCESSED":
            case "COMPLETED":
                return "Processing complete! Redirecting to results...";
            case "ERROR":
                return "There was an error processing your interview.";
            default:
                return "Preparing your interview results...";
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Interview Result Processing
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error ? (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <div className="text-center py-4">
                                {status !== "PROCESSED" &&
                                status !== "COMPLETED" ? (
                                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
                                ) : (
                                    <div className="text-green-500 text-2xl mb-4">
                                        ✓
                                    </div>
                                )}
                                <p className="text-lg">
                                    {renderStatusMessage()}
                                </p>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="flex justify-center mt-4">
                            <Button onClick={handleGoBack}>
                                Return to Home
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default ResultStatus;
