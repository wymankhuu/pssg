import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { gradeLevels } from "@/data/grade-levels";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import pssgLogo from "@/assets/pssg-paper-logo.svg";

const Home = () => {
  const [_, setLocation] = useLocation();
  
  useEffect(() => {
    // Optionally redirect to first grade level
    // setLocation('/generator/k');
  }, []);
  
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-3">
            <img src={pssgLogo} alt="PSSG Logo" className="w-16 h-16 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold">PSSG</h1>
          </div>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Create educational text passages perfectly aligned with K-8 standards for your classroom
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Select a grade level to generate standards-aligned text passages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gradeLevels.map((grade) => (
                  <Link key={grade.id} href={`/generator/${grade.id}`}>
                    <Button 
                      variant="outline" 
                      className="w-full h-12 flex items-center justify-center gap-2"
                    >
                      <span className="material-icons text-xl">{grade.icon}</span>
                      {grade.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Reading</CardTitle>
              <CardDescription>Literature & Informational Text</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Generate narrative and informational passages that align with key reading standards
                for comprehension, analysis, and literary understanding.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/generator/3">
                <Button variant="outline" size="sm">
                  Try Grade 3 Example
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
              <CardDescription>Assessment & Critical Thinking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Create multiple choice, open response, and two-part questions
                at various rigor levels that assess student understanding.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/generator/5">
                <Button variant="outline" size="sm">
                  Try Grade 5 Example
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Teacher Notes</CardTitle>
              <CardDescription>Support & Guidance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Get detailed teacher notes with key concepts, discussion questions,
                and instructional tips aligned to your selected standards.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/generator/1">
                <Button variant="outline" size="sm">
                  Try Grade 1 Example
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-12 bg-indigo-50 p-6 rounded-lg border border-indigo-100">
          <h2 className="text-xl font-semibold mb-3 flex items-center text-indigo-900">
            <span className="material-icons mr-2 text-indigo-700">info</span>
            How It Works
          </h2>
          <ol className="list-decimal ml-6 space-y-2 text-indigo-800">
            <li>Select a <strong>grade level</strong> from K-8</li>
            <li>Choose <strong>specific standards</strong> you want to focus on</li>
            <li>Customize <strong>text options</strong> including length, type, and reading level</li>
            <li>Generate a <strong>text passage</strong> aligned to your selected standards</li>
            <li>Generate <strong>assessment questions</strong> based on your passage</li>
            <li>Review the <strong>answer key</strong> and <strong>teacher notes</strong></li>
            <li>Export your passage to <strong>Google Docs</strong> or <strong>PDF</strong> format</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Home;
