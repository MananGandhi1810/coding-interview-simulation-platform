import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Markdown from "react-markdown";

function ResumeTab({ resumeAnalysis }) {
    if (!resumeAnalysis) {
        return (
            <Alert>
                <AlertTitle>No Resume Analysis</AlertTitle>
                <AlertDescription>
                    No resume analysis is available for this interview.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resume Analysis</CardTitle>
                {resumeAnalysis.rating && (
                    <div className="mt-2">
                        <Badge variant="outline">
                            Rating: {resumeAnalysis.rating}/10
                        </Badge>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="prose dark:prose-invert min-w-full">
                    <Markdown>{resumeAnalysis.analysis}</Markdown>
                </div>
            </CardContent>
        </Card>
    );
}

export default ResumeTab;
