
import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Plus, Clock, Trash2, BellRing, Pill } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "../components/Assistant/Animated Background";
import { format } from "date-fns";

export default function MedicationRemindersPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: "",
    dosage: "",
    frequency: "once_daily",
    time_slots: ["09:00"],
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: "",
    notes: "",
    notification_enabled: true
  });
  const [notificationPermission, setNotificationPermission] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => mockAuth.currentUser,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['medicationReminders', user?.email],
    queryFn: () => localStorage.MedicationReminder?.get(user.email) || [],
    enabled: !!user?.email,
  });

  const [notificationStatus, setNotificationStatus] = useState('default'); // 'default', 'granted', 'denied'

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
      setNotificationPermission(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationStatus(permission);
        setNotificationPermission(permission === 'granted');
        
        if (permission === 'granted') {
          new Notification('Meduverse AI', {
            body: 'Medication reminders enabled! You will be notified at scheduled times.',
            icon: '💊'
          });
          console.log('✅ Notification permission granted');
        } else if (permission === 'denied') {
          console.warn('⚠️ Notification permission denied. Please enable it in browser settings.');
        }
      } catch (error) {
        console.error('❌ Error requesting notification permission:', error);
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: (data) => {
      const existing = localStorage.medicationReminders.get(user.email) || [];
      const newData = { ...data, id: Date.now() };
      existing.push(newData);
      return localStorage.medicationReminders.save(user.email, existing);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationReminders'] });
      setShowForm(false);
      setFormData({
        medication_name: "",
        dosage: "",
        frequency: "once_daily",
        time_slots: ["09:00"],
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: "",
        notes: "",
        notification_enabled: true
      });
      scheduleNotifications();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localStorage.medicationReminders.remove(user.email, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationReminders'] });
    },
  });

  // Store active timeout IDs to clear them
  const [activeTimeouts, setActiveTimeouts] = React.useState({});
  const [lastScheduleTime, setLastScheduleTime] = React.useState(null);

  const scheduleNotifications = React.useCallback(() => {
    if (!notificationPermission) return;

    // Clear existing timeouts
    Object.values(activeTimeouts).forEach(timeoutId => clearTimeout(timeoutId));
    const newTimeouts = {};

    reminders.forEach((reminder, reminderIdx) => {
      if (!reminder.notification_enabled) return;

      // Check if reminder is within date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(reminder.start_date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = reminder.end_date ? new Date(reminder.end_date) : null;
      if (endDate) endDate.setHours(23, 59, 59, 999);

      if (today < startDate || (endDate && today > endDate)) {
        return;
      }

      reminder.time_slots.forEach((timeSlot, slotIdx) => {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const now = new Date();
        
        // Create scheduled time for today
        const scheduledTime = new Date(
          now.getFullYear(), 
          now.getMonth(), 
          now.getDate(), 
          hours, 
          minutes,
          0,
          0
        );

        // Calculate time until scheduled time
        let timeUntil = scheduledTime.getTime() - now.getTime();

        // If time has passed today, it will be scheduled for tomorrow
        if (timeUntil < 0) {
          return; // Skip if time has already passed
        }

        // Set timeout for exact reminder time
        const timeoutId = setTimeout(() => {
          // Double-check the reminder is still enabled when timeout fires
          if (reminder.notification_enabled) {
            new Notification(`💊 Medication Reminder - ${reminder.medication_name}`, {
              body: `Time to take ${reminder.dosage}${reminder.notes ? '\n' + reminder.notes : ''}`,
              icon: '💊',
              tag: `med-${reminderIdx}-${slotIdx}`, // Prevent duplicate notifications
              requireInteraction: false,
              vibrate: [200, 100, 200]
            });

            console.log(`✅ Reminder sent: ${reminder.medication_name} at ${timeSlot}`);
          }
        }, timeUntil);

        const key = `${reminderIdx}-${slotIdx}`;
        newTimeouts[key] = timeoutId;

        console.log(`⏰ Scheduled reminder: ${reminder.medication_name} at ${timeSlot} (in ${Math.round(timeUntil / 1000)} seconds)`);
      });
    });

    setActiveTimeouts(newTimeouts);
  }, [reminders, notificationPermission]);

  // Schedule reminders on mount and when reminders change
  useEffect(() => {
    if (notificationPermission && reminders.length > 0) {
      scheduleNotifications();
      setLastScheduleTime(new Date());
    }

    // Cleanup timeouts on unmount
    return () => {
      Object.values(activeTimeouts).forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [reminders, notificationPermission, scheduleNotifications]);

  // Periodically reschedule reminders every minute to ensure accuracy
  useEffect(() => {
    if (!notificationPermission || reminders.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const lastSchedule = lastScheduleTime || new Date(0);
      
      // Check if we've moved to a new minute
      if (now.getMinutes() !== lastSchedule.getMinutes() || now.getHours() !== lastSchedule.getHours()) {
        console.log('🔄 Refreshing reminder schedule...');
        scheduleNotifications();
        setLastScheduleTime(now);
      }
    }, 10000); // Check every 10 seconds for accuracy

    return () => clearInterval(interval);
  }, [reminders, notificationPermission, lastScheduleTime, scheduleNotifications]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, user_email: user.email });
  };

  const addTimeSlot = () => {
    setFormData({ ...formData, time_slots: [...formData.time_slots, "09:00"] });
  };

  const updateTimeSlot = (index, value) => {
    const newSlots = [...formData.time_slots];
    newSlots[index] = value;
    setFormData({ ...formData, time_slots: newSlots });
  };

  const removeTimeSlot = (index) => {
    const newSlots = formData.time_slots.filter((_, i) => i !== index);
    setFormData({ ...formData, time_slots: newSlots });
  };

  return (
    <AnimatedBackground variant="green">
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Pill className="w-8 h-8 text-emerald-600" />
                Medication Reminders
              </h1>
              <p className="text-gray-600">Never miss your medication with smart reminders</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-5 h-5 mr-2" />
              Add Reminder
            </Button>
          </motion.div>

          {!notificationPermission && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {notificationStatus === 'denied' ? (
                <Card className="mb-6 bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <BellRing className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            Notifications are blocked for this site
                          </p>
                          <p className="text-xs text-red-700 mt-2">
                            To enable medication reminders, please:
                          </p>
                          <ol className="text-xs text-red-700 mt-1 ml-4 list-decimal space-y-1">
                            <li><strong>Chrome:</strong> Click the lock icon → Notifications → Allow</li>
                            <li><strong>Firefox:</strong> Click the lock icon → Permissions → Allow notifications</li>
                            <li><strong>Safari:</strong> Preferences → Websites → Notifications → Allow</li>
                            <li>Then refresh this page (F5)</li>
                          </ol>
                        </div>
                      </div>
                      <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 whitespace-nowrap">
                        <Bell className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="mb-6 bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <BellRing className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">
                            Enable notifications to receive medication reminders on your device
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Get timely alerts even when the app is closed
                          </p>
                        </div>
                      </div>
                      <Button onClick={requestNotificationPermission} className="bg-yellow-600 hover:bg-yellow-700">
                        <Bell className="w-4 h-4 mr-2" />
                        Enable
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

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
                          <Label>Medication Name *</Label>
                          <Input
                            value={formData.medication_name}
                            onChange={(e) => setFormData({...formData, medication_name: e.target.value})}
                            placeholder="e.g., Aspirin"
                            required
                          />
                        </div>
                        <div>
                          <Label>Dosage *</Label>
                          <Input
                            value={formData.dosage}
                            onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                            placeholder="e.g., 100mg"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Frequency</Label>
                        <Select value={formData.frequency} onValueChange={(v) => setFormData({...formData, frequency: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once_daily">Once Daily</SelectItem>
                            <SelectItem value="twice_daily">Twice Daily</SelectItem>
                            <SelectItem value="thrice_daily">Thrice Daily</SelectItem>
                            <SelectItem value="every_4_hours">Every 4 Hours</SelectItem>
                            <SelectItem value="every_6_hours">Every 6 Hours</SelectItem>
                            <SelectItem value="every_8_hours">Every 8 Hours</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="as_needed">As Needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Time Slots</Label>
                        {formData.time_slots.map((slot, idx) => (
                          <div key={idx} className="flex gap-2 mb-2">
                            <Input
                              type="time"
                              value={slot}
                              onChange={(e) => updateTimeSlot(idx, e.target.value)}
                            />
                            {formData.time_slots.length > 1 && (
                              <Button type="button" variant="outline" size="icon" onClick={() => removeTimeSlot(idx)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addTimeSlot} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Time Slot
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label>End Date (Optional)</Label>
                          <Input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Notes</Label>
                        <Input
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          placeholder="e.g., Take with food"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="notifications"
                          checked={formData.notification_enabled}
                          onCheckedChange={(checked) => setFormData({...formData, notification_enabled: checked})}
                        />
                        <Label htmlFor="notifications">Enable push notifications</Label>
                      </div>

                      <div className="flex gap-3">
                        <Button type="submit">Save Reminder</Button>
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-4">
            <AnimatePresence>
              {reminders.map((reminder, index) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-full">
                              <Pill className="w-5 h-5 text-emerald-600" />
                            </div>
                            {reminder.medication_name}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-2">Dosage: {reminder.dosage}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge className="bg-blue-100 text-blue-800">
                              {reminder.frequency.replace('_', ' ')}
                            </Badge>
                            {reminder.time_slots.map((slot, idx) => (
                              <Badge key={idx} variant="outline" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {slot}
                              </Badge>
                            ))}
                            {reminder.notification_enabled && (
                              <Badge className="bg-green-100 text-green-800">
                                <BellRing className="w-3 h-3 mr-1" />
                                Notifications On
                              </Badge>
                            )}
                          </div>
                          {reminder.notes && (
                            <p className="text-sm text-gray-500 mt-2">📝 {reminder.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(reminder.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {reminders.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className="p-12 text-center">
                <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No medication reminders yet. Add your first reminder!</p>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}

