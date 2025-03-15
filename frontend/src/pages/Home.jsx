import React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    CodeIcon,
    BrainCircuitIcon,
    GraduationCapIcon,
    TimerIcon,
    UsersIcon,
    ArrowRightIcon,
} from "lucide-react";

function Home() {
    return (
        <div className="min-h-screen">
            <div className="bg-black text-white py-24 px-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="text-left">
                            <h1 className="text-5xl font-bold mb-6 leading-tight">
                                Master Your Coding Interview Skills
                            </h1>
                            <p className="text-xl opacity-80 mb-8">
                                Practice with AI-powered simulations that
                                provide real-time feedback and help you gain
                                confidence in technical interviews.
                            </p>
                            <div className="space-x-4">
                                <Link to="/start-interview">
                                    <Button
                                        size="lg"
                                        className="bg-white text-black hover:bg-gray-100 px-8 font-medium shadow-lg transition-all hover:shadow-xl"
                                    >
                                        Start Simulation{" "}
                                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link to="/learn-more">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="bg-transparent border-white text-white hover:bg-white/10 px-8"
                                    >
                                        Learn More
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-2xl">
                                <pre className="text-sm opacity-90">
                                    <code>{`function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  
  return -1;
}`}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto pt-16 px-4">
                <h2 className="text-3xl font-bold text-center mb-12">
                    Why Choose Our Platform?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <CodeIcon className="h-6 w-6 text-gray-800" />
                            </div>
                            <CardTitle>Real Problems</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Curated collection of common coding interview
                                questions from top tech companies.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <TimerIcon className="h-6 w-6 text-gray-800" />
                            </div>
                            <CardTitle>Timed Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Practice under real interview time constraints
                                to improve your performance.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <BrainCircuitIcon className="h-6 w-6 text-gray-800" />
                            </div>
                            <CardTitle>AI Feedback</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Get personalized feedback on your solutions to
                                identify areas for improvement.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <GraduationCapIcon className="h-6 w-6 text-gray-800" />
                            </div>
                            <CardTitle>Learn & Grow</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Track your progress and learn from your mistakes
                                with each practice session.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="container mx-auto px-4">
                <Card className="text-center border border-gray-200 shadow-xl bg-black text-white">
                    <CardHeader>
                        <CardTitle className="text-3xl">
                            Ready to Ace Your Next Interview?
                        </CardTitle>
                        <CardDescription className="text-white/80 text-lg">
                            Join thousands of developers who improved their
                            interviewing skills with our platform.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center pb-8">
                        <Link to="/start-interview">
                            <Button
                                size="lg"
                                className="bg-white text-black hover:bg-gray-100 px-8 font-medium"
                            >
                                Start Simulation{" "}
                                <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default Home;
