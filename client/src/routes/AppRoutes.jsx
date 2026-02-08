import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import Layout from '../components/Layout';

// Public Pages
import HomePage from '../pages/HomePage';
import PlansPage from '../pages/PlansPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import TermsPage from '../pages/TermsPage';
import PrivacyPage from '../pages/PrivacyPage';
import Features from '../pages/Features';

import DocsPage from '../pages/Docs';
import PricingPage from '../pages/Pricing';
import IntegrationsPage from '../pages/Integrations';
import HelpPage from '../pages/Help';

// Auth Pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import SignupPage from '../pages/SignupPage';

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
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/integrations" element={<IntegrationsPage />} />
      <Route path="/help" element={<HelpPage />} />
      
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
      <Route path="/signup" element={<SignupPage />} />

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

      <Route path="/features" element={<Features />} />

      {/* Team invitation - public route (no Layout/auth required) */}
      <Route path="/team/invite/:token" element={<TeamInvitePage />} />

      {/* Catch-all route - redirect to home */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};

export default AppRoutes;
