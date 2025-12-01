
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Heart, AlertTriangle, Phone, MapPin, Save, Plus, X } from "lucide-react";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [newItem, setNewItem] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => mockAuth.currentUser,
  });

  const { data: medicalProfile, isLoading } = useQuery({
    queryKey: ['medicalProfile', user?.email],
    queryFn: async () => {
      const profiles = await localStorage.MedicalProfile?.get(user.email) || [];
      return profiles[0];
    },
    enabled: !!user?.email,
  });

  const [formData, setFormData] = useState({
    age: "",
    blood_group: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    location: "",
    consent_given: false
  });

  useEffect(() => {
    if (medicalProfile) {
      setFormData({
        age: medicalProfile.age || "",
        blood_group: medicalProfile.blood_group || "",
        emergency_contact_name: medicalProfile.emergency_contact_name || "",
        emergency_contact_phone: medicalProfile.emergency_contact_phone || "",
        location: medicalProfile.location || "",
        consent_given: medicalProfile.consent_given || false
      });
      setAllergies(medicalProfile.allergies || []);
      setConditions(medicalProfile.chronic_conditions || []);
      setMedications(medicalProfile.current_medications || []);
    }
  }, [medicalProfile]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (medicalProfile) {
        return localStorage.MedicalProfile?.save(user.email, updatedData);
      } else {
        return localStorage.MedicalProfile?.save(user.email, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicalProfile'] });
      alert("Profile saved successfully!");
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      allergies,
      chronic_conditions: conditions,
      current_medications: medications
    });
  };

  const addItem = (type) => {
    if (!newItem.trim()) return;
    
    if (type === 'allergy') {
      setAllergies([...allergies, newItem]);
    } else if (type === 'condition') {
      setConditions([...conditions, newItem]);
    } else if (type === 'medication') {
      setMedications([...medications, newItem]);
    }
    setNewItem("");
  };

  const removeItem = (type, index) => {
    if (type === 'allergy') {
      setAllergies(allergies.filter((_, i) => i !== index));
    } else if (type === 'condition') {
      setConditions(conditions.filter((_, i) => i !== index));
    } else if (type === 'medication') {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Profile</h1>
          <p className="text-gray-600">Keep your information secure and get better recommendations</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label>Blood Group</Label>
                  <Select
                    value={formData.blood_group}
                    onValueChange={(value) => setFormData({...formData, blood_group: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Your City/Area
                </Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Mumbai, Andheri"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Contact Person Name</Label>
                <Input
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  placeholder="Name"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  placeholder="+91 1234567890"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Allergies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add allergy (e.g., Penicillin, Peanuts)"
                  onKeyPress={(e) => e.key === 'Enter' && addItem('allergy')}
                />
                <Button onClick={() => addItem('allergy')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, idx) => (
                  <Badge key={idx} className="bg-red-100 text-red-800">
                    {allergy}
                    <button
                      onClick={() => removeItem('allergy', idx)}
                      className="ml-2 hover:text-red-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Chronic Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add condition (e.g., Diabetes, High BP)"
                  onKeyPress={(e) => e.key === 'Enter' && addItem('condition')}
                />
                <Button onClick={() => addItem('condition')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {conditions.map((condition, idx) => (
                  <Badge key={idx} className="bg-pink-100 text-pink-800">
                    {condition}
                    <button
                      onClick={() => removeItem('condition', idx)}
                      className="ml-2 hover:text-pink-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💊 Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add medication"
                  onKeyPress={(e) => e.key === 'Enter' && addItem('medication')}
                />
                <Button onClick={() => addItem('medication')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {medications.map((medication, idx) => (
                  <Badge key={idx} className="bg-blue-100 text-blue-800">
                    {medication}
                    <button
                      onClick={() => removeItem('medication', idx)}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={formData.consent_given}
                  onCheckedChange={(checked) => setFormData({...formData, consent_given: checked})}
                />
                <div>
                  <Label htmlFor="consent" className="font-medium cursor-pointer">
                    I consent to use my medical information
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    This information will only be used for better suggestions and kept secure.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
          >
            <Save className="w-5 h-5 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}

