
import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Brain, AlertTriangle, CheckCircle, Info, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "../components/Assistant/Animated Background";

export default function MedicalAnalysisPage() {
  const [symptoms, setSymptoms] = useState([]);
  const [newSymptom, setNewSymptom] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => mockAuth.currentUser,
  });

  const { data: medicalProfile } = useQuery({
    queryKey: ['medicalProfile', user?.email],
    queryFn: () => localStorage.medicalProfile?.get(user?.email),
    enabled: !!user?.email,
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ['medicalAnalyses', user?.email],
    queryFn: () => localStorage.medicalAnalyses?.get(user?.email) || [],
    enabled: !!user?.email,
  });

  const saveAnalysisMutation = useMutation({
    mutationFn: (data) => {
      const newAnalysis = { ...data, id: Date.now(), created_at: new Date().toISOString() };
      const updatedAnalyses = [...analyses, newAnalysis];
      localStorage.medicalAnalyses?.save(user.email, updatedAnalyses);
      return updatedAnalyses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicalAnalyses'] });
    }
  });

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setSymptoms([...symptoms, newSymptom.trim()]);
      setNewSymptom("");
    }
  };

  const removeSymptom = (index) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      alert("Please add at least one symptom");
      return;
    }

    setIsAnalyzing(true);
    try {
      const prompt = `
Perform a comprehensive medical analysis based on these symptoms:

Symptoms: ${symptoms.join(', ')}
Duration: ${duration || 'Not specified'}
Severity: ${severity}

${medicalProfile ? `
Patient Profile:
- Age: ${medicalProfile.age || 'Not specified'}
- Blood Group: ${medicalProfile.blood_group || 'Not specified'}
- Allergies: ${medicalProfile.allergies?.join(', ') || 'None'}
- Chronic Conditions: ${medicalProfile.chronic_conditions?.join(', ') || 'None'}
- Current Medications: ${medicalProfile.current_medications?.join(', ') || 'None'}
` : ''}

Provide a detailed analysis in this format:
{
  "analysis": "Comprehensive analysis of symptoms and their possible relationships",
  "possible_conditions": ["Condition 1", "Condition 2", "Condition 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "urgency_level": "low|medium|high|emergency",
  "confidence_score": 85,
  "red_flags": ["Any concerning symptom that requires immediate attention"],
  "self_care_tips": ["Home care tip 1", "Home care tip 2"],
  "when_to_see_doctor": "Clear guidance on when medical attention is needed"
}

IMPORTANT: 
- This is not a diagnosis, only an analysis
- Always recommend seeing a doctor for proper diagnosis
- Be conservative with urgency assessment
- Highlight any red flag symptoms that need immediate attention
`;

      console.log('🔍 Starting analysis with symptoms:', symptoms);
      const response = await geminiClient.generateContent(prompt);
      console.log('📝 API Response received:', response);
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        console.log('⚠️ Could not parse JSON, using response as text');
        parsedResponse = {
          analysis: response,
          possible_conditions: ["General condition based on symptoms"],
          recommendations: ["Consult a healthcare professional"],
          urgency_level: "medium",
          confidence_score: 70,
          red_flags: [],
          self_care_tips: ["Rest and stay hydrated"],
          when_to_see_doctor: "If symptoms persist or worsen"
        };
      }

      console.log('✅ Analysis complete:', parsedResponse);
      setAnalysis(parsedResponse);

      saveAnalysisMutation.mutate({
        user_email: user.email,
        symptoms,
        duration,
        severity,
        ai_analysis: parsedResponse.analysis,
        possible_conditions: parsedResponse.possible_conditions,
        recommendations: parsedResponse.recommendations,
        urgency_level: parsedResponse.urgency_level,
        confidence_score: parsedResponse.confidence_score
      });

    } catch (error) {
      console.error('❌ Analysis error:', error);
      alert("Failed to analyze symptoms. Please try again. Check console for details.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const urgencyColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    emergency: "bg-red-100 text-red-800"
  };

  const urgencyIcons = {
    low: <CheckCircle className="w-5 h-5" />,
    medium: <Info className="w-5 h-5" />,
    high: <AlertTriangle className="w-5 h-5" />,
    emergency: <AlertTriangle className="w-5 h-5" />
  };

  return (
    <AnimatedBackground variant="purple">
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-600" />
              AI Medical Analysis
            </h1>
            <p className="text-gray-600">Get intelligent insights about your symptoms</p>
          </motion.div>

          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Add Your Symptoms</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSymptom}
                    onChange={(e) => setNewSymptom(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                    placeholder="e.g., Headache, Fever, Fatigue"
                  />
                  <Button onClick={addSymptom}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {symptoms.map((symptom, idx) => (
                    <Badge key={idx} className="bg-purple-100 text-purple-800">
                      {symptom}
                      <button onClick={() => removeSymptom(idx)} className="ml-2">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration</Label>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 3 days, 1 week"
                  />
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={analyzeSymptoms}
                disabled={isAnalyzing || symptoms.length === 0}
                className={`w-full ${isAnalyzing || symptoms.length === 0 ? 'opacity-60 cursor-not-allowed' : ''} bg-purple-600 hover:bg-purple-700`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Analyze Symptoms {symptoms.length > 0 && `(${symptoms.length})`}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Analysis Results</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {analysis.confidence_score}% Confidence
                        </Badge>
                        <Badge className={urgencyColors[analysis.urgency_level]}>
                          {urgencyIcons[analysis.urgency_level]}
                          <span className="ml-2 capitalize">{analysis.urgency_level} Urgency</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.red_flags && analysis.red_flags.length > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-red-900">Red Flags - Immediate Attention Needed</p>
                            <ul className="list-disc list-inside text-sm text-red-700 mt-2">
                              {analysis.red_flags.map((flag, idx) => (
                                <li key={idx}>{flag}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold mb-2">Analysis</h3>
                      <p className="text-gray-700">{analysis.analysis}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Possible Conditions</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.possible_conditions.map((condition, idx) => (
                          <Badge key={idx} variant="outline">{condition}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Recommendations</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {analysis.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>

                    {analysis.self_care_tips && (
                      <div>
                        <h3 className="font-semibold mb-2">Self-Care Tips</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {analysis.self_care_tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">When to See a Doctor</h3>
                      <p className="text-blue-700">{analysis.when_to_see_doctor}</p>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-900">
                        ⚠️ <strong>Disclaimer:</strong> This is an AI-powered analysis and not a medical diagnosis. 
                        Always consult with a qualified healthcare professional for proper medical advice.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {analyses.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Previous Analyses</h2>
              <div className="grid gap-4">
                {analyses.slice(0, 3).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-wrap gap-2">
                            {item.symptoms.map((symptom, idx) => (
                              <Badge key={idx} variant="outline">{symptom}</Badge>
                            ))}
                          </div>
                          <Badge className={urgencyColors[item.urgency_level]}>
                            {item.urgency_level}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{item.ai_analysis}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}

