import { Button } from "@/components/ui/button";
import React, { useCallback, useContext, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import AuthContext from "@/providers/auth-context";

function StartInterview() {
    const [file, setFile] = useState(null);
    const [jobRole, setJobRole] = useState("");
    const [yoe, setYoe] = useState("");
    const { user, setUser } = useContext(AuthContext);

    const onDrop = useCallback((acceptedFiles) => {
        const pdfFile = acceptedFiles[0];
        if (pdfFile?.type === "application/pdf") {
            setFile(pdfFile);
        } else {
            alert("Please upload a PDF file");
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
        },
        multiple: false,
    });

    const submit = async (e) => {
        e.preventDefault();
        const data = {
            jobRole,
            yoe,
            file,
        };
        console.log(data);
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
    };

    return (
        <form onSubmit={submit}>
            <div className="container mx-auto p-4 flex md:flex-row flex-col w-full h-full-w-nav align-middle items-center justify-center">
                <div className="md:flex-1 md:h-full flex flex-col items-center justify-center p-10 w-full h-full">
                    <h1 className="text-2xl font-bold mb-6">
                        Upload Your Resume
                    </h1>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg text-center cursor-pointer md:h-1/2 h-full flex flex-col items-center justify-center w-full
                    ${
                        isDragActive
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300"
                    }`}
                    >
                        <input {...getInputProps()} />
                        <p className="text-gray-600">
                            {isDragActive
                                ? "Drop the PDF here"
                                : "Drag & drop a PDF file here, or click to select"}
                        </p>
                        {file && (
                            <p className="mt-2 text-green-600">
                                Selected file: {file.name}
                            </p>
                        )}
                    </div>
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
                    <Button
                        className="mt-4 gap-2"
                        type="submit"
                        onClick={submit}
                        disabled={!file || !jobRole || !yoe}
                    >
                        Start Interview <ArrowRight />
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default StartInterview;
