
import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Stethoscope, 
  Send, 
  AlertTriangle, 
  Loader2,
  Shield,
  Heart,
  User
} from "lucide-react";
import { askGroq } from "../api/groq";

async function sendMessage() {
  if (!userMessage.trim()) return;

  setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);

  const reply = await askGroq(userMessage);

  setMessages((prev) => [...prev, { sender: "ai", text: reply }]);

  setUserMessage("");
}

export default function MedicalAssistant() {
  const [message, setMessage] = useState("");
  const [currentSessionId] = useState(() => `med_${Date.now()}`);
  const queryClient = useQueryClient();

  const [user] = useState(mockAuth.currentUser);
  const [medicalProfile] = useState(localStorage.medicalProfile.get(mockAuth.currentUser.email));
  const [conversation, setConversation] = useState(null);

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage) => {
      const systemPrompt = `You are "MicroX Medical Assistant", a trusted AI for medical education and health guidance.

CRITICAL SAFETY RULES:
1. NEVER provide definitive diagnosis. Use phrases like "this could be" or "it's possible that"
2. For serious symptoms (chest pain, severe shortness of breath, sudden weakness, severe bleeding, loss of consciousness) IMMEDIATELY instruct: "This may be an emergency — go to the nearest hospital or call 102 immediately" and stop further analysis
3. For medication queries, check the user's medical profile (allergies, current meds). If information is missing or contradictory, ask for clarification before suggesting anything
4. ALWAYS add: "I am not a doctor — for accurate diagnosis, please consult a certified physician"

User Medical Profile: ${medicalProfile ? JSON.stringify({
  allergies: medicalProfile.allergies,
  current_medications: medicalProfile.medications,
  medical_notes: medicalProfile.medical_notes
}) : 'No medical profile set up'}

Previous conversation: ${conversation?.messages ? JSON.stringify(conversation.messages.slice(-3)) : 'None'}

Be empathetic, clear, and concise. Provide confidence level (High/Medium/Low) for medical suggestions.`;

      const response = await geminiClient.generateContent(`${systemPrompt}\n\nUser question: ${userMessage}`);

      const newMessages = [
        ...(conversation?.messages || []),
        { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
        { role: 'assistant', content: response, timestamp: new Date().toISOString(), used_context: ['medical_profile'] }
      ];

      setConversation({ messages: newMessages });
      localStorage.chatHistory.save({
        user_email: user.email,
        message: userMessage,
        response: response,
        category: 'medical_consultation'
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medical AI Assistant</h1>
              <p className="text-gray-600">Your health guidance companion</p>
            </div>
          </div>

          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              <strong>Important:</strong> This AI provides educational guidance only and is NOT a substitute for professional medical diagnosis or treatment. In emergencies, call 102 or visit your nearest hospital immediately.
            </AlertDescription>
          </Alert>
        </div>

        {/* Medical Profile Status */}
        {medicalProfile && medicalProfile.consent_given && (
          <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Medical Profile Active</p>
                  <p className="text-xs text-gray-600">
                    AI has access to your allergies and medications for safer guidance
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                  Protected
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Area */}
        <Card className="border-0 shadow-2xl mb-6">
          <CardHeader className="border-b bg-gradient-to-r from-red-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Medical Consultation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
              {!conversation?.messages || conversation.messages.length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No messages yet</p>
                  <p className="text-sm text-gray-400">Ask me about health concerns, medications, or symptoms</p>
                </div>
              ) : (
                conversation.messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-4 h-4 text-white" />
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
                  <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-white" />
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
                placeholder="Describe your symptoms or health concern..."
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
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
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

        {/* Emergency Button */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Medical Emergency?</h3>
                <p className="text-sm text-red-100">Don't wait - get immediate professional help</p>
              </div>
              <a href="tel:102">
                <Button size="lg" className="bg-white text-red-600 hover:bg-red-50 font-semibold">
                  📞 Call 102 Now
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

