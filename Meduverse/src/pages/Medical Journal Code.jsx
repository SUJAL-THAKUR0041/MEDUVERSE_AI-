import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Sparkles, Calendar, TrendingUp, Smile, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "../components/Assistant/Animated Background";
import { format } from "date-fns";

export default function MedicalJournalPage() {
  const [showForm, setShowForm] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    symptoms: [],
    mood: "good",
    sleep_hours: 7,
    exercise_minutes: 0,
    water_intake: 8,
    meals: "",
    medications_taken: [],
    notes: "",
    tags: []
  });
  const [newSymptom, setNewSymptom] = useState("");
  const [newTag, setNewTag] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => mockAuth.currentUser,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['journalEntries', user?.email],
    queryFn: () => localStorage.MedicalJournalEntry?.get(user.email) || [],
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Generate AI insights first
      const insights = await generateAIInsights(data);
      
      // Create entry with ID and timestamp
      const newEntry = {
        ...data,
        id: Date.now(),
        created_at: new Date().toISOString(),
        ai_insights: insights
      };
      
      // Get existing entries
      const existingEntries = localStorage.MedicalJournalEntry?.get(user.email) || [];
      
      // Add new entry
      const updatedEntries = [newEntry, ...existingEntries];
      
      // Save to localStorage
      localStorage.MedicalJournalEntry?.save(user.email, updatedEntries);
      
      console.log('✅ Journal entry saved:', newEntry);
      return updatedEntries;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      setShowForm(false);
      resetForm();
      alert('✅ Journal entry saved successfully with AI insights!');
    },
    onError: (error) => {
      console.error('❌ Error saving journal entry:', error);
      alert('Failed to save journal entry. Please try again.');
    }
  });

  const generateAIInsights = async (entryData) => {
    setIsGeneratingInsights(true);
    try {
      const prompt = `
Analyze this medical journal entry and provide personalized insights:

Date: ${entryData.entry_date}
Mood: ${entryData.mood}
Sleep: ${entryData.sleep_hours} hours
Exercise: ${entryData.exercise_minutes} minutes
Water Intake: ${entryData.water_intake} glasses
Symptoms: ${entryData.symptoms.join(', ') || 'None'}
Meals: ${entryData.meals || 'Not specified'}
Medications: ${entryData.medications_taken.join(', ') || 'None'}
Notes: ${entryData.notes || 'None'}

Provide brief insights (3-4 sentences) covering:
- Overall health assessment
- Lifestyle suggestions
- Any patterns or concerns
- Positive reinforcement
`;

      console.log('🤖 Generating AI insights...');
      const response = await geminiClient.generateContent(prompt);
      console.log('✨ AI insights generated:', response);

      return response || "Keep tracking your health consistently!";
    } catch (error) {
      console.error('⚠️ Error generating insights:', error);
      return "Unable to generate insights at this time. Your entry has been saved.";
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, user_email: user.email });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      symptoms: [],
      mood: "good",
      sleep_hours: 7,
      exercise_minutes: 0,
      water_intake: 8,
      meals: "",
      medications_taken: [],
      notes: "",
      tags: []
    });
  };

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setFormData({ ...formData, symptoms: [...formData.symptoms, newSymptom.trim()] });
      setNewSymptom("");
    }
  };

  const removeSymptom = (index) => {
    setFormData({ ...formData, symptoms: formData.symptoms.filter((_, i) => i !== index) });
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (index) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) });
  };

  const moodColors = {
    excellent: "bg-green-100 text-green-800",
    good: "bg-blue-100 text-blue-800",
    fair: "bg-yellow-100 text-yellow-800",
    poor: "bg-orange-100 text-orange-800",
    very_poor: "bg-red-100 text-red-800"
  };

  const moodEmojis = {
    excellent: "😊",
    good: "🙂",
    fair: "😐",
    poor: "😕",
    very_poor: "😞"
  };

  return (
    <AnimatedBackground variant="purple">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-indigo-600" />
                AI Medical Journal
              </h1>
              <p className="text-gray-600">Track your health journey with AI-powered insights</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-5 h-5 mr-2" />
              New Entry
            </Button>
          </motion.div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="e.g., Monday Wellness Check"
                            required
                          />
                        </div>
                        <div>
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={formData.entry_date}
                            onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Mood</Label>
                          <Select value={formData.mood} onValueChange={(v) => setFormData({...formData, mood: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excellent">😊 Excellent</SelectItem>
                              <SelectItem value="good">🙂 Good</SelectItem>
                              <SelectItem value="fair">😐 Fair</SelectItem>
                              <SelectItem value="poor">😕 Poor</SelectItem>
                              <SelectItem value="very_poor">😞 Very Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Sleep (hours)</Label>
                          <Input
                            type="number"
                            value={formData.sleep_hours}
                            onChange={(e) => setFormData({...formData, sleep_hours: parseFloat(e.target.value)})}
                            step="0.5"
                          />
                        </div>
                        <div>
                          <Label>Exercise (minutes)</Label>
                          <Input
                            type="number"
                            value={formData.exercise_minutes}
                            onChange={(e) => setFormData({...formData, exercise_minutes: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Water Intake (glasses)</Label>
                        <Input
                          type="number"
                          value={formData.water_intake}
                          onChange={(e) => setFormData({...formData, water_intake: parseInt(e.target.value)})}
                        />
                      </div>

                      <div>
                        <Label>Symptoms</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newSymptom}
                            onChange={(e) => setNewSymptom(e.target.value)}
                            placeholder="Add symptom"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                          />
                          <Button type="button" onClick={addSymptom}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.symptoms.map((symptom, idx) => (
                            <Badge key={idx} className="bg-red-100 text-red-800">
                              {symptom}
                              <button type="button" onClick={() => removeSymptom(idx)} className="ml-2">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Meals</Label>
                        <Textarea
                          value={formData.meals}
                          onChange={(e) => setFormData({...formData, meals: e.target.value})}
                          placeholder="What did you eat today?"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          placeholder="Any additional notes about your day..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Tags</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" onClick={addTag}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline">
                              {tag}
                              <button type="button" onClick={() => removeTag(idx)} className="ml-2">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button type="submit" disabled={createMutation.isPending || isGeneratingInsights}>
                          {createMutation.isPending || isGeneratingInsights ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating AI Insights...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Save with AI Insights
                            </>
                          )}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-4">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3">
                          <span className="text-3xl">{moodEmojis[entry.mood]}</span>
                          {entry.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(entry.entry_date), 'MMMM dd, yyyy')}
                        </div>
                      </div>
                      <Badge className={moodColors[entry.mood]}>
                        {entry.mood.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{entry.sleep_hours}h</p>
                        <p className="text-xs text-gray-600">Sleep</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{entry.exercise_minutes}m</p>
                        <p className="text-xs text-gray-600">Exercise</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-cyan-600">{entry.water_intake}</p>
                        <p className="text-xs text-gray-600">Glasses H₂O</p>
                      </div>
                    </div>

                    {entry.symptoms && entry.symptoms.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Symptoms:</p>
                        <div className="flex flex-wrap gap-2">
                          {entry.symptoms.map((symptom, idx) => (
                            <Badge key={idx} className="bg-red-100 text-red-800">{symptom}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {entry.notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Notes:</p>
                        <p className="text-sm text-gray-700">{entry.notes}</p>
                      </div>
                    )}

                    {entry.ai_insights && (
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-indigo-900 mb-1">AI Insights</p>
                            <p className="text-sm text-indigo-800">{entry.ai_insights}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {entries.length === 0 && (
            <Card className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No journal entries yet. Start tracking your health today!</p>
            </Card>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}

