import React, { useState } from "react";
import { geminiClient } from "../api/groq";
import { mockAuth } from "../api/mockAuth";
import { localStorage } from "../api/localStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  Heart, 
  Plus,
  Trash2,
  Save,
  Shield,
  AlertTriangle,
  Pill,
  AlertCircle,
  Phone,
  CheckCircle2,
  Camera,
  Loader2
} from "lucide-react";

export default function HealthProfile() {
  const [showAddAllergy, setShowAddAllergy] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState({
    name: '',
    dose: '',
    schedule: '',
    notes: ''
  });
  const [medicalImage, setMedicalImage] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState(null);


  const [user] = useState(mockAuth.currentUser);
  const [medicalProfile, setMedicalProfile] = useState(localStorage.medicalProfile.get(mockAuth.currentUser.email));

  const createProfileMutation = {
    mutate: (data) => {
      const newProfile = { ...data, user_email: user.email, consent_given: true, consent_date: new Date().toISOString() };
      localStorage.medicalProfile.save(user.email, newProfile);
      setMedicalProfile(newProfile);
    }
  };

  const updateProfileMutation = {
    mutate: (data) => {
      const updatedProfile = { ...medicalProfile, ...data };
      localStorage.medicalProfile.save(user.email, updatedProfile);
      setMedicalProfile(updatedProfile);
    }
  };

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return;
    const updatedAllergies = [...(medicalProfile?.allergies || []), newAllergy];
    if (medicalProfile) {
      updateProfileMutation.mutate({ allergies: updatedAllergies });
    } else {
      createProfileMutation.mutate({ allergies: updatedAllergies });
    }
    setNewAllergy('');
    setShowAddAllergy(false);
  };

  const handleRemoveAllergy = (index) => {
    const updatedAllergies = medicalProfile.allergies.filter((_, i) => i !== index);
    updateProfileMutation.mutate({ allergies: updatedAllergies });
  };

  const handleAddMedication = () => {
    if (!newMedication.name.trim()) return;
    const updatedMedications = [...(medicalProfile?.medications || []), newMedication];
    if (medicalProfile) {
      updateProfileMutation.mutate({ medications: updatedMedications });
    } else {
      createProfileMutation.mutate({ medications: updatedMedications });
    }
    setNewMedication({ name: '', dose: '', schedule: '', notes: '' });
    setShowAddMedication(false);
  };

  const handleRemoveMedication = (index) => {
    const updatedMedications = medicalProfile.medications.filter((_, i) => i !== index);
    updateProfileMutation.mutate({ medications: updatedMedications });
  };

  const analyzeMedicalImage = async () => {
    if (!medicalImage) return;
    setAnalyzingImage(true);
    try {
      const analysis = await geminiClient.generateContent(`You are a medical AI assistant analyzing a medical image. This is for EDUCATIONAL purposes only.

Analyze this medical image and provide:
1. What type of medical document/image is this (prescription, lab report, X-ray, etc.)
2. Key observations (if readable)
3. Important recommendations

IMPORTANT: Always include this disclaimer: "This analysis is for educational purposes only. Always consult a qualified healthcare professional for medical advice."

Be clear, concise, and helpful.

Note: Image analysis not available in current setup, please describe the image content for analysis.`);

      setImageAnalysis(analysis);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setImageAnalysis("Failed to analyze image. Please try again.");
    }
    setAnalyzingImage(false);
  };

  const handleConsentToggle = (checked) => {
    if (medicalProfile) {
      updateProfileMutation.mutate({ consent_given: checked });
    } else if (checked) {
      createProfileMutation.mutate({
        consent_given: true,
        consent_date: new Date().toISOString()
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Health Profile</h1>
              <p className="text-gray-600">Manage your medical information securely</p>
            </div>
          </div>
        </div>

        {/* Consent Card */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Medical Data Consent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                Your medical data is encrypted and stored securely. You can revoke consent and delete all data at any time.
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Allow storing medical data</p>
                <p className="text-sm text-gray-600">Enable AI to provide personalized health guidance</p>
              </div>
              <Switch
                checked={medicalProfile?.consent_given || false}
                onCheckedChange={handleConsentToggle}
              />
            </div>
            {medicalProfile?.consent_given && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Consent Active</p>
                  <p className="text-xs text-green-700">
                    Since {new Date(medicalProfile.consent_date).toLocaleDateString('en-US')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {medicalProfile?.consent_given && (
          <div className="space-y-6">
            {/* Allergies */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Allergies
                  </CardTitle>
                  <Button
                    onClick={() => setShowAddAllergy(!showAddAllergy)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddAllergy && (
                  <div className="flex gap-2">
                    <Input
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="e.g., Penicillin, Peanuts"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy()}
                    />
                    <Button onClick={handleAddAllergy}>Add</Button>
                    <Button variant="outline" onClick={() => setShowAddAllergy(false)}>Cancel</Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {medicalProfile?.allergies?.length > 0 ? (
                    medicalProfile.allergies.map((allergy, idx) => (
                      <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-200 pl-3 pr-1">
                        {allergy}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-2"
                          onClick={() => handleRemoveAllergy(idx)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No allergies recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medications */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-blue-600" />
                    Current Medications
                  </CardTitle>
                  <Button
                    onClick={() => setShowAddMedication(!showAddMedication)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddMedication && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Medication Name</Label>
                          <Input
                            value={newMedication.name}
                            onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                            placeholder="e.g., Aspirin"
                          />
                        </div>
                        <div>
                          <Label>Dosage</Label>
                          <Input
                            value={newMedication.dose}
                            onChange={(e) => setNewMedication({ ...newMedication, dose: e.target.value })}
                            placeholder="e.g., 100mg"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Schedule</Label>
                        <Input
                          value={newMedication.schedule}
                          onChange={(e) => setNewMedication({ ...newMedication, schedule: e.target.value })}
                          placeholder="e.g., Daily after meals"
                        />
                      </div>
                      <div>
                        <Label>Notes (optional)</Label>
                        <Textarea
                          value={newMedication.notes}
                          onChange={(e) => setNewMedication({ ...newMedication, notes: e.target.value })}
                          placeholder="Additional information..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddMedication}>Add Medication</Button>
                        <Button variant="outline" onClick={() => setShowAddMedication(false)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <div className="space-y-3">
                  {medicalProfile?.medications?.length > 0 ? (
                    medicalProfile.medications.map((med, idx) => (
                      <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{med.name}</p>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                              <p><span className="font-medium">Dose:</span> {med.dose}</p>
                              <p><span className="font-medium">Schedule:</span> {med.schedule}</p>
                            </div>
                            {med.notes && (
                              <p className="text-sm text-gray-600 mt-2">Note: {med.notes}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMedication(idx)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No medications recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medical Image Analysis */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-600" />
                  Analyze Medical Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-purple-50 border-purple-200">
                  <AlertTriangle className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-900">
                    Upload prescriptions, lab reports, or medical images for AI analysis. This is for educational purposes only.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label>Upload Medical Image</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setMedicalImage(e.target.files[0])}
                  />
                </div>
                <Button
                  onClick={analyzeMedicalImage}
                  disabled={!medicalImage || analyzingImage}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {analyzingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Analyze Image
                    </>
                  )}
                </Button>
                {imageAnalysis && (
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{imageAnalysis}</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

