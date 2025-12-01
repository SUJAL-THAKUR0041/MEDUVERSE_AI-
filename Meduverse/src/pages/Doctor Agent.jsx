import React, { useState, useEffect, useRef } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Stethoscope, User, Bot, Heart, Activity, Phone, FileText, Pill } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "../components/Assistant/Animated Background";
import ChatMessage from "../components/Assistant/Chat Message";
import { useQueryClient } from "@tanstack/react-query";

export default function DoctorAgentPage() {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const [user] = useState(mockAuth.currentUser);
  const [medicalProfile] = useState(localStorage.medicalProfile.get(mockAuth.currentUser.email));
  const [recentAnalyses] = useState([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const startSession = () => {
    setSessionStarted(true);
    let greeting = `Namaste! I'm Dr. AI from Meduverse. Main aapka virtual doctor hoon aur bilkul ek real doctor ki tarah baat karunga.

🩺 **Consultation ke liye main yahan hoon:**
✅ Symptoms ki detailed analysis
✅ Health advice aur guidance  
✅ Medicine ke baare mein information
✅ Lab reports samajhna
✅ Emergency situation identify karna

`;

    if (medicalProfile?.consent_given) {
      greeting += `📋 **Aapki Medical Profile:**
- Umar: ${medicalProfile.age} years
- Blood Group: ${medicalProfile.blood_group}
${medicalProfile.allergies?.length > 0 ? `- Allergies: ${medicalProfile.allergies.join(', ')}` : ''}
${medicalProfile.chronic_conditions?.length > 0 ? `- Chronic Conditions: ${medicalProfile.chronic_conditions.join(', ')}` : ''}

Main aapki medical history ko dhyan me rakhkar advice dunga.
`;
    } else {
      greeting += `⚠️ Agar aap apni medical profile complete karenge, to main aur behtar advice de sakta hoon.

`;
    }

    if (recentAnalyses.length > 0) {
      greeting += `\n📊 **Recent Symptoms:**\nMujhe dikh raha hai aapne recently ${recentAnalyses[0].symptoms.join(', ')} ke baare mein pucha tha. Kya aap iske baare mein baat karna chahte hain?\n\n`;
    }

    greeting += `Aap mujhse bilkul khul kar baat kar sakte hain. Main confidential hoon. Batayein, aaj main aapki kaise madad kar sakta hoon?`;

    setChatMessages([{ text: greeting, isUser: false, confidence: "High" }]);
  };

  const handleQuickAction = (action) => {
    setShowQuickActions(false);
    setMessage(action);
    setTimeout(() => {
      handleSendMessage(action);
    }, 100);
  };

  const handleSendMessage = async (quickMessage = null) => {
    const userMessage = quickMessage || message;
    if (!userMessage.trim() || !user) return;

    setMessage("");
    setShowQuickActions(false);
    setChatMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);

    try {
      const contextHistory = chatMessages.slice(-6).map(m => `${m.isUser ? 'Patient' : 'Dr. AI'}: ${m.text}`).join('\n\n');
      
      const systemPrompt = `
You are Dr. AI from Meduverse - ek experienced aur caring virtual doctor. Aap Hindi-English mix (Hinglish) mein baat karte hain, bilkul India ke doctor ki tarah.

**PERSONALITY:**
- Warm, friendly aur approachable
- Patient ke dard ko samajhte hain
- Simple language use karte hain, medical jargon avoid karte hain jab tak zaroori na ho
- Empathetic responses - "Main samajh sakta hoon", "Yeh problem common hai", etc.
- Follow-up questions poochte hain jahan zaroori ho

**MEDICAL APPROACH:**
1. Pehle symptoms ko detail mein samjho
   - Kab se hai?
   - Kitna severe hai? (mild/moderate/severe)
   - Koi aur symptoms?
   - Pehle kabhi hua hai?

2. Medical history consider karo
3. Possible causes batao (2-3)
4. Immediate care tips do
5. Home remedies suggest karo (safe ones)
6. Red flags identify karo
7. When to see doctor - clear guidance

**PRESCRIPTION RULES:**
❌ NEVER: Antibiotics, steroids, strong painkillers, controlled drugs
✅ CAN SUGGEST: Paracetamol, ORS, antacids, basic home remedies
⚠️ ALWAYS ADD: "Yeh basic advice hai. Proper diagnosis ke liye doctor se milna zaroori hai."

**EMERGENCY HANDLING:**
Agar serious symptoms (chest pain, breathing problem, severe bleeding, unconsciousness):
🚨 "YEH EMERGENCY HAI! Turant 102/108 call karein ya nearest hospital jayen. Delay mat karein!"

${medicalProfile?.consent_given ? `
**PATIENT HISTORY:**
- Name: ${user.full_name || 'Patient'}
- Age: ${medicalProfile.age || 'Not provided'}
- Blood Group: ${medicalProfile.blood_group || 'Not provided'}
- Allergies: ${medicalProfile.allergies?.join(', ') || 'None'}
- Chronic Conditions: ${medicalProfile.chronic_conditions?.join(', ') || 'None'}
- Current Medications: ${medicalProfile.current_medications?.join(', ') || 'None'}
- Location: ${medicalProfile.location || 'Not provided'}

⚠️ CRITICAL: Agar patient ki allergies hain, unhe contraindicated medicines BILKUL MAT suggest karo!
` : ''}

${recentAnalyses.length > 0 ? `
**RECENT MEDICAL HISTORY:**
${recentAnalyses.map(a => `- ${a.symptoms.join(', ')} (${a.severity}) - ${a.urgency_level} urgency`).join('\n')}
` : ''}

**CONVERSATION CONTEXT:**
${contextHistory}

**CURRENT QUERY:** ${userMessage}

Ab Dr. AI ki tarah respond karo - professional, caring, aur helpful. Agar emergency hai to immediately warn karo!
`;

      const response = await geminiClient.generateContent(systemPrompt);

      const aiResponse = response || "Main maafi chahta hoon, mujhe aapka sawal samajh nahi aaya. Kya aap thoda aur detail mein bata sakte hain?";
      
      let confidence = "High";
      let category = "medical_consultation";
      
      if (aiResponse.includes('🚨') || aiResponse.toLowerCase().includes('emergency')) {
        confidence = "High";
        category = "emergency";
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
        text: "Maafi chahta hoon, technical problem aa gayi hai. Kripya dubara try karein. Agar yeh urgent hai to 102/108 pe call karein.", 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { icon: "🤒", text: "Mujhe bukhar hai", query: "Mujhe 2 din se bukhar hai aur body pain bhi ho raha hai" },
    { icon: "😷", text: "Cold & Cough", query: "Mujhe khansi aur cold ki problem hai, kya medicine loon?" },
    { icon: "💊", text: "Medicine info", query: "Paracetamol kab aur kitna lena chahiye?" },
    { icon: "🏥", text: "Hospital chaiye", query: "Mere area mein acha hospital batao" },
    { icon: "📊", text: "Report samjhao", query: "Meri blood test report aai hai, samjha do" },
    { icon: "🤰", text: "Pregnancy care", query: "Pregnancy mein kya care lena chahiye?" }
  ];

  return (
    <AnimatedBackground variant="emerald">
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Stethoscope className="w-8 h-8 text-emerald-600" />
              Dr. AI - Virtual Medical Consultation
            </h1>
            <p className="text-gray-600">Bilkul real doctor ki tarah baat karein - Hindi/English dono mein</p>
          </motion.div>

          {!sessionStarted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="p-8 text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mb-6"
                >
                  <div className="bg-gradient-to-r from-emerald-400 to-teal-500 w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <Stethoscope className="w-16 h-16 text-white" />
                  </div>
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  🙏 Namaste! Dr. AI se miliye
                </h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-lg">
                  Main aapka virtual doctor hoon. Aap mujhse apni health problems ke baare mein 
                  bilkul khul kar baat kar sakte hain - Hindi ya English, jo comfortable lage!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Symptom Check</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <Heart className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Health Advice</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <Pill className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Medicine Info</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                    <Phone className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Emergency Help</p>
                  </div>
                </div>

                <Button 
                  onClick={startSession}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-6 text-lg"
                >
                  <Stethoscope className="w-5 h-5 mr-2" />
                  Consultation Shuru Karein
                </Button>
              </Card>
            </motion.div>
          ) : (
            <Card className="h-[650px] flex flex-col shadow-2xl">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Dr. AI</p>
                      <p className="text-xs text-emerald-100">Virtual Medical Consultant</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span>
                    Online
                  </Badge>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                <AnimatePresence>
                  {chatMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <ChatMessage
                        message={msg.text}
                        isUser={msg.isUser}
                        confidence={msg.confidence}
                        category={msg.category}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {showQuickActions && chatMessages.length <= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4"
                  >
                    {quickActions.map((action, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleQuickAction(action.query)}
                        className="p-4 bg-white border-2 border-emerald-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left"
                      >
                        <div className="text-2xl mb-2">{action.icon}</div>
                        <p className="text-sm font-medium text-gray-700">{action.text}</p>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                    <Card className="p-4 bg-white">
                      <p className="text-gray-600">Dr. AI soch rahe hain...</p>
                    </Card>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4 bg-white">
                <div className="flex gap-3">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Apni problem batayein... (Hindi/English dono chalega)"
                    className="flex-1 border-2 border-emerald-200 focus:border-emerald-400"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !message.trim()}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}

