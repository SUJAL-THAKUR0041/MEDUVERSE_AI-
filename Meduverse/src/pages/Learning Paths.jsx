import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  Brain, 
  Plus, 
  Sparkles, 
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Loader2
} from "lucide-react";

export default function LearningPaths() {
  const [showGenerate, setShowGenerate] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => mockAuth.currentUser,
  });

  const { data: learningPaths } = useQuery({
    queryKey: ['learningPaths', user?.id],
    queryFn: () => localStorage.LearningPath?.get(user.email) || [],
    enabled: !!user?.id,
  });

  const generatePathMutation = useMutation({
    mutationFn: async (prompt) => {
      const promptText = `Create a detailed learning path based on: "${prompt}"
        
Generate a comprehensive learning plan with milestones, resources, and time estimates.

Return as JSON:
{
  "title": "string",
  "subject": "string", 
  "difficulty_level": "beginner|intermediate|advanced",
  "estimated_hours": number,
  "milestones": [
    {
      "title": "string",
      "description": "string", 
      "resources": ["string array"],
      "completed": false
    }
  ]
}`;

      const response = await geminiClient.generateContent(promptText);
      
      let data;
      try {
        data = JSON.parse(response);
      } catch (error) {
        data = {
          id: Date.now(),
          title: "Learning Path",
          subject: prompt,
          difficulty_level: "intermediate",
          estimated_hours: 20,
          progress_percentage: 0,
          milestones: [
            {
              title: "Introduction",
              description: "Get started with " + prompt,
              resources: ["Online tutorials", "Documentation"],
              completed: false
            }
          ]
        };
      }

      return localStorage.LearningPath?.save(user.email, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningPaths'] });
      setShowGenerate(false);
      setGeneratePrompt("");
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: async ({ pathId, milestoneIndex }) => {
      const path = learningPaths?.find(p => p.id === pathId);
      if (!path) return;
      
      const updatedMilestones = [...path.milestones];
      updatedMilestones[milestoneIndex].completed = !updatedMilestones[milestoneIndex].completed;
      
      const completedCount = updatedMilestones.filter(m => m.completed).length;
      const progress = Math.round((completedCount / updatedMilestones.length) * 100);

      const updatedData = { ...path, milestones: updatedMilestones, progress_percentage: progress };
      return localStorage.LearningPath?.save(user.email, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningPaths'] });
    },
  });

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Paths</h1>
            <p className="text-gray-600">Personalized study journeys powered by AI</p>
          </div>
          <Button 
            onClick={() => setShowGenerate(!showGenerate)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Path
          </Button>
        </div>

        {showGenerate && (
          <Card className="mb-8 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Learning Path Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder="e.g., 'Create a learning path for mastering Organic Chemistry for NEET'"
                className="min-h-[100px]"
              />
              <div className="flex gap-3">
                <Button 
                  onClick={() => generatePathMutation.mutate(generatePrompt)}
                  disabled={!generatePrompt.trim() || generatePathMutation.isPending}
                >
                  {generatePathMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowGenerate(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {!learningPaths || learningPaths.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Learning Paths Yet</h3>
                <Button onClick={() => setShowGenerate(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ) : (
            learningPaths.map((path) => (
              <Card key={path.id} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{path.title}</CardTitle>
                      <div className="flex items-center gap-3">
                        <Badge className={difficultyColors[path.difficulty_level]}>
                          {path.difficulty_level}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {path.estimated_hours} hours
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600">
                        {path.progress_percentage}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Progress value={path.progress_percentage} className="h-3" />
                  
                  <div className="space-y-4">
                    {path.milestones?.map((milestone, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 border-2 rounded-xl ${
                          milestone.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleMilestoneMutation.mutate({ 
                              pathId: path.id, 
                              milestoneIndex: idx 
                            })}
                          >
                            {milestone.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-400" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <h4 className={`font-semibold text-lg mb-1 ${milestone.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {idx + 1}. {milestone.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                            {milestone.resources && milestone.resources.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-700 mb-2">Resources:</p>
                                <ul className="space-y-1">
                                  {milestone.resources.map((resource, rIdx) => (
                                    <li key={rIdx} className="text-sm text-blue-600">
                                      • {resource}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

