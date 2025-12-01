import React, { useState, useEffect, useRef } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2, AlertCircle, Heart, Activity, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import ChatMessage from "../components/Assistant/Chat Message";
import AnimatedBackground from "../components/Assistant/Animated Background";

export default function HomePage() {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [user] = useState(mockAuth.currentUser);
  const [medicalProfile] = useState(localStorage.medicalProfile.get(mockAuth.currentUser.email));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    const userMessage = message;
    setMessage("");
    setChatMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);

    try {
      const systemPrompt = `
You are "Meduverse AI Navigator", a comprehensive medical assistant with location intelligence.

SYSTEM RULES:
1) LOCATION & HOSPITAL RECOMMENDER
- When user asks for nearby hospital/doctor/clinic, provide:
  • Top 3 nearest hospitals (name + address + speciality + approx distance)
  • Top 3 relevant specialist doctors
  • Emergency number: 102/108 (India)
- Use real well-known hospitals
- If emergency detected → "⚠️ This might be an emergency — call 102/108 immediately or visit nearest hospital."

2) MEDICINE GUIDANCE (NON-PRESCRIPTIVE)
- NEVER prescribe antibiotics, steroids, or controlled drugs
- Only suggest: OTC medicines (paracetamol, ORS, antacid), natural remedies, hydration/diet
- Always add: "I'm not a doctor — consult a qualified doctor for exact dosage."
${medicalProfile?.allergies?.length > 0 ? `- User allergies: ${medicalProfile.allergies.join(', ')} - NEVER suggest conflicting medicine` : ''}

3) MEDICAL SUPPORT
- Provide simple health explanations
- Symptom assessment and guidance
- Wellness and preventive care tips

4) FORMAT
- Keep answers short, structured, and practical
- For medical queries include: possible cause, what to do, what NOT to do, when to see doctor, emergency signs
- For hospital finder → clean card-style results

5) CONFIDENCE & LIMITS
- Add confidence level (High/Medium/Low)
- Remind: "This is not a medical diagnosis."

${medicalProfile?.consent_given && medicalProfile?.location ? `User location: ${medicalProfile.location}` : ''}
${medicalProfile?.consent_given && medicalProfile?.chronic_conditions?.length > 0 ? `User conditions: ${medicalProfile.chronic_conditions.join(', ')}` : ''}

User query: ${userMessage}
`;

      const response = await geminiClient.generateContent(systemPrompt);

      const aiResponse = response || "Sorry, I couldn't process your request. Please try again.";
      
      let confidence = "Medium";
      let category = "general";
      
      if (userMessage.toLowerCase().includes('hospital') || userMessage.toLowerCase().includes('doctor')) {
        category = "hospital_finder";
        confidence = "High";
      } else if (userMessage.toLowerCase().includes('medicine') || userMessage.toLowerCase().includes('drug')) {
        category = "medicine_guidance";
        confidence = "Medium";
      }

      setChatMessages(prev => [...prev, { 
        text: aiResponse, 
        isUser: false, 
        confidence,
        category 
      }]);

      localStorage.chatHistory.save({
        user_email: user.email,
        message: userMessage,
        response: aiResponse,
        category,
        confidence_level: confidence
      });

    } catch (error) {
      setChatMessages(prev => [...prev, { 
        text: "Sorry, something went wrong. Please try again.", 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedBackground variant="emerald">
      <div className="max-w-6xl mx-auto p-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <motion.h1 
            className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3"
            animate={{ 
              backgroundPosition: ['0%', '100%', '0%']
            }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            Meduverse AI Navigator
          </motion.h1>
          <p className="text-xl text-gray-700">Your Intelligent Health Companion 🩺</p>
        </motion.div>

        {!medicalProfile?.consent_given && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-4 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Complete your medical profile for personalized suggestions
                  </p>
                  <Button 
                    variant="link" 
                    className="text-yellow-700 p-0 h-auto"
                    onClick={() => window.location.href = '/profile'}
                  >
                    Update Profile →
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-[600px] flex flex-col shadow-2xl border-2 border-emerald-200 backdrop-blur-sm bg-white/95">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="bg-white/20 p-2 rounded-full"
                  >
                    <Heart className="w-6 h-6" fill="currentColor" />
                  </motion.div>
                  <div>
                    <p className="font-semibold text-lg">Medical AI Assistant</p>
                    <p className="text-xs text-emerald-100">Available 24/7 for your health queries</p>
                  </div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-sm">Online</span>
                </motion.div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <motion.div 
                    className="text-8xl mb-4"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    🩺
                  </motion.div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                    Namaste! How can I help you today?
                  </h2>
                  <p className="text-gray-600 mb-8 text-lg">
                    Find hospitals, get medicine info, or health guidance
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-auto py-6 w-full bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 hover:border-pink-300"
                        onClick={() => setMessage("I have a headache, what should I do?")}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">💊</div>
                          <p className="font-semibold">Medicine Info</p>
                        </div>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-auto py-6 w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-300"
                        onClick={() => setMessage("Find nearest hospital")}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">🏥</div>
                          <p className="font-semibold">Find Hospital</p>
                        </div>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-auto py-6 w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300"
                        onClick={() => setMessage("How can I improve my health?")}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">💚</div>
                          <p className="font-semibold">Health Tips</p>
                        </div>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              )}
              
              {chatMessages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  message={msg.text}
                  isUser={msg.isUser}
                  confidence={msg.confidence}
                  category={msg.category}
                />
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                  <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <p className="text-gray-700 font-medium">AI is thinking...</p>
                  </Card>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t-2 border-emerald-100 p-4 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex gap-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about your health..."
                  className="flex-1 border-2 border-emerald-300 focus:border-emerald-500 shadow-sm"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !message.trim()}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">
                  ⚠️ Not a medical diagnosis. Consult a doctor for serious conditions.
                </p>
                <p className="text-xs text-red-500 font-semibold">
                  🚨 Emergency: 102/108
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatedBackground>
  );
}

