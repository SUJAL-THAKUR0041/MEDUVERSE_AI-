import React, { useState } from "react";
import { geminiClient } from "../../api/groq";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Sparkles, 
  Loader2,
  FileText,
  BookOpen,
  Brain,
  Target
} from "lucide-react";

export default function MaterialViewer({ note, onClose }) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);

  const askQuestionMutation = useMutation({
    mutationFn: async (userQuestion) => {
      const response = await geminiClient.generateContent(`You are an educational AI tutor. A student is studying the following material:

Title: ${note.title}
Subject: ${note.subject}
Summary: ${note.content_summary || 'No summary available'}

The student asks: "${userQuestion}"

Provide a clear, pedagogical explanation. Include:
1. Direct answer
2. Key concepts explained simply
3. Example if relevant
4. Practice question to test understanding

Be encouraging and supportive.`);

      return response;
    },
    onSuccess: (response) => {
      setConversation([
        ...conversation,
        { role: 'user', content: question },
        { role: 'assistant', content: response }
      ]);
      setQuestion("");
    },
  });

  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await geminiClient.generateContent(`Based on this study material:
Title: ${note.title}
Subject: ${note.subject}
Summary: ${note.content_summary || 'No summary available'}

Generate 5 multiple-choice questions to test understanding. Format as:

Q1: [Question]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
Answer: [Letter]

Continue for all 5 questions.`);

      return response;
    },
    onSuccess: (response) => {
      setConversation([
        ...conversation,
        { role: 'assistant', content: response, special: 'quiz' }
      ]);
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await geminiClient.generateContent(`Based on this study material:
Title: ${note.title}
Subject: ${note.subject}

Create a comprehensive summary covering:
1. Main concepts (bullet points)
2. Key formulas or definitions
3. Important examples
4. Common mistakes to avoid
5. Quick revision points

Be concise but thorough.`);

      return response;
    },
    onSuccess: (response) => {
      setConversation([
        ...conversation,
        { role: 'assistant', content: response, special: 'summary' }
      ]);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{note.title}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{note.subject}</Badge>
                <Badge variant="outline">{note.type}</Badge>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {/* Quick Actions */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">AI Study Tools:</p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => generateSummaryMutation.mutate()}
                disabled={generateSummaryMutation.isPending}
                className="justify-start"
              >
                {generateSummaryMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Summary
              </Button>
              <Button
                variant="outline"
                onClick={() => generateQuizMutation.mutate()}
                disabled={generateQuizMutation.isPending}
                className="justify-start"
              >
                {generateQuizMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Target className="w-4 h-4 mr-2" />
                )}
                Quiz Me
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setConversation([
                    ...conversation,
                    { role: 'assistant', content: 'I\'m here to help! Ask me anything about this material.' }
                  ]);
                }}
                className="justify-start"
              >
                <Brain className="w-4 h-4 mr-2" />
                Explain
              </Button>
            </div>
          </div>

          {/* File Preview */}
          <div className="mb-6">
            <a 
              href={note.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">View Original Material</p>
                  <p className="text-sm text-gray-600">Click to open in new tab</p>
                </div>
              </div>
            </a>
          </div>

          {/* Conversation */}
          <div className="space-y-4 mb-6">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white ml-12'
                    : msg.special === 'quiz'
                    ? 'bg-purple-50 border-2 border-purple-200'
                    : msg.special === 'summary'
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-gray-100 mr-12'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {msg.role === 'assistant' && (
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                  {msg.special === 'quiz' && (
                    <p className="text-sm font-semibold text-purple-700">📝 Practice Quiz</p>
                  )}
                  {msg.special === 'summary' && (
                    <p className="text-sm font-semibold text-green-700">📚 Study Summary</p>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>

          {/* Ask Question */}
          <div className="sticky bottom-0 bg-white pt-4 border-t">
            <div className="space-y-3">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about this material..."
                className="min-h-[80px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (question.trim()) askQuestionMutation.mutate(question);
                  }
                }}
              />
              <Button
                onClick={() => askQuestionMutation.mutate(question)}
                disabled={!question.trim() || askQuestionMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {askQuestionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask Question
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

