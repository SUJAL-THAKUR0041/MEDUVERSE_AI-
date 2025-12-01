import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Loader2, Phone, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "../components/Assistant/Animated Background";
import HospitalCard from "../components/Assistant/Hospital Card";

export default function HospitalFinderPage() {
  const [location, setLocation] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [results, setResults] = useState(null);

  const [user] = useState(mockAuth.currentUser);

  const searchMutation = {
    isPending: false,
    mutate: async ({ location, speciality }, { onSuccess }) => {
      searchMutation.isPending = true;
      try {
        const result = await searchMutation.mutationFn({ location, speciality });
        onSuccess(result);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        searchMutation.isPending = false;
      }
    },
    mutationFn: async ({ location, speciality }) => {
      const prompt = `
Find top 3 nearest hospitals in ${location}${speciality ? ` specializing in ${speciality}` : ''}.

Provide response in this exact format:
{
  "hospitals": [
    {
      "name": "Hospital Name",
      "address": "Full Address",
      "speciality": "Speciality",
      "phone": "Phone Number",
      "distance": "Approximate Distance"
    }
  ],
  "doctors": ["Doctor 1 - Speciality", "Doctor 2 - Speciality", "Doctor 3 - Speciality"],
  "emergency_numbers": ["102", "108"]
}

Use ONLY real, well-known hospitals.
`;

      const response = await geminiClient.generateContent(prompt);
      
      try {
        return JSON.parse(response);
      } catch {
        return {
          hospitals: [{
            name: "Sample Hospital",
            address: "Sample Address",
            speciality: speciality || "General",
            phone: "102",
            distance: "2 km"
          }],
          doctors: ["Dr. Sample - General Medicine"],
          emergency_numbers: ["102", "108"]
        };
      }

      return response;
    }
  };

  const handleSearch = () => {
    if (!location.trim()) {
      alert("Please enter a location");
      return;
    }
    searchMutation.mutate({ location, speciality }, {
      onSuccess: (data) => {
        setResults(data);
      }
    });
  };

  const handleSaveHospital = async (hospital) => {
    if (!user) return;
    
    try {
      localStorage.savedHospitals?.save(user.email, {
        hospital_name: hospital.name,
        address: hospital.address,
        speciality: hospital.speciality,
        phone: hospital.phone
      });
      alert("Hospital saved!");
    } catch (error) {
      alert("Error saving hospital");
    }
  };

  return (
    <AnimatedBackground variant="blue">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🏥 Find Hospitals</h1>
            <p className="text-gray-600">Search for nearby hospitals and doctors</p>
          </motion.div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Location / City *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Mumbai, Andheri or Delhi, Connaught Place"
                        className="pl-10"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Speciality (Optional)
                    </label>
                    <Input
                      value={speciality}
                      onChange={(e) => setSpeciality(e.target.value)}
                      placeholder="e.g., Cardiology, Neurology, Emergency"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSearch}
                  disabled={searchMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {searchMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Search Hospitals
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="p-6 bg-red-50 border-red-200">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Emergency Numbers
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {results.emergency_numbers?.map((number, idx) => (
                      <a
                        key={idx}
                        href={`tel:${number}`}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                      >
                        {number}
                      </a>
                    ))}
                  </div>
                </Card>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Nearby Hospitals</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.hospitals?.map((hospital, idx) => (
                      <HospitalCard
                        key={idx}
                        hospital={hospital}
                        onSave={handleSaveHospital}
                      />
                    ))}
                  </div>
                </div>

                {results.doctors && results.doctors.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Specialist Doctors</h3>
                    <div className="space-y-2">
                      {results.doctors.map((doctor, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Badge className="bg-blue-600">{idx + 1}</Badge>
                          <span>{doctor}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedBackground>
  );
}

