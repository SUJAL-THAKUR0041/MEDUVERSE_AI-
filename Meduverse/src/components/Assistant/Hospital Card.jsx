import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Navigation, Bookmark } from "lucide-react";

export default function HospitalCard({ hospital, onSave }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{hospital.name}</CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onSave(hospital)}
          >
            <Bookmark className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
          <span>{hospital.address}</span>
        </div>
        
        {hospital.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-500" />
            <a href={`tel:${hospital.phone}`} className="text-indigo-600 hover:underline">
              {hospital.phone}
            </a>
          </div>
        )}
        
        {hospital.distance && (
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{hospital.distance}</span>
          </div>
        )}
        
        {hospital.speciality && (
          <Badge className="bg-emerald-100 text-emerald-800">
            {hospital.speciality}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

