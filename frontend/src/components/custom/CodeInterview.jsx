import React, { useContext, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";
import AuthContext from "@/providers/auth-context";
import Code from "./Code";

function CodeInterviewPage({ interviewId }) {
    const { user } = useContext(AuthContext);
    const [interview, setInterview] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [problemStatements, setProblemStatements] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
    const [code, setCode] = useState({});

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

    return (
        <div className="flex h-full w-full">
            <div className="bg-gray-100 border-r border-gray-200">
                <ul>
                    {problemIds.map((problemId, index) => (
                        <li
                            key={problemId}
                            className={`px-2 text-lg cursor-pointer hover:bg-gray-200 rounded-lg text-center m-2 ${
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

export default CodeInterviewPage;
