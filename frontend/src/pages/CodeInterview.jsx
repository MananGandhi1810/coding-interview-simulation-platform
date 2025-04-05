import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import NoPageFound from "./404";
import { Loader2, SquareChevronRight } from "lucide-react";
import axios from "axios";
import AuthContext from "@/providers/auth-context";
import Code from "../components/custom/Code";
import { Button } from "@/components/ui/button";

function CodeInterview() {
    const location = useLocation();
    const { interviewId } = location.state || {};
    const { user } = useContext(AuthContext);
    const [interview, setInterview] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [problemStatements, setProblemStatements] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
    const [code, setCode] = useState({});
    const navigate = useNavigate();

    const fetchCodeProblem = async (problemStatementId) => {
        try {
            const result = await axios
                .get(
                    `${process.env.SERVER_URL}/problem-statement/${problemStatementId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    },
                )
                .then((res) => res.data);
            return result.data.problemStatement;
        } catch (e) {
            setErrorMessage("Failed to load problem statement");
        }
    };

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
            setErrorMessage("Failed to load interview");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllProblems = async () => {
        const problemMap = {};
        const problemPromises = interview.interviewCodeProblems.map(
            async (e) => {
                const problemStatement = await fetchCodeProblem(
                    e.codeProblemId,
                );
                return { id: e.codeProblemId, problemStatement };
            },
        );

        const resolvedProblems = await Promise.all(problemPromises);

        resolvedProblems.forEach(({ id, problemStatement }) => {
            problemMap[id] = problemStatement;
        });
        setProblemStatements(problemMap);
    };

    useEffect(() => {
        fetchInterview();
    }, []);

    useEffect(() => {
        if (interview == null || interview == undefined) {
            return;
        }

        fetchAllProblems();
    }, [interview]);

    useEffect(() => {
        if (Object.keys(problemStatements).length > 0) {
            const initialCode = {};
            Object.keys(problemStatements).forEach((problemId) => {
                initialCode[problemId] = ""; // You can set initial code here if needed
            });
            setCode(initialCode);
        }
    }, [problemStatements]);

    if (!interviewId) {
        return <NoPageFound />;
    }

    if (loading) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center h-full-w-nav">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading interview...</p>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center h-full-w-nav">
                <h1 className="text-2xl font-bold text-red-500">
                    {errorMessage}
                </h1>
            </div>
        );
    }

    const problemIds = Object.keys(problemStatements);
    const selectedProblemId = problemIds[selectedProblemIndex];

    const handleCodeChange = (problemId, newCode) => {
        setCode((prevCode) => ({
            ...prevCode,
            [problemId]: newCode,
        }));
    };

    const endInterview = async () => {
        try {
            const result = await axios
                .post(
                    `${process.env.SERVER_URL}/interview/end/${interviewId}`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                        validateStatus: false,
                    },
                )
                .then((res) => res.data);
            if (!result.success) {
                setErrorMessage("Could not end interview");
            }
            navigate("/interview-result", { state: { interviewId } });
        } catch (e) {
            setErrorMessage("Could not end interview");
        }
    };

    return (
        <div className="flex h-full-w-nav w-full">
            <div className="bg-gray-100 border-r border-gray-200 flex flex-col">
                <ul className="flex-1">
                    {problemIds.map((problemId, index) => (
                        <li
                            key={problemId}
                            className={`px-3 py-1 text-lg cursor-pointer hover:bg-gray-200 rounded-md text-center m-2 ${
                                index === selectedProblemIndex
                                    ? "bg-gray-200 font-semibold"
                                    : ""
                            }`}
                            onClick={() => setSelectedProblemIndex(index)}
                        >
                            {index + 1}
                        </li>
                    ))}
                </ul>
                <Button
                    onClick={endInterview}
                    variant="ghost"
                    className="m-2 px-3 py-1 bg-transparent hover:bg-gray-200"
                >
                    <SquareChevronRight />
                </Button>
            </div>

            <div className="flex-1">
                {selectedProblemId && (
                    <Code
                        problemStatement={problemStatements[selectedProblemId]}
                        problemId={selectedProblemId}
                        code={code[selectedProblemId] || ""}
                        setCode={(newCode) =>
                            handleCodeChange(selectedProblemId, newCode)
                        }
                        interviewId={interviewId}
                    />
                )}
            </div>
        </div>
    );
}

export default CodeInterview;
