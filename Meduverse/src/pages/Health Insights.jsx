import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity, 
  Heart, 
  Plus,
  TrendingUp,
  Trash2
} from "lucide-react";
import AdvancedAnalytics from "../components/Health/Advanced Analytics";

export default function HealthInsights() {
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [newMetric, setNewMetric] = useState({
    metric_type: 'blood_pressure',
    value: '',
    unit: 'mmHg',
    notes: ''
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => mockAuth.currentUser,
  });

  const { data: medicalProfile } = useQuery({
    queryKey: ['medicalProfile', user?.id],
    queryFn: () => localStorage.medicalProfile?.get(user.email),
    enabled: !!user?.id,
  });

  const { data: healthMetrics } = useQuery({
    queryKey: ['healthMetrics', user?.id],
    queryFn: () => localStorage.healthMetrics?.get(user.email) || [],
    enabled: !!user?.id,
  });

  const addMetricMutation = useMutation({
    mutationFn: (data) => {
      const newData = { ...data, created_at: new Date().toISOString() };
      const existing = localStorage.healthMetrics.get(user.email) || [];
      existing.push(newData);
      return localStorage.healthMetrics.save(user.email, existing);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthMetrics'] });
      setShowAddMetric(false);
      setNewMetric({ metric_type: 'blood_pressure', value: '', unit: 'mmHg', notes: '' });
    },
  });

  const deleteMetricMutation = useMutation({
    mutationFn: (index) => {
      const existing = localStorage.healthMetrics.get(user.email) || [];
      const updated = existing.filter((_, i) => i !== index);
      return localStorage.healthMetrics.save(user.email, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthMetrics'] });
    },
  });

  const metricTypes = [
    { value: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg' },
    { value: 'heart_rate', label: 'Heart Rate', unit: 'bpm' },
    { value: 'weight', label: 'Weight', unit: 'kg' },
    { value: 'glucose', label: 'Blood Glucose', unit: 'mg/dL' },
    { value: 'temperature', label: 'Temperature', unit: '°F' },
    { value: 'sleep_hours', label: 'Sleep Hours', unit: 'hours' },
    { value: 'water_intake', label: 'Water Intake', unit: 'liters' },
    { value: 'steps', label: 'Steps', unit: 'steps' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Insights</h1>
            <p className="text-gray-600">Advanced analytics for your health metrics</p>
          </div>
          <Button 
            onClick={() => setShowAddMetric(!showAddMetric)}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Metric
          </Button>
        </div>

        {/* Add Metric Form */}
        {showAddMetric && (
          <Card className="mb-8 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Record New Metric</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Metric Type</Label>
                  <Select
                    value={newMetric.metric_type}
                    onValueChange={(value) => {
                      const type = metricTypes.find(t => t.value === value);
                      setNewMetric({ ...newMetric, metric_type: value, unit: type?.unit || '' });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {metricTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value</Label>
                  <Input
                    type="number"
                    value={newMetric.value}
                    onChange={(e) => setNewMetric({ ...newMetric, value: e.target.value })}
                    placeholder="Enter value"
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input value={newMetric.unit} disabled />
                </div>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input
                  value={newMetric.notes}
                  onChange={(e) => setNewMetric({ ...newMetric, notes: e.target.value })}
                  placeholder="Any additional context..."
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => addMetricMutation.mutate(newMetric)}>
                  Save Metric
                </Button>
                <Button variant="outline" onClick={() => setShowAddMetric(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              AI Analytics
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Heart className="w-4 h-4 mr-2" />
              Medical Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AdvancedAnalytics metrics={healthMetrics} />
            {/* Health Metrics List */}
            {healthMetrics && healthMetrics.length > 0 && (
              <Card className="border-0 shadow-lg mt-6">
                <CardHeader>
                  <CardTitle>Recent Health Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {healthMetrics.slice(-5).reverse().map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{metric.metric_type.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-600">{metric.value} {metric.unit} - {new Date(metric.created_at).toLocaleDateString()}</p>
                            {metric.notes && <p className="text-xs text-gray-500">{metric.notes}</p>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const actualIndex = healthMetrics.length - 1 - index;
                            deleteMetricMutation.mutate(actualIndex);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile">
            {medicalProfile && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    Medical Profile Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Allergies</p>
                      <div className="space-y-2">
                        {medicalProfile.allergies?.length > 0 ? (
                          medicalProfile.allergies.map((allergy, idx) => (
                            <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="font-medium text-red-900">{allergy}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No allergies recorded</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Current Medications</p>
                      <div className="space-y-2">
                        {medicalProfile.medications?.length > 0 ? (
                          medicalProfile.medications.map((med, idx) => (
                            <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="font-medium text-blue-900">{med.name}</p>
                              <p className="text-sm text-blue-700 mt-1">{med.dose} - {med.schedule}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No medications recorded</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
