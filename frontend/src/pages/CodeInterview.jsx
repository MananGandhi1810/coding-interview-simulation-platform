import React from "react";
import { useLocation } from "react-router";
import CodeInterviewPage from "../components/custom/CodeInterview";
import NoPageFound from "./404";

function CodeInterview() {
    const location = useLocation();
    const { interviewId } = location.state || {};

    if (!interviewId) {
        return <NoPageFound />;
    }

    return <CodeInterviewPage interviewId={interviewId} />;
}

export default CodeInterview;
