import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Minus
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function AdvancedAnalytics({ metrics }) {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  // Group metrics by type
  const metricsByType = metrics.reduce((acc, metric) => {
    if (!acc[metric.metric_type]) acc[metric.metric_type] = [];
    acc[metric.metric_type].push(metric);
    return acc;
  }, {});

  // Calculate trends and insights
  const getTrend = (data) => {
    if (data.length < 2) return 'stable';
    const recent = data.slice(-3).map(d => d.value);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const firstValue = recent[0];
    const lastValue = recent[recent.length - 1];
    
    if (lastValue > firstValue * 1.05) return 'increasing';
    if (lastValue < firstValue * 0.95) return 'decreasing';
    return 'stable';
  };

  const getInsight = (type, trend, latest) => {
    const insights = {
      blood_pressure: {
        increasing: { text: 'Blood pressure trending up. Monitor closely and consult doctor if persistent.', severity: 'warning' },
        decreasing: { text: 'Blood pressure trending down. Good progress!', severity: 'success' },
        stable: { text: 'Blood pressure stable. Continue monitoring.', severity: 'info' }
      },
      heart_rate: {
        increasing: { text: 'Heart rate increasing. Ensure adequate rest.', severity: 'warning' },
        decreasing: { text: 'Heart rate improving. Keep up healthy habits!', severity: 'success' },
        stable: { text: 'Heart rate consistent. Good cardiovascular health indicator.', severity: 'info' }
      },
      weight: {
        increasing: { text: 'Weight trending up. Review diet and exercise if unintended.', severity: 'warning' },
        decreasing: { text: 'Weight decreasing. Ensure it\'s intentional and healthy.', severity: 'warning' },
        stable: { text: 'Weight stable. Maintaining consistency.', severity: 'success' }
      },
      glucose: {
        increasing: { text: 'Blood glucose rising. Monitor carb intake and consult doctor.', severity: 'warning' },
        decreasing: { text: 'Blood glucose levels improving!', severity: 'success' },
        stable: { text: 'Blood glucose well-controlled.', severity: 'success' }
      }
    };

    return insights[type]?.[trend] || { text: 'Continue monitoring regularly.', severity: 'info' };
  };

  const getWeeklyAverage = (data) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekData = data.filter(d => new Date(d.recorded_date) >= oneWeekAgo);
    if (weekData.length === 0) return null;
    
    return (weekData.reduce((sum, d) => sum + d.value, 0) / weekData.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Health Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            AI-powered insights based on your tracked health metrics
          </p>
        </CardContent>
      </Card>

      {Object.entries(metricsByType).map(([type, data]) => {
        const sorted = data.sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date));
        const latest = sorted[0];
        const trend = getTrend(sorted.slice(0, 10).reverse());
        const insight = getInsight(type, trend, latest);
        const weeklyAvg = getWeeklyAverage(sorted);

        const chartData = sorted
          .slice(0, 14)
          .reverse()
          .map(m => ({
            date: new Date(m.recorded_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: m.value,
            normal: m.is_normal
          }));

        return (
          <Card key={type} className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="capitalize text-xl">
                    {type.replace(/_/g, ' ')}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Last 2 weeks trend</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {latest.value}
                    <span className="text-sm font-normal text-gray-500 ml-2">{latest.unit}</span>
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    {trend === 'increasing' && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Rising
                      </Badge>
                    )}
                    {trend === 'decreasing' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Declining
                      </Badge>
                    )}
                    {trend === 'stable' && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Minus className="w-3 h-3 mr-1" />
                        Stable
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Chart */}
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`color${type}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#color${type})`}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Latest</p>
                  <p className="text-xl font-bold text-gray-900">{latest.value}</p>
                </div>
                {weeklyAvg && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">7-Day Avg</p>
                    <p className="text-xl font-bold text-gray-900">{weeklyAvg}</p>
                  </div>
                )}
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Readings</p>
                  <p className="text-xl font-bold text-gray-900">{data.length}</p>
                </div>
              </div>

              {/* AI Insight */}
              <div className={`p-4 rounded-lg border-l-4 ${
                insight.severity === 'success' ? 'bg-green-50 border-green-500' :
                insight.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-start gap-3">
                  {insight.severity === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : insight.severity === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 text-sm mb-1">AI Insight</p>
                    <p className="text-sm text-gray-700">{insight.text}</p>
                  </div>
                </div>
              </div>

              {/* Recent Entries */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Recent Entries</p>
                <div className="space-y-2">
                  {sorted.slice(0, 5).map((entry, idx) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                      <span className="text-gray-600">
                        {new Date(entry.recorded_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {entry.value} {entry.unit}
                      </span>
                      {entry.notes && (
                        <span className="text-gray-500 text-xs max-w-[150px] truncate">
                          {entry.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

