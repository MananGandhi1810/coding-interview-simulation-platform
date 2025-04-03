import { useState, useEffect, useContext, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable.jsx";
import { Button } from "@/components/ui/button.jsx";
import Editor from "@monaco-editor/react";
import {
    CornerUpRight,
    Edit,
    Loader2,
    Play,
    SendHorizontal,
    X,
} from "lucide-react";
import axios from "axios";
import AuthContext from "@/providers/auth-context";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";
import { useHotkeys } from "react-hotkeys-hook";
import Markdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { shikiToMonaco } from "@shikijs/monaco";
import { createHighlighter } from "shiki";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import htmlToMarkdown from "@wcj/html-to-markdown";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

function Code({ problemStatement, problemId, code, setCode, interviewId }) {
    if (problemStatement == null) {
        return (
            <div className="w-screen h-full-w-nav flex justify-center align-middle items-center">
                Could not find this problem statement
            </div>
        );
    }

    const location = useLocation();
    const { initialCodeState, initialCodeLanguage } = location.state ?? {};
    const [submitting, setSubmitting] = useState(false);
    const [running, setRunning] = useState(false);
    const { user, setUser } = useContext(AuthContext);
    const [language, setLanguage] = useState(
        () =>
            initialCodeLanguage ||
            localStorage.getItem("preferredLanguage") ||
            "python",
    );
    const supportedLanguages = {
        Python: "python",
        C: "c",
        "C++": "cpp",
        Java: "java",
    };
    const [dialogData, setDialogData] = useState({
        title: "",
        description: "",
    });
    const [showDialog, setShowDialog] = useState(false);
    const [output, setOutput] = useState(null);
    const initialCode = {
        c: "// Your code here",
        cpp: "// Your code here",
        python: "# Your code here",
        java: "// Your code here",
    };
    const [tabValue, setTabValue] = useState("testcases");
    const [customTestcase, setCustomTestcase] = useState("");
    const { toast } = useToast();
    const time = useRef(new Date().getTime());

    useEffect(() => {
        if (!Object.values(supportedLanguages).includes(language)) {
            setLanguage("python");
            return;
        }
        localStorage.setItem("preferredLanguage", language);
    }, [language]);

    const run = async (isTempRun = false) => {
        if (submitting || running) {
            return;
        }
        if (isTempRun) {
            setRunning(true);
        } else {
            setSubmitting(true);
        }
        if (isTempRun) {
            toast({
                title: "Running",
                description:
                    isTempRun &&
                    (tabValue == "custom-testcase" || tabValue == "output")
                        ? "Running with custom testcase"
                        : "Running with sample testcase",
            });
        } else {
            toast({
                title: "Submitting",
                description: "Evaluating your code",
            });
        }
        const res = await axios
            .post(
                `${process.env.SERVER_URL}/code/${
                    isTempRun ? "run" : "submit"
                }/${problemId}/${language}`,
                isTempRun &&
                    (tabValue == "custom-testcase" || tabValue == "output")
                    ? {
                          code,
                          customTestcase,
                          interviewId,
                      }
                    : {
                          code,
                          interviewId,
                      },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                    validateStatus: false,
                },
            )
            .then((res) => res.data)
            .catch((e) => {
                console.log(e);
                if (isTempRun) {
                    setRunning(false);
                } else {
                    setSubmitting(false);
                }
            });
        if (res.success) {
            await pollForResult(res.data.submissionId, isTempRun);
        } else {
            if (isTempRun) {
                setRunning(false);
            } else {
                setSubmitting(false);
            }
            setDialogData({
                title: "Error",
                description: res.message,
            });
            setShowDialog(true);
        }
    };

    useHotkeys("ctrl+'", () => run(true));
    useHotkeys("ctrl+enter", () => run(false));

    const pollForResult = async (
        submissionId,
        isTempRun = false,
        tryNo = 0,
    ) => {
        const res = await axios
            .get(
                `${process.env.SERVER_URL}/code/${
                    isTempRun ? "checkTemp" : "check"
                }/${submissionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                    validateStatus: false,
                },
            )
            .then((res) => res.data);
        if (res.success) {
            if (isTempRun) {
                setRunning(false);
            } else {
                setSubmitting(false);
            }
            if (res.data.success) {
                if (!isTempRun) {
                    setDialogData({
                        title: "Success",
                        description: `All testcases passed. Executed in ${res.data.execTime}ms`,
                    });
                    setShowDialog(true);
                } else {
                    setOutput(res.data.logs);
                }
            } else {
                if (!isTempRun) {
                    setDialogData({
                        title: "Error",
                        description: `${res.data.passedTestCases}/${res.data.totalTestCases} test cases passed. Try again!`,
                    });
                    setShowDialog(true);
                } else {
                    setOutput(res.data.logs);
                }
            }
            return;
        } else if (res.data.status == "Queued") {
            if (tryNo >= 100) {
                setDialogData({
                    title: "Error",
                    description: "Your code could not be executed",
                });
                setShowDialog(true);
                if (isTempRun) {
                    setRunning(false);
                } else {
                    setSubmitting(false);
                }
                return;
            }
            await new Promise((resolve) =>
                setTimeout(async () => {
                    await pollForResult(submissionId, isTempRun, tryNo + 1);
                    resolve();
                }, 400),
            );
        } else {
            if (isTempRun) {
                setRunning(false);
            } else {
                setSubmitting(false);
            }
            setShowDialog(true);
            setDialogData({
                title: "Error",
                description: res.message,
            });
        }
    };

    const setupMonacoTheme = (monaco) => {
        monaco.languages.register({ id: "theme" });
        (async function () {
            const highlighter = await createHighlighter({
                themes: ["vitesse-light"],
                langs: Object.values(supportedLanguages),
            });

            shikiToMonaco(highlighter, monaco);
        })();
    };

    useEffect(() => {
        if (output == "" || output == null) {
            return;
        }
        setTabValue("output");
    }, [output]);

    return (
        <div className="w-screen h-full-w-nav">
            <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dialogData.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogData.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <ResizablePanelGroup
                direction="horizontal"
                className="border h-full w-full"
            >
                <ResizablePanel defaultSize={50}>
                    <ResizablePanelGroup
                        direction="vertical"
                        className="border h-full w-full"
                    >
                        <ResizablePanel defaultSize={100}>
                            <ScrollArea className="flex h-full w-full flex-col gap-5 pb-14">
                                <p className="prose dark:prose-invert min-w-full p-6">
                                    <Markdown>
                                        {problemStatement.description}
                                    </Markdown>
                                </p>
                            </ScrollArea>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={50}>
                            <div className="z-0 flex flex-col h-full">
                                <div className="flex flex-row gap-2 m-1">
                                    <Select
                                        onValueChange={(e) => setLanguage(e)}
                                        value={language}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="python">
                                                Python
                                            </SelectItem>
                                            <SelectItem value="c">C</SelectItem>
                                            <SelectItem value="cpp">
                                                C++
                                            </SelectItem>
                                            <SelectItem value="java">
                                                Java
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {running ? (
                                        <Button
                                            disabled
                                            className="z-10 self-end"
                                        >
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Running
                                        </Button>
                                    ) : (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Button
                                                        onClick={() =>
                                                            run(true)
                                                        }
                                                        className="z-10 self-end"
                                                    >
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Run
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Ctrl + '</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    {submitting ? (
                                        <Button
                                            disabled
                                            className="z-10 self-end border-gray-400 border"
                                        >
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting
                                        </Button>
                                    ) : (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Button
                                                        onClick={() =>
                                                            run(false)
                                                        }
                                                        className="z-10 self-end border-gray-400 border"
                                                        variant="primary"
                                                    >
                                                        <CornerUpRight className="mr-2 h-4 w-4" />
                                                        Submit
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Ctrl + Enter</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <div className="h-full">
                                    <Editor
                                        theme="vitesse-light"
                                        language={
                                            initialCodeLanguage || language
                                        }
                                        defaultValue={
                                            initialCodeState ||
                                            initialCode[language]
                                        }
                                        value={code}
                                        onChange={(value) => setCode(value)}
                                        beforeMount={setupMonacoTheme}
                                        options={{
                                            fontFamily: "Cascadia Code",
                                            fontLigatures: true,
                                            autoIndent: true,
                                            cursorSmoothCaretAnimation: true,
                                            cursorBlinking: "expand",
                                        }}
                                    />
                                </div>
                            </div>
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={50}>
                            <Tabs defaultValue="testcases" value={tabValue}>
                                <TabsList>
                                    <TabsTrigger
                                        className="m-0.5"
                                        value="testcases"
                                        onClick={() => {
                                            setTabValue("testcases");
                                        }}
                                    >
                                        Sample Testcases
                                    </TabsTrigger>
                                    <TabsTrigger
                                        className="m-0.5"
                                        value="custom-testcase"
                                        onClick={() => {
                                            setTabValue("custom-testcase");
                                        }}
                                    >
                                        Custom Testcase
                                    </TabsTrigger>
                                    {output != null ? (
                                        <TabsTrigger
                                            className="m-0.5"
                                            value="output"
                                            onClick={() => {
                                                setTabValue("output");
                                            }}
                                        >
                                            Run Output
                                        </TabsTrigger>
                                    ) : (
                                        <div />
                                    )}
                                </TabsList>
                                <TabsContent value="testcases">
                                    <ScrollArea className="h-full items-center justify-center">
                                        <div className="p-6 pb-14">
                                            <p className="text-2xl">
                                                Sample Test Cases
                                            </p>
                                            {problemStatement.testCases.map(
                                                (testCase, i) => (
                                                    <div key={testCase.id}>
                                                        <p className="mt-3 text-lg">
                                                            Test Case {i + 1}
                                                        </p>
                                                        <div className="my-1">
                                                            Input
                                                            <div className="bg-code p-2 my-2 rounded font-mono">
                                                                {testCase.input
                                                                    .split("\n")
                                                                    .map(
                                                                        (
                                                                            line,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    line
                                                                                }
                                                                            >
                                                                                <p>
                                                                                    {
                                                                                        line
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                            </div>
                                                            Output
                                                            <div className="bg-code p-2 my-2 rounded font-mono">
                                                                {testCase.output
                                                                    .split("\n")
                                                                    .map(
                                                                        (
                                                                            line,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    line
                                                                                }
                                                                            >
                                                                                <p>
                                                                                    {
                                                                                        line
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                            </div>
                                                        </div>
                                                        {i !=
                                                        problemStatement
                                                            .testCases.length -
                                                            1 ? (
                                                            <Separator className="mt-6" />
                                                        ) : (
                                                            <div />
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                                <TabsContent value="custom-testcase">
                                    <ScrollArea className="flex h-full flex-col gap-5">
                                        <div className="p-6 pb-14">
                                            <Textarea
                                                value={customTestcase}
                                                onChange={(e) =>
                                                    setCustomTestcase(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Check against your own testcases"
                                                className="flex-1 resize-none"
                                                rows={10}
                                            />
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                                {output != null ? (
                                    <TabsContent value="output">
                                        <ScrollArea className="flex h-full flex-col gap-5">
                                            {running ? (
                                                <div className="flex justify-center w-full min-h-full items-center">
                                                    <Loader2 className="mr-2 min-h-full w-4 animate-spin" />
                                                    Running
                                                </div>
                                            ) : (
                                                <div className="p-6 pb-14">
                                                    <p className="text-2xl">
                                                        Code Output
                                                    </p>
                                                    {output.map((o, i) => (
                                                        <div key={i}>
                                                            <p className="mt-3 text-lg">
                                                                Test Case{" "}
                                                                {i + 1}
                                                            </p>
                                                            <div className="bg-code p-2 my-3 rounded font-mono">
                                                                {o
                                                                    .split("\n")
                                                                    .map(
                                                                        (
                                                                            line,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    line
                                                                                }
                                                                            >
                                                                                <p>
                                                                                    {
                                                                                        line
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </TabsContent>
                                ) : (
                                    <div />
                                )}
                            </Tabs>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

export default Code;
