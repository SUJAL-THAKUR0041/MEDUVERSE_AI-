import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Plus, TrendingUp, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function HealthAnalyticsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    metric_type: "weight",
    value: "",
    unit: "kg",
    notes: "",
    recorded_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [user] = useState(mockAuth.currentUser);
  const getInitialMetrics = () => {
    const stored = localStorage.healthMetrics?.get(mockAuth.currentUser.email) || [];
    if (stored.length === 0) {
      // Add sample data if no metrics exist
      const sampleData = [
        { id: 1, metric_type: "weight", value: "70", unit: "kg", recorded_date: "2024-11-25", notes: "Morning weight", user_email: mockAuth.currentUser.email, created_at: new Date().toISOString() },
        { id: 2, metric_type: "weight", value: "69.5", unit: "kg", recorded_date: "2024-11-26", notes: "Morning weight", user_email: mockAuth.currentUser.email, created_at: new Date().toISOString() },
        { id: 3, metric_type: "heart_rate", value: "72", unit: "bpm", recorded_date: "2024-11-25", notes: "Resting heart rate", user_email: mockAuth.currentUser.email, created_at: new Date().toISOString() },
        { id: 4, metric_type: "heart_rate", value: "75", unit: "bpm", recorded_date: "2024-11-26", notes: "Resting heart rate", user_email: mockAuth.currentUser.email, created_at: new Date().toISOString() }
      ];
      localStorage.healthMetrics?.save(mockAuth.currentUser.email, sampleData);
      return sampleData;
    }
    return stored;
  };

  const [metrics, setMetrics] = useState(getInitialMetrics());

  const createMutation = {
    mutate: (data) => {
      const newMetric = { ...data, id: Date.now(), created_at: new Date().toISOString() };
      const updated = [...metrics, newMetric];
      localStorage.healthMetrics?.save(user.email, updated);
      setMetrics(updated);
      setShowForm(false);
      setFormData({ metric_type: "weight", value: "", unit: "kg", notes: "", recorded_date: format(new Date(), 'yyyy-MM-dd') });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, user_email: user.email });
  };

  const handleDeleteMetric = (metricId) => {
    const updated = metrics.filter(m => m.id !== metricId);
    localStorage.healthMetrics?.save(user.email, updated);
    setMetrics(updated);
  };

  const metricUnits = {
    weight: "kg",
    blood_pressure: "mmHg",
    blood_sugar: "mg/dL",
    heart_rate: "bpm",
    temperature: "°F",
    sleep_hours: "hours",
    water_intake: "liters",
    steps: "steps"
  };

  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.metric_type]) acc[metric.metric_type] = [];
    acc[metric.metric_type].push(metric);
    return acc;
  }, {});

  const getChartData = (metricType) => {
    const data = groupedMetrics[metricType] || [];
    return data
      .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date))
      .map(m => ({
        date: format(new Date(m.recorded_date), 'MMM dd'),
        value: parseFloat(m.value) || 0
      }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-teal-600" />
              Health Analytics
            </h1>
            <p className="text-gray-600">Track and analyze your health metrics</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-5 h-5 mr-2" />
            Add Metric
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select value={formData.metric_type} onValueChange={(v) => setFormData({...formData, metric_type: v, unit: metricUnits[v]})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                      <SelectItem value="blood_sugar">Blood Sugar</SelectItem>
                      <SelectItem value="heart_rate">Heart Rate</SelectItem>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="sleep_hours">Sleep Hours</SelectItem>
                      <SelectItem value="water_intake">Water Intake</SelectItem>
                      <SelectItem value="steps">Steps</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={formData.recorded_date}
                    onChange={(e) => setFormData({...formData, recorded_date: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Value"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  />
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
                <div className="flex gap-3">
                  <Button type="submit">Save Metric</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(groupedMetrics).map(([metricType, data]) => {
            const chartData = getChartData(metricType);
            const latestValue = data[data.length - 1]?.value;
            
            return (
              <Card key={metricType}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{metricType.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                      <span className="font-semibold text-teal-600">{latestValue} {data[data.length - 1]?.unit}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No data yet</p>
                  )}
                  <div className="mt-4 space-y-2">
                    {data.slice(-3).reverse().map((metric, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-t pt-2">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(metric.recorded_date), 'MMM dd, yyyy')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{metric.value} {metric.unit}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this metric?')) {
                                handleDeleteMetric(metric.id);
                              }
                            }}
                            className="h-8 w-8 p-0 text-red-600 border-red-300 hover:text-red-800 hover:bg-red-50 hover:border-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {Object.keys(groupedMetrics).length === 0 && (
          <Card className="p-12 text-center">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No health metrics yet. Start tracking your health!</p>
          </Card>
        )}
      </div>
    </div>
  );
}

