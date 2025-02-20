import React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Home() {
    return (
        <div className="min-h-full-w-nav flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Coding Interview Simulator</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>
                        Practice coding interviews in a simulated environment.
                        Improve your problem-solving skills and gain confidence.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button>Start Simulation</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Home;
