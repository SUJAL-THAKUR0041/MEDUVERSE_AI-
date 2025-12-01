import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Bookmark, RefreshCw } from "lucide-react";

export default function HealthTipsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [user] = useState(mockAuth.currentUser);
  const [medicalProfile] = useState(localStorage.medicalProfile.get(mockAuth.currentUser.email));
  const [tips, setTips] = useState(localStorage.healthTips?.get(mockAuth.currentUser.email) || []);

  const toggleSaveMutation = {
    mutate: ({ id, isSaved }) => {
      const updatedTips = tips.map(tip => 
        tip.id === id ? { ...tip, is_saved: !isSaved } : tip
      );
      localStorage.healthTips?.save(user.email, updatedTips);
      setTips(updatedTips);
    }
  };

  const generateTips = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
Generate 5 personalized health tips based on this user profile:
${medicalProfile ? `
- Age: ${medicalProfile.age || 'Not specified'}
- Blood Group: ${medicalProfile.blood_group || 'Not specified'}
- Location: ${medicalProfile.location || 'Not specified'}
- Allergies: ${medicalProfile.allergies?.join(', ') || 'None'}
- Chronic Conditions: ${medicalProfile.chronic_conditions?.join(', ') || 'None'}
- Current Medications: ${medicalProfile.current_medications?.join(', ') || 'None'}
` : 'No profile data available'}

Provide practical, actionable health tips in the following categories:
- Nutrition
- Exercise
- Mental Health
- Sleep
- Disease Prevention
- General Wellness

Return response in this format:
{
  "tips": [
    {
      "category": "nutrition|exercise|mental_health|sleep|hygiene|disease_prevention|general",
      "content": "Practical health tip here",
      "relevance_score": 85
    }
  ]
}

Make tips specific, actionable, and safe. Avoid medical advice that requires a doctor.
`;

      const response = await geminiClient.generateContent(prompt);
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        parsedResponse = {
          tips: [
            { category: "general", content: "Stay hydrated by drinking 8 glasses of water daily", relevance_score: 80 },
            { category: "exercise", content: "Take a 30-minute walk daily for better cardiovascular health", relevance_score: 85 },
            { category: "nutrition", content: "Include more fruits and vegetables in your diet", relevance_score: 90 }
          ]
        };
      }

      if (parsedResponse?.tips) {
        const newTips = parsedResponse.tips.map(tip => ({
          id: Date.now() + Math.random(),
          user_email: user.email,
          tip_category: tip.category,
          tip_content: tip.content,
          is_personalized: !!medicalProfile?.consent_given,
          relevance_score: tip.relevance_score,
          is_saved: false,
          created_at: new Date().toISOString()
        }));
        const updatedTips = [...tips, ...newTips];
        localStorage.healthTips?.save(user.email, updatedTips);
        setTips(updatedTips);
      }
    } catch (error) {
      alert("Failed to generate tips. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const categoryColors = {
    nutrition: "bg-green-100 text-green-800",
    exercise: "bg-blue-100 text-blue-800",
    mental_health: "bg-purple-100 text-purple-800",
    sleep: "bg-indigo-100 text-indigo-800",
    hygiene: "bg-teal-100 text-teal-800",
    disease_prevention: "bg-red-100 text-red-800",
    general: "bg-gray-100 text-gray-800"
  };

  const categoryIcons = {
    nutrition: "🥗",
    exercise: "🏃",
    mental_health: "🧠",
    sleep: "😴",
    hygiene: "🧼",
    disease_prevention: "🛡️",
    general: "💡"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-emerald-600" />
              AI Health Tips
            </h1>
            <p className="text-gray-600">Personalized health recommendations powered by AI</p>
          </div>
          <Button 
            onClick={generateTips}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Generate New Tips
              </>
            )}
          </Button>
        </div>

        {!medicalProfile?.consent_given && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Complete your medical profile to get highly personalized health tips!
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
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {tips
            .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
            .map((tip) => (
              <Card key={tip.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{categoryIcons[tip.tip_category]}</span>
                        <Badge className={categoryColors[tip.tip_category]}>
                          {tip.tip_category.replace('_', ' ')}
                        </Badge>
                        {tip.is_personalized && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Personalized
                          </Badge>
                        )}
                        {tip.relevance_score && (
                          <Badge variant="outline">
                            {tip.relevance_score}% relevant
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSaveMutation.mutate({ id: tip.id, isSaved: tip.is_saved })}
                    >
                        <Bookmark className={`w-5 h-5 ${tip.is_saved ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-600'}`} />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{tip.tip_content}</p>
                </CardContent>
              </Card>
            ))}
        </div>

        {tips.length === 0 && !isGenerating && (
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No health tips yet. Generate your first set of personalized tips!</p>
            <Button onClick={generateTips} className="bg-emerald-600 hover:bg-emerald-700">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Tips Now
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

