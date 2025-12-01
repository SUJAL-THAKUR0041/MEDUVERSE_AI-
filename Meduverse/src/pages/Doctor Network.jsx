import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Star, Award, Calendar, Video, Search, Sparkles, Loader2, Phone, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "../components/Assistant/Animated Background";
import { createPageUrl } from "../utils";

export default function DoctorNetworkPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [showAISearch, setShowAISearch] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState(null);

  const [doctors] = useState([
    { id: 1, full_name: "Dr. Rajesh Kumar", specialization: "Cardiology", experience_years: 15, qualification: "MBBS, MD", consultation_fee: 500, rating: 4.8, total_consultations: 1200, is_verified: true, hospital_affiliation: "Apollo Hospital" },
    { id: 2, full_name: "Dr. Priya Sharma", specialization: "Dermatology", experience_years: 12, qualification: "MBBS, MD", consultation_fee: 400, rating: 4.7, total_consultations: 800, is_verified: true, hospital_affiliation: "Max Healthcare" },
    { id: 3, full_name: "Dr. Amit Patel", specialization: "Neurology", experience_years: 18, qualification: "MBBS, DM", consultation_fee: 600, rating: 4.9, total_consultations: 950, is_verified: true, hospital_affiliation: "Fortis Hospital" }
  ]);
  const [user] = useState(mockAuth.currentUser);
  const [medicalProfile] = useState(localStorage.medicalProfile.get(mockAuth.currentUser.email));

  const aiSearchMutation = {
    isPending: false,
    mutate: async (query) => {
      aiSearchMutation.isPending = true;
      try {
        const result = await aiSearchMutation.mutationFn(query);
        setAiResults(result);
      } catch (error) {
        console.error('AI search error:', error);
      } finally {
        aiSearchMutation.isPending = false;
      }
    },
    mutationFn: async (query) => {
      const prompt = `
User query: "${query}"
${medicalProfile?.location ? `User location: ${medicalProfile.location}` : ''}

Find the best doctors for this query. Provide response in this exact format:
{
  "nearby_doctors": [
    {
      "name": "Dr. Full Name",
      "specialization": "Specialization",
      "qualification": "MBBS, MD",
      "hospital": "Hospital Name",
      "contact": "Phone Number",
      "address": "Full Address",
      "experience_years": 10,
      "distance": "Approximate distance from user",
      "consultation_fee": 500
    }
  ],
  "other_city_doctors": [
    {
      "name": "Dr. Full Name",
      "specialization": "Specialization", 
      "qualification": "MBBS, MD",
      "hospital": "Hospital Name",
      "city": "City Name",
      "contact": "Phone Number",
      "address": "Full Address",
      "experience_years": 15,
      "consultation_fee": 800
    }
  ]
}

Provide 3-5 nearby doctors (if location available) and 2-3 doctors from other major cities.
Use ONLY real, well-known doctors and hospitals. Include accurate contact information.
`;

      const response = await geminiClient.generateContent(prompt);
      
      try {
        return JSON.parse(response);
      } catch {
        return {
          nearby_doctors: [
            { name: "Dr. Sample Doctor", specialization: "General Medicine", qualification: "MBBS, MD", hospital: "City Hospital", contact: "9876543210", address: "Sample Address", experience_years: 10, distance: "2 km", consultation_fee: 500 }
          ],
          other_city_doctors: []
        };
      }

      return response;
    }
  };

  const handleAISearch = () => {
    if (!aiQuery.trim()) return;
    aiSearchMutation.mutate(aiQuery);
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = specialtyFilter === "all" || doctor.specialization.toLowerCase() === specialtyFilter.toLowerCase();
    return matchesSearch && matchesSpecialty;
  });

  const specialties = [...new Set(doctors.map(d => d.specialization))];

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
              <User className="w-8 h-8 text-blue-600" />
              Doctor Network
            </h1>
            <p className="text-gray-600">Find verified doctors with AI assistance</p>
          </motion.div>

          {/* AI Search Section */}
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-lg">Ask AI for Doctor Recommendations</h3>
              </div>
              <div className="space-y-3">
                <Textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="e.g., 'I need a cardiologist near me' or 'Best neurologist in Delhi' or 'Child specialist with experience'"
                  rows={3}
                  className="bg-white"
                />
                <Button 
                  onClick={handleAISearch}
                  disabled={aiSearchMutation.isPending || !aiQuery.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {aiSearchMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Find Best Doctors
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Regular Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by doctor name or specialization"
                    className="pl-10"
                  />
                </div>
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Specializations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {specialties.map(spec => (
                      <SelectItem key={spec} value={spec.toLowerCase()}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-xl transition-shadow h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <User className="w-8 h-8 text-blue-600" />
                      </div>
                      {doctor.is_verified && (
                        <Badge className="bg-green-100 text-green-800">
                          <Award className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{doctor.full_name}</CardTitle>
                    <p className="text-sm text-gray-600">{doctor.qualification}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge className="bg-indigo-100 text-indigo-800 text-sm">
                      {doctor.specialization}
                    </Badge>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-gray-500" />
                      <span>{doctor.experience_years} years experience</span>
                    </div>

                    {doctor.hospital_affiliation && (
                      <div className="text-sm text-gray-600">
                        🏥 {doctor.hospital_affiliation}
                      </div>
                    )}

                    {doctor.rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(doctor.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({doctor.total_consultations} consultations)
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">Consultation Fee</span>
                        <span className="font-semibold text-lg text-blue-600">
                          ₹{doctor.consultation_fee}
                        </span>
                      </div>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => window.location.href = createPageUrl('Telemedicine')}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Book Consultation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredDoctors.length === 0 && !aiResults && (
            <Card className="p-12 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No doctors found. Try adjusting your search.</p>
            </Card>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}

