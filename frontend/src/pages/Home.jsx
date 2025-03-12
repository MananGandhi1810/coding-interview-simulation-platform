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
} from "lucide-react";

function Home() {
    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">
                    Coding Interview Simulator
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                    Practice coding interviews in a realistic environment with
                    AI-powered feedback. Improve your problem-solving skills and
                    gain confidence.
                </p>
                <Link to="/start-interview">
                    <Button size="lg" className="px-8">
                        Start Simulation
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <CodeIcon className="h-6 w-6" />
                        <CardTitle>Real Problems</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            Curated collection of common coding interview
                            questions from top tech companies.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <TimerIcon className="h-6 w-6" />
                        <CardTitle>Timed Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            Practice under real interview time constraints to
                            improve your performance.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <BrainCircuitIcon className="h-6 w-6" />
                        <CardTitle>AI Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            Get personalized feedback on your solutions to
                            identify areas for improvement.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <GraduationCapIcon className="h-6 w-6" />
                        <CardTitle>Learn & Grow</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            Track your progress and learn from your mistakes
                            with each practice session.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Ready to Ace Your Next Interview?</CardTitle>
                    <CardDescription>
                        Start practicing today and build confidence for your
                        upcoming interviews.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Link to="/start-interview">
                        <Button size="lg" className="px-8">
                            Start Simulation
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Home;
