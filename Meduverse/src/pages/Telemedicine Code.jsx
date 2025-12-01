import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Calendar, Clock, User, ExternalLink, Plus, FileText, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "../components/Assistant/Animated Background";
import { format } from "date-fns";

export default function TelemedicinePage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    doctor_name: "",
    specialization: "",
    consultation_date: format(new Date(), 'yyyy-MM-dd'),
    consultation_time: "",
    reason: ""
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => mockAuth.currentUser,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => localStorage.Doctor?.get(user.email) || [],
  });

  const { data: consultations = [] } = useQuery({
    queryKey: ['consultations', user?.email],
    queryFn: () => localStorage.TelemedicineConsultation?.get(user.email) || [],
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const meetingLink = `https://meet.meduverse.ai/${Math.random().toString(36).substr(2, 9)}`;
      return localStorage.TelemedicineConsultation?.save(user.email, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      setShowForm(false);
      setSelectedDoctor(null);
      setFormData({
        doctor_name: "",
        specialization: "",
        consultation_date: format(new Date(), 'yyyy-MM-dd'),
        consultation_time: "",
        reason: ""
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => localStorage.TelemedicineConsultation?.save(user.email, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
    },
  });

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      ...formData,
      doctor_name: doctor.full_name,
      specialization: doctor.specialization
    });
    setShowForm(true);
  };

  const handleDoctorChange = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      setSelectedDoctor(doctor);
      setFormData({
        ...formData,
        doctor_name: doctor.full_name,
        specialization: doctor.specialization
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, user_email: user.email });
  };

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800",
    in_progress: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const upcomingConsultations = consultations.filter(c => c.status === 'scheduled');
  const pastConsultations = consultations.filter(c => ['completed', 'cancelled'].includes(c.status));

  return (
    <AnimatedBackground variant="blue">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Video className="w-8 h-8 text-indigo-600" />
              Telemedicine - Virtual Consultations
            </h1>
            <p className="text-gray-600">Connect with verified doctors from anywhere, anytime</p>
          </motion.div>

          <Tabs defaultValue="book" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="book">Book Consultation</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingConsultations.length})</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="book" className="space-y-6">
              {!showForm ? (
                <>
                  <Card className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50">
                    <h3 className="text-lg font-semibold mb-4">Choose Your Doctor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {doctors.slice(0, 6).map((doctor) => (
                        <Card key={doctor.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleDoctorSelect(doctor)}>
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="bg-indigo-100 p-3 rounded-full">
                                <User className="w-6 h-6 text-indigo-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{doctor.full_name}</p>
                                <p className="text-sm text-gray-600">{doctor.specialization}</p>
                                {doctor.experience_years && (
                                  <p className="text-xs text-gray-500">{doctor.experience_years} years exp.</p>
                                )}
                              </div>
                            </div>
                            {doctor.hospital_affiliation && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                                <MapPin className="w-3 h-3" />
                                {doctor.hospital_affiliation}
                              </div>
                            )}
                            <Button className="w-full" size="sm">
                              Book Now - ₹{doctor.consultation_fee}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Manual Booking</h3>
                    <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Book with Specific Doctor
                    </Button>
                  </Card>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label>Select Doctor *</Label>
                          <Select onValueChange={handleDoctorChange} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a doctor" />
                            </SelectTrigger>
                            <SelectContent>
                              {doctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                  {doctor.full_name} - {doctor.specialization} (₹{doctor.consultation_fee})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedDoctor && (
                          <div className="p-4 bg-indigo-50 rounded-lg">
                            <p className="text-sm font-medium text-indigo-900">Selected Doctor:</p>
                            <p className="text-lg font-semibold text-indigo-700">{selectedDoctor.full_name}</p>
                            <p className="text-sm text-indigo-600">{selectedDoctor.specialization}</p>
                            {selectedDoctor.hospital_affiliation && (
                              <p className="text-xs text-indigo-500">{selectedDoctor.hospital_affiliation}</p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Date *</Label>
                            <Input
                              type="date"
                              value={formData.consultation_date}
                              onChange={(e) => setFormData({...formData, consultation_date: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label>Time *</Label>
                            <Input
                              type="time"
                              value={formData.consultation_time}
                              onChange={(e) => setFormData({...formData, consultation_time: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Reason for Consultation *</Label>
                          <Textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({...formData, reason: e.target.value})}
                            placeholder="Describe your symptoms and reason for consultation"
                            rows={4}
                            required
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button type="submit" disabled={createMutation.isPending || !selectedDoctor}>
                            {createMutation.isPending ? "Booking..." : "Confirm Booking"}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => {
                            setShowForm(false);
                            setSelectedDoctor(null);
                          }}>Cancel</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              <AnimatePresence>
                {upcomingConsultations.map((consultation, index) => (
                  <motion.div
                    key={consultation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="bg-indigo-100 p-3 rounded-full">
                                <User className="w-6 h-6 text-indigo-600" />
                              </div>
                              <div>
                                <CardTitle>{consultation.doctor_name}</CardTitle>
                                <p className="text-sm text-gray-600">{consultation.specialization}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>{format(new Date(consultation.consultation_date), 'MMM dd, yyyy')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span>{consultation.consultation_time}</span>
                              </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg mb-3">
                              <p className="text-sm font-medium text-gray-700">Reason:</p>
                              <p className="text-sm text-gray-600">{consultation.reason}</p>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              <Badge className={statusColors[consultation.status]}>
                                {consultation.status}
                              </Badge>
                              {consultation.meeting_link && (
                                <a href={consultation.meeting_link} target="_blank" rel="noopener noreferrer">
                                  <Badge className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200">
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Join Meeting
                                  </Badge>
                                </a>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: consultation.id, status: 'cancelled' })}
                            className="text-red-500"
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {upcomingConsultations.length === 0 && (
                <Card className="p-12 text-center">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming consultations</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {pastConsultations.map((consultation, index) => (
                <motion.div
                  key={consultation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{consultation.doctor_name}</p>
                            <Badge className={statusColors[consultation.status]}>
                              {consultation.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {format(new Date(consultation.consultation_date), 'MMMM dd, yyyy')} at {consultation.consultation_time}
                          </p>
                          <p className="text-sm text-gray-700">{consultation.reason}</p>
                        </div>
                      </div>
                      {consultation.prescription && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">Prescription</p>
                              <p className="text-sm text-blue-700">{consultation.prescription}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {consultation.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">Doctor's Notes</p>
                          <p className="text-sm text-gray-600">{consultation.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {pastConsultations.length === 0 && (
                <Card className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No consultation history</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AnimatedBackground>
  );
}

