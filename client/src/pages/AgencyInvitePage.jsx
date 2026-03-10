import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import PublicSeo from '../components/PublicSeo';

const AgencyInvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token');
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const response = await api.get(`/agency/invitations/${token}`);
        if (!response.data?.success) {
          setError(response.data?.error || 'Invitation not available');
          return;
        }
        setInvitation(response.data.invitation || null);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.error || 'Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const acceptInvitation = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setAccepting(true);
    setError(null);
    try {
      const response = await api.post(`/agency/invitations/${token}/accept`);
      if (response.data?.success) {
        navigate('/agency');
        return;
      }
      setError(response.data?.error || 'Failed to accept invitation');
    } catch (acceptError) {
      setError(acceptError?.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const declineInvitation = async () => {
    setDeclining(true);
    setError(null);
    try {
      const response = await api.post(`/agency/invitations/${token}/decline`);
      if (!response.data?.success) {
        setError(response.data?.error || 'Failed to decline invitation');
        return;
      }
      setDeclined(true);
    } catch (declineError) {
      setError(declineError?.response?.data?.error || 'Failed to decline invitation');
    } finally {
      setDeclining(false);
    }
  };

  const canonicalPath = window.location.pathname;

  if (loading) {
    return (
      <>
        <PublicSeo
          title="Agency Invitation | SuiteGenie"
          description="View and accept your SuiteGenie agency invitation."
          canonicalPath={canonicalPath}
          noIndex
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading invitation...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PublicSeo
          title="Invalid Agency Invitation | SuiteGenie"
          description="This agency invitation is invalid, expired, or no longer available."
          canonicalPath={canonicalPath}
          noIndex
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Not Available</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </>
    );
  }

  if (declined) {
    return (
      <>
        <PublicSeo
          title="Invitation Declined | SuiteGenie"
          description="This agency invitation was declined."
          canonicalPath={canonicalPath}
          noIndex
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <XCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Declined</h1>
            <p className="text-gray-600 mb-6">You have declined the agency invitation.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PublicSeo
        title={`Join ${invitation?.agency_name || 'an Agency'} on SuiteGenie`}
        description="Accept your SuiteGenie agency invitation to access workspace-based team operations."
        canonicalPath={canonicalPath}
        noIndex
      />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Agency Invitation</h1>
            <p className="text-gray-600">You have been invited to an agency workspace.</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900">{invitation?.agency_name}</h3>
            <p className="text-sm text-gray-600 mt-2">
              Invited by: {invitation?.inviter_name || invitation?.inviter_email}
            </p>
            <p className="text-sm text-gray-600">
              Role: <span className="font-medium">{invitation?.role}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Expires: {invitation?.expires_at ? new Date(invitation.expires_at).toLocaleString() : 'N/A'}
            </p>
          </div>

          {!user ? (
            <div className="space-y-4">
              <p className="text-center text-gray-600">Log in to accept this invitation</p>
              <button
                onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Log In to Accept
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={acceptInvitation}
                disabled={accepting}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Accept Invitation
                  </>
                )}
              </button>
              <button
                onClick={declineInvitation}
                disabled={declining}
                className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
              >
                {declining ? 'Declining...' : 'Decline'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AgencyInvitePage;

