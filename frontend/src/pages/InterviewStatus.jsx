import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "@/providers/auth-context";
import axios from "axios";
import { Loader2 } from "lucide-react";
import NoPageFound from "./404";

function InterviewStatus() {
    const location = useLocation();
    const { interviewId } = location.state;
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    if (!interviewId) {
        return <NoPageFound />;
    }

    useEffect(() => {
        let interval;

        const pollStatus = async () => {
            try {
                const result = await axios
                    .get(
                        `${process.env.SERVER_URL}/interview/${interviewId}/status`,
                        {
                            headers: {
                                Authorization: `Bearer ${user.token}`,
                            },
                        },
                    )
                    .then((res) => res.data);

                if (result.data.state === "PROCESSED") {
                    clearInterval(interval);
                    navigate(`/code-interview`, { state: { interviewId } });
                } else if (result.data.state === "ERROR") {
                    clearInterval(interval);
                    setError("An error occurred while processing your resume");
                }
            } catch (e) {
                clearInterval(interval);
                setError("Failed to get interview status");
            }
        };

        if (!error) {
            interval = setInterval(pollStatus, 2000);
        }

        return () => clearInterval(interval);
    }, [interviewId, user.token, navigate, error]);

    if (error) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center h-full-w-nav">
                <h1 className="text-2xl font-bold text-red-500">{error}</h1>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 flex flex-col items-center justify-center h-full-w-nav">
            <Loader2 className="h-8 w-8 animate-spin" />
            <h1 className="text-2xl font-bold mt-4">
                Analyzing your resume...
            </h1>
            <p className="text-gray-500 mt-2">
                Please wait while we prepare your interview
            </p>
        </div>
    );
}

export default InterviewStatus;
