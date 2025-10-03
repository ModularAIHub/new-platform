import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import Layout from '../components/Layout';

// Public Pages
import HomePage from '../pages/HomePage';
import PlansPage from '../pages/PlansPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';

// Auth Pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Protected Pages
import DashboardPage from '../pages/DashboardPage';
import CreditsPage from '../pages/CreditsPage';
import ApiKeysPage from '../pages/ApiKeysPage';
import SettingsPage from '../pages/SettingsPage';
import TeamPage from '../pages/TeamPage';
import TeamInvitePage from '../pages/TeamInvitePage';


// OnboardingPage import removed
import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// OnboardingGuard removed

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      
      {/* Guest routes - redirect to dashboard if already logged in */}
      <Route path="/login" element={
        <GuestRoute>
          <LoginPage />
        </GuestRoute>
      } />
      <Route path="/register" element={
        <GuestRoute>
          <RegisterPage />
        </GuestRoute>
      } />

      {/* Protected routes - require authentication */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/credits" element={
        <ProtectedRoute>
          <Layout>
            <CreditsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/api-keys" element={
        <ProtectedRoute>
          <Layout>
            <ApiKeysPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <SettingsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/team" element={
        <ProtectedRoute>
          <Layout>
            <TeamPage />
          </Layout>
        </ProtectedRoute>
      } />



      {/* Team invitation - public route (no Layout/auth required) */}
      <Route path="/team/invite/:token" element={<TeamInvitePage />} />

      {/* Catch-all route - redirect to home */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};

export default AppRoutes;
