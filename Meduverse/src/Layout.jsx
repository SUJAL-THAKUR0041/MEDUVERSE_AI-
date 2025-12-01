import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { Home, Building, User, LogOut, Activity, Sparkles, Pill, Video, Brain, Stethoscope, Shield, Users, BookOpen, ChevronDown, Menu, X } from "lucide-react";
import { mockAuth } from "./api/mockAuth";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "./components/Splash Screen";

export default function Layout({ children, currentPageName }) {
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const hasSeenInitialSplash = sessionStorage.getItem('hasSeenInitialSplash');
    if (!hasSeenInitialSplash) {
      setShowSplash(true);
      sessionStorage.setItem('hasSeenInitialSplash', 'true');
    }
    setMounted(true);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleLogoClick = () => {
    setShowSplash(true);
    setTimeout(() => {
      window.location.href = createPageUrl("Dashboard");
    }, 100);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      mockAuth.logout();
    }
  };

  const navCategories = {
    main: [
      { name: "Home", icon: Home, label: "Home", color: "text-emerald-600" },
    ],
    ai: {
      label: "AI Services",
      icon: Brain,
      color: "text-blue-600",
      items: [
        { name: "DoctorAgent", icon: Stethoscope, label: "Dr. AI" },
      ]
    },
    medical: {
      label: "Medical",
      icon: Stethoscope,
      color: "text-purple-600",
      items: [
        { name: "MedicalAnalysis", icon: Brain, label: "Analysis" },
        { name: "MedicalJournal", icon: BookOpen, label: "Journal" },
        { name: "DoctorNetwork", icon: Users, label: "Doctors" },
        { name: "HospitalFinder", icon: Building, label: "Hospitals" },

        { name: "Telemedicine", icon: Video, label: "Telemedicine" },
        { name: "DoctorAdmin", icon: Shield, label: "Doctor Admin" },
      ]
    },
    health: {
      label: "Health",
      icon: Activity,
      color: "text-teal-600",
      items: [
        { name: "HealthProfile", icon: User, label: "Health Profile" },
        { name: "HealthAnalytics", icon: Activity, label: "Analytics" },
        { name: "HealthTips", icon: Sparkles, label: "Health Tips" },
        { name: "HealthInsights", icon: Activity, label: "Insights" },
        { name: "MedicationReminders", icon: Pill, label: "Medication" },
      ]
    },
    productivity: {
      label: "Productivity",
      icon: Activity,
      color: "text-pink-600",
      items: [
        { name: "Tasks", icon: Activity, label: "Tasks" },
        { name: "Reminders", icon: Activity, label: "Reminders" },
      ]
    },
    account: [
      { name: "Profile", icon: User, label: "Profile", color: "text-gray-600" },
      { name: "Settings", icon: Activity, label: "Settings", color: "text-gray-500" },
    ]
  };

  if (!mounted) return null;

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  const NavLink = ({ item, onClose }) => {
    const Icon = item.icon;
    const isActive = currentPageName === item.name;
    return (
      <Link to={createPageUrl(item.name)} onClick={onClose}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className={`text-xs px-3 py-1 h-8 w-full justify-start ${isActive ? "bg-gradient-to-r from-emerald-600 to-teal-600" : ""}`}
          >
            <Icon className={`w-3 h-3 mr-2 ${!isActive ? item.color : ""}`} />
            <span className="text-xs">{item.label}</span>
          </Button>
        </motion.div>
      </Link>
    );
  };

  const Dropdown = ({ category, items }) => {
    const Icon = category.icon;
    const isOpen = openDropdown === category.label;

    return (
      <div className="relative group">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : category.label)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 h-8 rounded-md hover:bg-gray-100 transition-colors font-medium"
        >
          <Icon className={`w-4 h-4 ${category.color}`} />
          <span className="hidden lg:inline">{category.label}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-3 z-50"
            >
              {items.map((item, idx) => {
                const ItemIcon = item.icon;
                const isActive = currentPageName === item.name;
                return (
                  <Link key={item.name} to={createPageUrl(item.name)} onClick={() => setOpenDropdown(null)}>
                    <div className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer ${isActive ? 'bg-emerald-50 border-l-2 border-emerald-600' : 'border-l-2 border-transparent'}`}>
                      <ItemIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-600' : category.color}`} />
                      <span className={`text-sm font-medium ${isActive ? 'text-emerald-700' : 'text-gray-700'}`}>
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 bg-white border-b z-50 shadow-sm backdrop-blur-sm bg-white/95">
        <div className="w-full px-2 md:px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-2 cursor-pointer flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              onClick={handleLogoClick}
            >
              <motion.div 
                className="text-xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                💚
              </motion.div>
              <motion.span 
                className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent whitespace-nowrap"
                animate={{ opacity: [1, 0.8, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Meduverse
              </motion.span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 flex-1 ml-6">
              {navCategories.main.map((item) => (
                <NavLink key={item.name} item={item} onClose={() => {}} />
              ))}
              
              <Dropdown category={navCategories.ai} items={navCategories.ai.items} />
              <Dropdown category={navCategories.medical} items={navCategories.medical.items} />
              <Dropdown category={navCategories.health} items={navCategories.health.items} />
              <Dropdown category={navCategories.productivity} items={navCategories.productivity.items} />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                {navCategories.account.map((item) => (
                  <NavLink key={item.name} item={item} onClose={() => {}} />
                ))}
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs px-3 py-1 h-8" 
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="w-3 h-3 text-red-500" />
                  <span className="hidden sm:inline text-xs ml-1">Logout</span>
                </Button>
              </motion.div>

              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="sm"
                className="md:hidden h-8 w-8 p-0"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t bg-gradient-to-b from-white to-gray-50 max-h-96 overflow-y-auto"
            >
              <div className="px-3 py-4 space-y-3">
                {navCategories.main.map((item) => (
                  <NavLink key={item.name} item={item} onClose={() => setMobileMenuOpen(false)} />
                ))}
                
                {Object.entries(navCategories).filter(([k]) => !['main', 'account'].includes(k)).map(([key, category]) => (
                  <div key={key} className="space-y-2 border-b pb-3">
                    <div className="flex items-center gap-2 px-3 py-2">
                      {category.icon && <category.icon className={`w-4 h-4 ${category.color}`} />}
                      <h3 className="text-xs font-bold text-gray-900">{category.label}</h3>
                    </div>
                    <div className="space-y-1 pl-2">
                      {category.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = currentPageName === item.name;
                        return (
                          <Link key={item.name} to={createPageUrl(item.name)} onClick={() => setMobileMenuOpen(false)}>
                            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-md ${isActive ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100'}`}>
                              <ItemIcon className={`w-3.5 h-3.5`} />
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="border-t pt-3 space-y-1">
                  {navCategories.account.map((item) => (
                    <NavLink key={item.name} item={item} onClose={() => setMobileMenuOpen(false)} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Add padding to account for fixed navbar */}
      <main className="pt-16">{children}</main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <motion.p 
              className="mb-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              ⚠️ This is an AI assistant, not a medical diagnosis.
            </motion.p>
            <p>In case of emergency, immediately call 102/108 or visit nearest hospital.</p>
            <p className="mt-2 text-xs text-gray-500">Powered by Meduverse AI Technology</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

