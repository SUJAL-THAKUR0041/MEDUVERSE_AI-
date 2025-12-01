import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Video, CheckCircle, XCircle, Clock, FileText, User } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedBackground from "../components/Assistant/Animated Background";
import { format } from "date-fns";

export default function DoctorAdminPage() {
  const [user] = useState(mockAuth.currentUser);
  const [doctorProfile] = useState({ full_name: "Dr. Sample", specialization: "General Medicine", total_consultations: 150, rating: 4.8 });
  const [consultations, setConsultations] = useState([]);

  const updateConsultationMutation = {
    mutate: ({ id, data }) => {
      const updated = consultations.map(c => c.id === id ? { ...c, ...data } : c);
      setConsultations(updated);
    }
  };

  if (!doctorProfile) {
    return (
      <AnimatedBackground variant="blue">
        <div className="p-6">
          <Card className="max-w-2xl mx-auto p-12 text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only verified doctors can access this panel.</p>
            <p className="text-sm text-gray-500 mt-2">Please contact admin to register as a doctor.</p>
          </Card>
        </div>
      </AnimatedBackground>
    );
  }

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800",
    in_progress: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const scheduledConsultations = consultations.filter(c => c.status === 'scheduled');
  const completedConsultations = consultations.filter(c => c.status === 'completed');

  return (
    <AnimatedBackground variant="blue">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-blue-600" />
                  Doctor Admin Panel
                </h1>
                <p className="text-gray-600">Welcome, Dr. {doctorProfile.full_name}</p>
              </div>
              <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                {doctorProfile.specialization}
              </Badge>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Consultations</p>
                    <p className="text-3xl font-bold text-blue-600">{doctorProfile.total_consultations || 0}</p>
                  </div>
                  <Video className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Scheduled</p>
                    <p className="text-3xl font-bold text-green-600">{scheduledConsultations.length}</p>
                  </div>
                  <Clock className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-3xl font-bold text-yellow-600">{doctorProfile.rating || 'N/A'}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-yellow-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="scheduled" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All Consultations</TabsTrigger>
            </TabsList>

            <TabsContent value="scheduled" className="space-y-4">
              {scheduledConsultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Patient Consultation
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-2">
                          {format(new Date(consultation.consultation_date), 'MMMM dd, yyyy')} at {consultation.consultation_time}
                        </p>
                      </div>
                      <Badge className={statusColors[consultation.status]}>
                        {consultation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Reason for Consultation:</p>
                      <p className="text-sm text-gray-600">{consultation.reason}</p>
                    </div>
                    {consultation.meeting_link && (
                      <a href={consultation.meeting_link} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          <Video className="w-4 h-4 mr-2" />
                          Join Meeting
                        </Button>
                      </a>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => updateConsultationMutation.mutate({
                          id: consultation.id,
                          data: { status: 'in_progress' }
                        })}
                      >
                        Start Consultation
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => updateConsultationMutation.mutate({
                          id: consultation.id,
                          data: { status: 'completed' }
                        })}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {scheduledConsultations.length === 0 && (
                <Card className="p-12 text-center">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No scheduled consultations</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedConsultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">
                          {format(new Date(consultation.consultation_date), 'MMMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600">{consultation.reason}</p>
                      </div>
                      <Badge className={statusColors[consultation.status]}>
                        {consultation.status}
                      </Badge>
                    </div>
                    {consultation.prescription && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium">Prescription:</p>
                        <p className="text-sm text-gray-700">{consultation.prescription}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {completedConsultations.length === 0 && (
                <Card className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No completed consultations yet</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {consultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {format(new Date(consultation.consultation_date), 'MMMM dd, yyyy')} at {consultation.consultation_time}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{consultation.reason}</p>
                      </div>
                      <Badge className={statusColors[consultation.status]}>
                        {consultation.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AnimatedBackground>
  );
}

