import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Search, Phone, Clock, Star, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedBackground from "../components/Assistant/Animated Background";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom marker icons
const createCustomIcon = (iconUrl, iconSize = [25, 41], iconAnchor = [12, 41], popupAnchor = [1, -34]) => {
  return new L.Icon({
    iconUrl,
    iconSize,
    iconAnchor,
    popupAnchor,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};

// Hospital marker icon (red cross)
const hospitalIcon = createCustomIcon(
  'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 2.5 0.7 4.8 2 6.8L12.5 41l10.5-21.7c1.3-2 2-4.3 2-6.8C25 5.596 19.404 0 12.5 0z" fill="#dc2626"/>
      <path d="M12.5 2C6.15 2 1 7.15 1 13.5c0 2.2 0.6 4.2 1.7 5.8L12.5 39l9.8-19.7c1.1-1.6 1.7-3.6 1.7-5.8C24 7.15 18.85 2 12.5 2z" fill="#ffffff"/>
      <rect x="11" y="8" width="3" height="11" fill="#dc2626"/>
      <rect x="8" y="11" width="11" height="3" fill="#dc2626"/>
    </svg>
  `)
);

// User location marker icon (blue person)
const userIcon = createCustomIcon(
  'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 2.5 0.7 4.8 2 6.8L12.5 41l10.5-21.7c1.3-2 2-4.3 2-6.8C25 5.596 19.404 0 12.5 0z" fill="#2563eb"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#ffffff"/>
      <circle cx="12.5" cy="10" r="2" fill="#2563eb"/>
      <path d="M8 16c0-1.5 1.5-3 3.5-3h4c2 0 3.5 1.5 3.5 3v1H8v-1z" fill="#2563eb"/>
    </svg>
  `)
);

// Component to handle map controls
function MapController({ center }) {
  const map = useMap();

  React.useEffect(() => {
    if (center) {
      map.flyTo(center, 13, {
        duration: 2,
        easeLinearity: 0.25
      });
    }
  }, [center, map]);

  return null;
}

export default function Maps() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const mapRef = useRef(null);
  const [hospitals] = useState([
    {
      id: 1,
      name: "AIIMS Delhi",
      address: "Ansari Nagar, New Delhi, Delhi 110029",
      lat: 28.5672,
      lng: 77.2100,
      distance: "2.5 km",
      rating: 4.8,
      phone: "+91-11-26588500",
      specialty: "Multi-specialty",
      emergency: true
    },
    {
      id: 2,
      name: "Apollo Hospitals",
      address: "Jubilee Hills, Hyderabad, Telangana 500033",
      lat: 17.4065,
      lng: 78.4772,
      distance: "5.1 km",
      rating: 4.6,
      phone: "+91-40-23607777",
      specialty: "Cardiology, Oncology",
      emergency: true
    },
    {
      id: 3,
      name: "Max Super Speciality Hospital",
      address: "Press Enclave Road, Saket, New Delhi",
      lat: 28.5273,
      lng: 77.2198,
      distance: "3.8 km",
      rating: 4.5,
      phone: "+91-11-26515050",
      specialty: "Neurology, Orthopedics",
      emergency: true
    }
  ]);

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUseMyLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = [latitude, longitude];
          setUserLocation(newLocation);
          setMapCenter(newLocation);
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
          // Fallback to Delhi coordinates if location access is denied
          const delhiCoords = [28.6139, 77.2090];
          setMapCenter(delhiCoords);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      setIsLocating(false);
    }
  };

  return (
    <AnimatedBackground variant="blue">
      <div className="max-w-6xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <motion.h1
            className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3"
            animate={{
              backgroundPosition: ['0%', '100%', '0%']
            }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            Hospital Locator 🗺️
          </motion.h1>
          <p className="text-xl text-gray-700">Find the nearest healthcare facilities</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hospitals by name or specialty..."
                  className="pl-10 border-2 border-blue-300 focus:border-blue-500"
                />
              </div>
              <Button
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLocating ? (
                  <>
                    <Navigation className="w-5 h-5 mr-2 animate-spin" />
                    Locating...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 mr-2" />
                    Use My Location
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="h-96 rounded-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <MapController center={mapCenter} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {userLocation && (
                  <Marker position={userLocation} icon={userIcon}>
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-lg">Your Location</h3>
                        <p className="text-sm text-gray-600">You are here</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                {filteredHospitals.map((hospital) => (
                  <Marker key={hospital.id} position={[hospital.lat, hospital.lng]} icon={hospitalIcon}>
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-lg">{hospital.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{hospital.address}</p>
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm">{hospital.rating}</span>
                        </div>
                        <p className="text-sm text-gray-600">{hospital.specialty}</p>
                        <p className="text-sm text-gray-600">{hospital.phone}</p>
                        {hospital.emergency && (
                          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full mt-2 inline-block">
                            24/7 Emergency
                          </span>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((hospital, index) => (
            <motion.div
              key={hospital.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-blue-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{hospital.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{hospital.rating}</span>
                      <span className="text-sm text-gray-500">• {hospital.distance}</span>
                    </div>
                  </div>
                  {hospital.emergency && (
                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                      24/7 Emergency
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-3">{hospital.address}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{hospital.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{hospital.phone}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Directions
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredHospitals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hospitals found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
            <div className="flex items-center justify-center gap-3">
              <div className="text-2xl">🚨</div>
              <div className="text-left">
                <p className="font-semibold text-red-800">Emergency Services</p>
                <p className="text-sm text-red-700">Call 102 (Ambulance) or 108 (Emergency) for immediate assistance</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatedBackground>
  );
}
