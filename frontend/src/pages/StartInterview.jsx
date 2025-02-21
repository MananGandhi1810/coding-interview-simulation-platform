import { Button } from "@/components/ui/button";
import React, { useContext, useState } from "react";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import AuthContext from "@/providers/auth-context";
import { UploadResumeDropzone } from "@/components/custom/UploadResume.jsx";
import { useNavigate } from "react-router-dom";

function StartInterview() {
    const navigate = useNavigate();
    const [jobRole, setJobRole] = useState("");
    const [yoe, setYoe] = useState("");
    const [company, setCompany] = useState("");
    const { user } = useContext(AuthContext);
    const [resumeUrl, setresumeUrl] = useState(null);
    const [driveLink, setDriveLink] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        const finalResume = resumeUrl || driveLink;
        const data = {
            jobRole,
            yoe,
            company,
            resumeUrl: finalResume,
        };

        try {
            const result = await axios
                .post(`${process.env.SERVER_URL}/interview/new`, data, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                })
                .then((res) => res.data);
            console.log(result);

            toast({
                title: "Details submitted",
                description: "Interview starting soon, please wait...",
            });

            navigate(`/interview-status`, {
                state: { interviewId: result.data.interview.id },
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to start interview",
            });
        }
    };

    return (
        <form onSubmit={submit}>
            <div className="container mx-auto p-4 flex md:flex-row flex-col w-full h-full-w-nav align-middle items-center justify-center">
                <div className="md:flex-1 md:h-full flex flex-col items-center justify-center p-10 w-full h-full">
                    <h1 className="text-2xl font-bold mb-6">
                        Upload Your Resume
                    </h1>
                    <UploadResumeDropzone
                        disabled={resumeUrl != null || driveLink.trim() != ""}
                        className="border-2 border-dashed rounded-lg text-center cursor-pointer md:h-1/2 h-full flex flex-col items-center justify-center w-full"
                        appearance={{ button: { color: "GrayText" } }}
                        endpoint="resumeUploader"
                        headers={{
                            Authorization: `Bearer ${user.token}`,
                        }}
                        content={{
                            button: ({ ready, isUploading }) => {
                                if (resumeUrl != null) return "Resume Uploaded";
                                if (!ready) return "Preparing Upload";
                                if (isUploading) return "Uploading...";
                                return "Upload Resume";
                            },
                            label: ({ ready, isUploading }) => {
                                if (resumeUrl != null) return "Resume Uploaded";
                                if (!ready) return "Preparing Upload";
                                if (isUploading) return "Uploading...";
                                return "Select Resume";
                            },
                        }}
                        config={{ mode: "auto" }}
                        onClientUploadComplete={(res) => {
                            console.log("File: ", res[0]);
                            setresumeUrl(res[0].ufsUrl);
                        }}
                        onUploadError={(error) => {
                            console.log(`ERROR! ${error.message}`);
                            toast({
                                title: "Error",
                                description: "Could not upload file",
                            });
                        }}
                    />
                    <h2 className="text-xl font-semibold my-4">
                        Or Paste Drive Link
                    </h2>
                    <Input
                        placeholder="Paste your Drive link"
                        value={driveLink}
                        disabled={!!resumeUrl}
                        onChange={(e) => setDriveLink(e.target.value)}
                        className="w-full"
                    />
                </div>
                <Separator className="md:h-full md:w-[1px] h-[1px] w-full" />
                <div className="md:flex-1 flex flex-col items-center justify-center p-10 w-full">
                    <h1 className="text-2xl font-bold mb-6">
                        Enter your details
                    </h1>
                    <Input
                        placeholder="Job Role"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        className="mt-4 w-full"
                    />
                    <Input
                        placeholder="Years of Experience"
                        type="number"
                        value={yoe}
                        onChange={(e) => setYoe(e.target.value)}
                        className="mt-4 w-full"
                    />
                    <Input
                        placeholder="Company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="mt-4 w-full"
                    />
                    <Button
                        className="mt-4 gap-2"
                        type="submit"
                        onClick={submit}
                        disabled={
                            (!resumeUrl && driveLink === "") ||
                            !jobRole ||
                            !yoe ||
                            !company
                        }
                    >
                        Start Interview <ArrowRight />
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default StartInterview;
