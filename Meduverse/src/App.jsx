import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './Layout';

// Import all page components
import HomePage from './pages/Home Page';
import DoctorAgent from './pages/Doctor Agent';
import MedicalAssistant from './pages/Medical Assistant';
import MedicalAnalysis from './pages/Medical Analysis Code';
import MedicalJournal from './pages/Medical Journal Code';
import DoctorNetwork from './pages/Doctor Network';
import HospitalFinder from './pages/Hospital Finder';
import Telemedicine from './pages/Telemedicine Code';
import DoctorAdmin from './pages/Doctor Admin';
import MedicationReminders from './pages/Medication Remainders Code';
import HealthAnalytics from './pages/Health Analytics';
import HealthTips from './pages/Health Tips';
import ProfilePage from './pages/Profile Page Code';
import HealthProfile from './pages/Health Profile';
import HealthInsights from './pages/Health Insights';
import EducationalAssistant from './pages/Educational Assistant';
import LearningPaths from './pages/Learning Paths';
import StudyHub from './pages/Study Hub Code';
import Tasks from './pages/Tasks Code';
import Reminders from './pages/Reminders code';
import Settings from './pages/settings code';
import Maps from './pages/Maps';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Home / Dashboard */}
          <Route path="/" element={
            <Layout currentPageName="Home">
              <HomePage />
            </Layout>
          } />

          {/* AI & Medical Assistance */}
          <Route path="/doctor-agent" element={
            <Layout currentPageName="DoctorAgent">
              <DoctorAgent />
            </Layout>
          } />

          <Route path="/medical-assistant" element={
            <Layout currentPageName="MedicalAssistant">
              <MedicalAssistant />
            </Layout>
          } />

          <Route path="/medical-analysis" element={
            <Layout currentPageName="MedicalAnalysis">
              <MedicalAnalysis />
            </Layout>
          } />

          <Route path="/medical-journal" element={
            <Layout currentPageName="MedicalJournal">
              <MedicalJournal />
            </Layout>
          } />

          {/* Healthcare Services */}
          <Route path="/doctor-network" element={
            <Layout currentPageName="DoctorNetwork">
              <DoctorNetwork />
            </Layout>
          } />

          <Route path="/hospital-finder" element={
            <Layout currentPageName="HospitalFinder">
              <HospitalFinder />
            </Layout>
          } />

          <Route path="/telemedicine" element={
            <Layout currentPageName="Telemedicine">
              <Telemedicine />
            </Layout>
          } />

          <Route path="/doctor-admin" element={
            <Layout currentPageName="DoctorAdmin">
              <DoctorAdmin />
            </Layout>
          } />

          {/* Health Management */}
          <Route path="/medication-reminders" element={
            <Layout currentPageName="MedicationReminders">
              <MedicationReminders />
            </Layout>
          } />

          <Route path="/health-analytics" element={
            <Layout currentPageName="HealthAnalytics">
              <HealthAnalytics />
            </Layout>
          } />

          <Route path="/health-tips" element={
            <Layout currentPageName="HealthTips">
              <HealthTips />
            </Layout>
          } />

          <Route path="/health-profile" element={
            <Layout currentPageName="HealthProfile">
              <HealthProfile />
            </Layout>
          } />

          <Route path="/health-insights" element={
            <Layout currentPageName="HealthInsights">
              <HealthInsights />
            </Layout>
          } />

          {/* Education & Learning */}
          <Route path="/educational-assistant" element={
            <Layout currentPageName="EducationalAssistant">
              <EducationalAssistant />
            </Layout>
          } />

          <Route path="/learning-paths" element={
            <Layout currentPageName="LearningPaths">
              <LearningPaths />
            </Layout>
          } />

          <Route path="/study-hub" element={
            <Layout currentPageName="StudyHub">
              <StudyHub />
            </Layout>
          } />

          {/* Productivity */}
          <Route path="/tasks" element={
            <Layout currentPageName="Tasks">
              <Tasks />
            </Layout>
          } />

          <Route path="/reminders" element={
            <Layout currentPageName="Reminders">
              <Reminders />
            </Layout>
          } />

          {/* User Settings & Profile */}
          <Route path="/profile" element={
            <Layout currentPageName="Profile">
              <ProfilePage />
            </Layout>
          } />

          <Route path="/settings" element={
            <Layout currentPageName="Settings">
              <Settings />
            </Layout>
          } />

          <Route path="/maps" element={
            <Layout currentPageName="Maps">
              <Maps />
            </Layout>
          } />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
