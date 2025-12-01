import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Plus, 
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Edit,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Reminders() {
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    type: 'study',
    scheduled_time: '',
    repeat: 'once',
    priority: 'medium'
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => mockAuth.currentUser,
  });

  const { data: reminders } = useQuery({
    queryKey: ['reminders', user?.id],
    queryFn: () => localStorage.Reminder?.get(user.email) || [],
    enabled: !!user?.id,
  });

  const addReminderMutation = useMutation({
    mutationFn: (data) => {
      const existing = localStorage.Reminder.get(user.email) || [];
      const newData = { ...data, id: Date.now(), completed: false };
      existing.push(newData);
      return localStorage.Reminder.save(user.email, existing);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowAddReminder(false);
      setNewReminder({
        title: '',
        description: '',
        type: 'study',
        scheduled_time: '',
        repeat: 'once',
        priority: 'medium'
      });
    },
  });

  const updateReminderMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const existing = localStorage.Reminder.get(user.email) || [];
      const updated = existing.map(reminder => reminder.id === id ? { ...reminder, ...data } : reminder);
      return localStorage.Reminder.save(user.email, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setEditingReminder(null);
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: (id) => localStorage.Reminder.remove(user.email, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, completed }) => {
      const existing = localStorage.Reminder.get(user.email) || [];
      const updated = existing.map(reminder => reminder.id === id ? { ...reminder, completed } : reminder);
      return localStorage.Reminder.save(user.email, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const now = new Date();
  const upcoming = reminders?.filter(r => !r.completed && new Date(r.scheduled_time) > now) || [];
  const overdue = reminders?.filter(r => !r.completed && new Date(r.scheduled_time) <= now) || [];
  const completed = reminders?.filter(r => r.completed) || [];

  const typeColors = {
    study: 'bg-blue-100 text-blue-700 border-blue-200',
    medication: 'bg-red-100 text-red-700 border-red-200',
    appointment: 'bg-purple-100 text-purple-700 border-purple-200',
    other: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-red-100 text-red-700 border-red-200',
  };

  const ReminderCard = ({ reminder }) => (
    <Card className={`border-2 transition-all hover:shadow-lg ${
      reminder.completed ? 'bg-gray-50 border-gray-200' : 
      new Date(reminder.scheduled_time) <= now ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleCompleteMutation.mutate({ 
              id: reminder.id, 
              completed: !reminder.completed 
            })}
            className="flex-shrink-0"
          >
            {reminder.completed ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <div className={`w-6 h-6 rounded-full border-2 ${
                reminder.priority === 'high' ? 'border-red-500' :
                reminder.priority === 'medium' ? 'border-yellow-500' : 'border-green-500'
              }`} />
            )}
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h4 className={`font-semibold text-lg ${reminder.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {reminder.title}
              </h4>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingReminder(reminder)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteReminderMutation.mutate(reminder.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {reminder.description && (
              <p className="text-sm text-gray-600 mb-3">{reminder.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className={typeColors[reminder.type]}>
                {reminder.type}
              </Badge>
              <Badge variant="outline" className={priorityColors[reminder.priority]}>
                {reminder.priority}
              </Badge>
              {reminder.repeat !== 'once' && (
                <Badge variant="outline">🔄 {reminder.repeat}</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(reminder.scheduled_time).toLocaleDateString('en-US')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(reminder.scheduled_time).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reminders</h1>
            <p className="text-gray-600">Stay on track with your tasks</p>
          </div>
          <Button 
            onClick={() => {
              setShowAddReminder(!showAddReminder);
              setEditingReminder(null);
            }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
        </div>

        {/* Add/Edit Reminder Form */}
        {(showAddReminder || editingReminder) && (
          <Card className="mb-8 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>
                {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editingReminder ? editingReminder.title : newReminder.title}
                  onChange={(e) => editingReminder 
                    ? setEditingReminder({ ...editingReminder, title: e.target.value })
                    : setNewReminder({ ...newReminder, title: e.target.value })
                  }
                  placeholder="e.g., Take medication, Study session"
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={editingReminder ? editingReminder.description : newReminder.description}
                  onChange={(e) => editingReminder 
                    ? setEditingReminder({ ...editingReminder, description: e.target.value })
                    : setNewReminder({ ...newReminder, description: e.target.value })
                  }
                  placeholder="Add details..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={editingReminder ? editingReminder.type : newReminder.type}
                    onValueChange={(value) => editingReminder 
                      ? setEditingReminder({ ...editingReminder, type: value })
                      : setNewReminder({ ...newReminder, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={editingReminder ? editingReminder.priority : newReminder.priority}
                    onValueChange={(value) => editingReminder 
                      ? setEditingReminder({ ...editingReminder, priority: value })
                      : setNewReminder({ ...newReminder, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={editingReminder 
                      ? new Date(editingReminder.scheduled_time).toISOString().slice(0, 16)
                      : newReminder.scheduled_time
                    }
                    onChange={(e) => editingReminder 
                      ? setEditingReminder({ ...editingReminder, scheduled_time: e.target.value })
                      : setNewReminder({ ...newReminder, scheduled_time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Repeat</Label>
                  <Select
                    value={editingReminder ? editingReminder.repeat : newReminder.repeat}
                    onValueChange={(value) => editingReminder 
                      ? setEditingReminder({ ...editingReminder, repeat: value })
                      : setNewReminder({ ...newReminder, repeat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => editingReminder
                    ? updateReminderMutation.mutate({ 
                        id: editingReminder.id, 
                        data: editingReminder 
                      })
                    : addReminderMutation.mutate(newReminder)
                  }
                  disabled={editingReminder 
                    ? !editingReminder.title || !editingReminder.scheduled_time
                    : !newReminder.title || !newReminder.scheduled_time
                  }
                >
                  {editingReminder ? 'Update' : 'Create'} Reminder
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddReminder(false);
                    setEditingReminder(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reminders Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue ({overdue.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcoming.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-12 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Reminders</h3>
                  <p className="text-gray-600 mb-4">Create your first reminder to get started</p>
                  <Button onClick={() => setShowAddReminder(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Reminder
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcoming.map(reminder => <ReminderCard key={reminder.id} reminder={reminder} />)
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            {overdue.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                  <p className="text-gray-600">No overdue reminders</p>
                </CardContent>
              </Card>
            ) : (
              overdue.map(reminder => <ReminderCard key={reminder.id} reminder={reminder} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completed.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Completed Reminders</h3>
                  <p className="text-gray-600">Completed reminders will appear here</p>
                </CardContent>
              </Card>
            ) : (
              completed.map(reminder => <ReminderCard key={reminder.id} reminder={reminder} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

