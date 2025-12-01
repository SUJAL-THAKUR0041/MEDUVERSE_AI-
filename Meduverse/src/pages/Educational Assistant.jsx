import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Send, 
  Loader2,
  BookOpen,
  User,
  Lightbulb,
  Target
} from "lucide-react";

export default function EducationAssistant() {
  const [message, setMessage] = useState("");
  const [currentSessionId] = useState(() => `edu_${Date.now()}`);
  const queryClient = useQueryClient();

  const [user] = useState(mockAuth.currentUser);
  const [educationProfile] = useState(localStorage.educationProfile?.get(mockAuth.currentUser.email));
  const [studyNotes] = useState(localStorage.studyNotes?.get(mockAuth.currentUser.email) || []);
  const [conversation, setConversation] = useState(null);

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage) => {
      const systemPrompt = `You are "MicroX Education Assistant", an AI tutor for medical and academic education.

Your role:
1. Provide clear, step-by-step explanations for educational queries
2. Create study plans with milestones and time estimates
3. Suggest practice questions and assessment tasks
4. Be motivating and supportive - encourage students
5. Reference the user's stored study materials when relevant

User Education Profile: ${educationProfile ? JSON.stringify({
  course: educationProfile.course,
  completed_chapters: educationProfile.completed_chapters,
  weak_topics: educationProfile.weak_topics,
  goals: educationProfile.goals
}) : 'No education profile set up'}

Available Study Notes: ${studyNotes ? studyNotes.map(n => n.title).join(', ') : 'None'}

Previous conversation: ${conversation?.messages ? JSON.stringify(conversation.messages.slice(-3)) : 'None'}

Be pedagogical, concise, and provide examples. Include practice problems when appropriate.`;

      const response = await geminiClient.generateContent(`${systemPrompt}\n\nStudent question: ${userMessage}`);

      const newMessages = [
        ...(conversation?.messages || []),
        { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
        { role: 'assistant', content: response, timestamp: new Date().toISOString(), used_context: ['education_profile', 'study_notes'] }
      ];

      setConversation({ messages: newMessages });
      localStorage.chatHistory.save({
        user_email: user.email,
        message: userMessage,
        response: response,
        category: 'education_consultation'
      });

      return response;
    },
    onSuccess: () => {
      setMessage("");
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const quickPrompts = [
    "Create a 30-minute study plan for today",
    "Explain this concept in simple terms",
    "Give me 5 practice questions",
    "What should I focus on this week?"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Education AI Assistant</h1>
              <p className="text-gray-600">Your personal study companion</p>
            </div>
          </div>
        </div>

        {/* Education Profile Status */}
        {educationProfile && (
          <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Profile Active: {educationProfile.course}</p>
                  <p className="text-xs text-gray-600">
                    {educationProfile.completed_chapters?.length || 0} topics completed · {studyNotes?.length || 0} notes stored
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Prompts */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions:</p>
          <div className="grid grid-cols-2 gap-3">
            {quickPrompts.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline"
                onClick={() => setMessage(prompt)}
                className="justify-start text-left h-auto py-3 px-4 hover:bg-blue-50 hover:border-blue-300"
              >
                <Lightbulb className="w-4 h-4 mr-2 flex-shrink-0 text-yellow-600" />
                <span className="text-sm">{prompt}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <Card className="border-0 shadow-2xl mb-6">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Learning Session
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
              {!conversation?.messages || conversation.messages.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Ready to learn!</p>
                  <p className="text-sm text-gray-400">Ask me anything about your studies</p>
                </div>
              ) : (
                conversation.messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 p-4 rounded-2xl">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="space-y-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a question, request a study plan, or get help with a topic..."
                className="min-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</p>
                <Button 
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

