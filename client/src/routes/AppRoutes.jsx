import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import Layout from '../components/Layout';

const HomePage = lazy(() => import('../pages/HomePage'));
const PlansPage = lazy(() => import('../pages/PlansPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));
const Features = lazy(() => import('../pages/Features'));
const DocsPage = lazy(() => import('../pages/Docs'));
const PricingPage = lazy(() => import('../pages/Pricing'));
const IntegrationsPage = lazy(() => import('../pages/Integrations'));
const HelpPage = lazy(() => import('../pages/Help'));
const BlogPage = lazy(() => import('../pages/Blog'));
const BlogPostPage = lazy(() => import('../pages/BlogPost'));
const BlogCategoryPage = lazy(() => import('../pages/BlogCategory'));
const BlogSearchPage = lazy(() => import('../pages/BlogSearch'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const SignupPage = lazy(() => import('../pages/SignupPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CreditsPage = lazy(() => import('../pages/CreditsPage'));
const ApiKeysPage = lazy(() => import('../pages/ApiKeysPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const TeamPage = lazy(() => import('../pages/TeamPage'));
const TeamInvitePage = lazy(() => import('../pages/TeamInvitePage'));
const AgencyHubPage = lazy(() => import('../pages/AgencyHubPage'));
const AgencyWorkspacePage = lazy(() => import('../pages/AgencyWorkspacePage'));
const AgencyInvitePage = lazy(() => import('../pages/AgencyInvitePage'));
const AgencyApprovalPortalPage = lazy(() => import('../pages/AgencyApprovalPortalPage'));

import { useAuth } from '../contexts/AuthContext';

// OnboardingGuard removed

const RouteLoader = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading...
      </div>
    }
  >
    {children}
  </Suspense>
);

const AppRoutes = () => {
  const { user } = useAuth();
  const userPlanType = String(user?.planType || user?.plan_type || '').trim().toLowerCase();
  const isAgencyPlan = userPlanType === 'agency';

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RouteLoader><HomePage /></RouteLoader>} />
      <Route path="/plans" element={<RouteLoader><PlansPage /></RouteLoader>} />
      <Route path="/about" element={<RouteLoader><AboutPage /></RouteLoader>} />
      <Route path="/contact" element={<RouteLoader><ContactPage /></RouteLoader>} />
      <Route path="/terms" element={<RouteLoader><TermsPage /></RouteLoader>} />
      <Route path="/privacy" element={<RouteLoader><PrivacyPage /></RouteLoader>} />
      <Route path="/pricing" element={<RouteLoader><PricingPage /></RouteLoader>} />
      <Route path="/docs" element={<RouteLoader><DocsPage /></RouteLoader>} />
      <Route path="/integrations" element={<RouteLoader><IntegrationsPage /></RouteLoader>} />
      <Route path="/help" element={<RouteLoader><HelpPage /></RouteLoader>} />
      <Route path="/blogs" element={<RouteLoader><BlogPage /></RouteLoader>} />
      <Route path="/blogs/search" element={<RouteLoader><BlogSearchPage /></RouteLoader>} />
      <Route path="/blogs/category/:name" element={<RouteLoader><BlogCategoryPage /></RouteLoader>} />
      <Route path="/blogs/:category/:slug" element={<RouteLoader><BlogPostPage /></RouteLoader>} />

      {/* Guest routes - redirect to dashboard if already logged in */}
      <Route path="/login" element={
        <GuestRoute>
          <RouteLoader>
            <LoginPage />
          </RouteLoader>
        </GuestRoute>
      } />
      <Route path="/register" element={
        <GuestRoute>
          <RouteLoader>
            <RegisterPage />
          </RouteLoader>
        </GuestRoute>
      } />
      <Route path="/signup" element={<RouteLoader><SignupPage /></RouteLoader>} />

      {/* Protected routes - require authentication */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <RouteLoader>
              <DashboardPage />
            </RouteLoader>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/credits" element={
        <ProtectedRoute>
          <Layout>
            <RouteLoader>
              <CreditsPage />
            </RouteLoader>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/api-keys" element={
        <ProtectedRoute>
          <Layout>
            <RouteLoader>
              <ApiKeysPage />
            </RouteLoader>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <RouteLoader>
              <SettingsPage />
            </RouteLoader>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/team" element={
        <ProtectedRoute>
          {isAgencyPlan ? (
            <Navigate to="/agency" replace />
          ) : (
            <Layout>
              <RouteLoader>
                <TeamPage />
              </RouteLoader>
            </Layout>
          )}
        </ProtectedRoute>
      } />

      <Route path="/agency" element={
        <ProtectedRoute>
          <Layout>
            <RouteLoader>
              <AgencyHubPage />
            </RouteLoader>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/agency/workspaces/:workspaceId" element={
        <ProtectedRoute>
          <RouteLoader>
            <AgencyWorkspacePage />
          </RouteLoader>
        </ProtectedRoute>
      } />

      <Route path="/agency/team" element={
        <ProtectedRoute>
          <Navigate to="/agency" replace />
        </ProtectedRoute>
      } />

      <Route path="/features" element={<RouteLoader><Features /></RouteLoader>} />

      {/* Team invitation - public route (no Layout/auth required) */}
      <Route path="/team/invite/:token" element={<RouteLoader><TeamInvitePage /></RouteLoader>} />
      <Route path="/agency/invite/:token" element={<RouteLoader><AgencyInvitePage /></RouteLoader>} />
      <Route path="/agency/approve/:token" element={<RouteLoader><AgencyApprovalPortalPage /></RouteLoader>} />

      {/* Catch-all route - redirect to home */}
      <Route path="*" element={<RouteLoader><HomePage /></RouteLoader>} />
    </Routes>
  );
};

export default AppRoutes;
