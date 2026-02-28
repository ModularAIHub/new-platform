// TeamInvitePage.jsx - Handle team invitation acceptance
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import PublicSeo from '../components/PublicSeo';

const TeamInvitePage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [invitation, setInvitation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [declined, setDeclined] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (token) {
            fetchInvitation();
        }
    }, [token]);

    const fetchInvitation = async () => {
        try {
            const response = await api.get(`/pro-team/invitations/${token}`);

            if (response.data.success) {
                setInvitation(response.data.invitation);
            } else {
                setError(response.data.error || 'Invalid invitation');
            }
        } catch (fetchError) {
            console.error('Failed to fetch invitation:', fetchError);
            setError('Failed to load invitation. It may be expired or invalid.');
        } finally {
            setLoading(false);
        }
    };

    const acceptInvitation = async () => {
        if (!user) {
            navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        setAccepting(true);
        try {
            const response = await api.post(`/pro-team/invitations/${token}/accept`);

            if (response.data.success) {
                navigate('/team');
            } else {
                setError(response.data.error || 'Failed to accept invitation');
            }
        } catch (acceptError) {
            console.error('Failed to accept invitation:', acceptError);
            setError('Failed to accept invitation. Please try again.');
        } finally {
            setAccepting(false);
        }
    };

    const declineInvitation = async () => {
        try {
            await api.post(`/pro-team/invitations/${token}/decline`);
            setDeclined(true);
        } catch (declineError) {
            console.error('Failed to decline invitation:', declineError);
            setError('Failed to decline invitation');
        }
    };

    const canonicalPath = window.location.pathname;

    if (loading) {
        return (
            <>
                <PublicSeo
                    title="Team Invitation | SuiteGenie"
                    description="View and accept your SuiteGenie team invitation."
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
                    title="Invalid Team Invitation | SuiteGenie"
                    description="This SuiteGenie team invitation is invalid, expired, or no longer available."
                    canonicalPath={canonicalPath}
                    noIndex
                />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invitation</h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Home
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
                    description="This SuiteGenie team invitation was declined."
                    canonicalPath={canonicalPath}
                    noIndex
                />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                        <XCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Declined</h1>
                        <p className="text-gray-600 mb-6">You have declined the team invitation.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <PublicSeo
                title={`Join ${invitation?.team_name || 'a Team'} on SuiteGenie`}
                description="Accept your SuiteGenie team invitation and collaborate on social media strategy, scheduling, publishing, and analytics."
                canonicalPath={canonicalPath}
                noIndex
            />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                    <div className="text-center mb-8">
                        <Crown className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h1>
                        <p className="text-gray-600">You&apos;ve been invited to join a Pro team!</p>
                    </div>

                    {invitation && (
                        <div className="bg-blue-50 rounded-lg p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="h-6 w-6 text-blue-600" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">{invitation.team_name}</h3>
                                    <p className="text-sm text-gray-600">Pro Team Collaboration</p>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600 space-y-2">
                                <p><strong>Invited by:</strong> {invitation.inviter_name || invitation.inviter_email}</p>
                                <p><strong>Invitation sent:</strong> {new Date(invitation.created_at).toLocaleDateString()}</p>
                            </div>

                            <div className="mt-4 p-4 bg-white rounded border-l-4 border-blue-500">
                                <h4 className="font-medium text-gray-900 mb-2">As a team member, you&apos;ll get:</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>Access to shared social accounts</li>
                                    <li>Collaborative content creation</li>
                                    <li>Team analytics and insights</li>
                                    <li>Shared scheduling and posting</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {!user ? (
                        <div className="space-y-4">
                            <p className="text-center text-gray-600 mb-4">Please log in to accept this invitation</p>
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
                                className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Decline
                            </button>
                        </div>
                    )}

                    <div className="text-center mt-6">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TeamInvitePage;
