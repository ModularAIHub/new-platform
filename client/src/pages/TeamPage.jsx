// TeamPage.jsx - Pro plan team collaboration
import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, UserX, Crown, Shield, Eye, Edit, Linkedin, Twitter, ExternalLink, Globe, MessageSquare, LogOut, Trash2, RefreshCw, Building2, User, AtSign } from 'lucide-react';
import usePlanAccess from '../hooks/usePlanAccess';
import UpgradePrompt from '../components/UpgradePrompt';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { loadRazorpayScript } from '../utils/payment';

const TeamPage = () => {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [teamName, setTeamName] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteErrorMessage, setInviteErrorMessage] = useState('');
    const [leaving, setLeaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const [socialAccounts, setSocialAccounts] = useState([]);
    const [socialAccountsApiResponse, setSocialAccountsApiResponse] = useState(null);
    const [userPermissions, setUserPermissions] = useState({ role: null, permissions: [], limits: null });
    const [connecting, setConnecting] = useState(null);
    const { hasFeatureAccess, userPlan, refreshPlanInfo, loading: planLoading } = usePlanAccess();
    const { user, refreshUser } = useAuth();
    const [hasRetriedCreate, setHasRetriedCreate] = useState(false);
    
    // LinkedIn account selection modal state
    const [showLinkedInSelection, setShowLinkedInSelection] = useState(false);
    const [linkedInSelectionData, setLinkedInSelectionData] = useState(null);
    const [selectingAccount, setSelectingAccount] = useState(false);

    const hasTeamAccess = hasFeatureAccess('team_collaboration');

    const handleTeamUpgradeCheckout = async () => {
        if (upgrading) {
            return;
        }

        if (!user) {
            window.location.href = '/register?plan=pro';
            return;
        }

        const latestPlan = await refreshPlanInfo();
        const authoritativePlanType = String(
            latestPlan?.individualPlan ||
            latestPlan?.type ||
            userPlan?.individualPlan ||
            userPlan?.type ||
            user?.planType ||
            user?.plan_type ||
            'free'
        ).toLowerCase();

        if (authoritativePlanType === 'pro') {
            toast.success('You are already a Pro user!');
            await refreshPlanInfo();
            await fetchTeam();
            setShowUpgrade(false);
            return;
        }

        if (authoritativePlanType === 'enterprise') {
            toast.success('You are already on Enterprise.');
            await refreshPlanInfo();
            await fetchTeam();
            setShowUpgrade(false);
            return;
        }

        setUpgrading(true);
        try {
            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                toast.error('Failed to load payment gateway. Please try again.');
                return;
            }

            const orderResponse = await api.post('/payments/create-order', {
                type: 'plan',
                package: 'pro',
            });

            const { orderId, amount, currency, description, demo } = orderResponse.data || {};

            if (!orderId) {
                toast.error('Failed to initialize checkout. Please try again.');
                return;
            }

            if (demo) {
                const confirmDemo = window.confirm(
                    'DEMO MODE: This is a simulated Pro upgrade payment. Continue?'
                );

                if (!confirmDemo) {
                    return;
                }

                const verifyResponse = await api.post('/payments/verify', {
                    razorpayOrderId: orderId,
                    razorpayPaymentId: 'demo_payment_id',
                    razorpaySignature: 'demo_signature',
                });

                await refreshUser();
                await refreshPlanInfo();
                await fetchTeam();
                toast.success(verifyResponse.data?.message || 'Pro plan activated successfully.');
                setShowUpgrade(false);
                return;
            }

            const razorpayKey = orderResponse.data.razorpayKey || import.meta.env.VITE_RAZORPAY_KEY_ID || '';
            if (!razorpayKey) {
                toast.error('Payment configuration is incomplete. Please contact support.');
                return;
            }

            if (!window.Razorpay) {
                toast.error('Payment gateway failed to initialize. Please refresh and try again.');
                return;
            }

            await new Promise((resolve, reject) => {
                const razorpay = new window.Razorpay({
                    key: razorpayKey,
                    amount,
                    currency,
                    name: 'SuiteGenie',
                    description,
                    order_id: orderId,
                    handler: async (response) => {
                        try {
                            const verifyResponse = await api.post('/payments/verify', {
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                            });

                            await refreshUser();
                            await refreshPlanInfo();
                            await fetchTeam();
                            toast.success(verifyResponse.data?.message || 'Pro plan activated successfully.');
                            resolve(verifyResponse.data);
                        } catch (verificationError) {
                            reject(verificationError);
                        }
                    },
                    prefill: {
                        name: user?.name || 'SuiteGenie User',
                        email: user?.email || undefined,
                    },
                    theme: {
                        color: '#2563eb',
                    },
                    modal: {
                        ondismiss: () => {
                            reject(new Error('CHECKOUT_DISMISSED'));
                        },
                    },
                });

                razorpay.on('payment.failed', (failure) => {
                    const reason = failure?.error?.description || 'Payment failed. Please try again.';
                    reject(new Error(reason));
                });

                razorpay.open();
            });

            setShowUpgrade(false);
        } catch (error) {
            if (error?.message === 'CHECKOUT_DISMISSED') {
                toast.error('Payment was cancelled.');
            } else {
                toast.error(error?.response?.data?.error || error?.message || 'Failed to upgrade to Pro.');
            }
        } finally {
            setUpgrading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    useEffect(() => {
        if (team) {
            fetchSocialAccounts();
            fetchUserPermissions();
            // Debug log for team info
            console.log('[DEBUG] team:', team);
        }
    }, [team]);

    const connectTwitterOAuth1 = async () => {
    setConnecting('twitter-oauth1');
    try {
        // Debug logs
        console.log('[DEBUG] connectTwitterOAuth1: team', team);
        console.log('[DEBUG] connectTwitterOAuth1: userPermissions', userPermissions);

        // Robust teamId/userId extraction
        const teamId = team?.id || userPermissions?.team_id || userPermissions?.teamId;
        let userId = user?.id || userPermissions?.user_id || userPermissions?.userId || team?.user_id;

        // Fallback: try to get from team members
        if (!userId && team?.members) {
            const currentMember = team.members.find(
                m => m.role === userPermissions?.role && m.user_id
            );
            userId = currentMember?.user_id || currentMember?.userid;
        }

        // Fallback: try to get from API if not found
        if (!userId) {
            try {
                const userResponse = await api.get('/auth/me');
                userId = userResponse.data?.id || userResponse.data?.user?.id;
                console.log('[debug] Got userId from /auth/me:', userId);
            } catch (err) {
                console.error('Failed to get user from /auth/me:', err);
            }
        }

        // Final fallback: try to get from localStorage
        if (!userId) {
            try {
                userId = localStorage.getItem('userId');
                if (userId) {
                    console.log('[debug] Got userId from localStorage:', userId);
                }
            } catch (err) {
                console.error('Failed to get userId from localStorage:', err);
            }
        }

        const returnUrl = window.location.origin + '/team';
        console.log('[debug] Attempting OAuth1 with:', { teamId, userId, team, userPermissions });

        if (!teamId) {
            alert('No team found. Please refresh the page.');
            setConnecting(null);
            return;
        }
        if (!userId) {
            alert('Could not determine user ID. Please check console and backend logs.');
            setConnecting(null);
            return;
        }

        const apiBase =
            import.meta.env.VITE_TWEET_GENIE_API_URL ||
            (import.meta.env.MODE === 'production'
                ? 'https://tweetapi.suitegenie.in'
                : 'http://localhost:3002');

        const twitterOAuth1Url =
            `${apiBase}/api/twitter/team-connect-oauth1` +
            `?teamId=${encodeURIComponent(teamId)}` +
            `&userId=${encodeURIComponent(userId)}` +
            `&returnUrl=${encodeURIComponent(returnUrl)}`;

        window.location.href = twitterOAuth1Url;
    } catch (error) {
        console.error('Twitter OAuth1.0a connection failed:', error);
        alert('Failed to initiate Twitter OAuth1.0a connection. Please check your network and backend logs.');
    } finally {
        setConnecting(null);
    }
};


    // Handle OAuth callback success
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');
        const username = urlParams.get('username');
        const error = urlParams.get('error');
        const accountName = urlParams.get('accountName');
        const existingTeam = urlParams.get('existingTeam');

        // Check for LinkedIn account selection flow
        const selectLinkedIn = urlParams.get('select_linkedin_account');
        const selectionId = urlParams.get('selectionId');
        const organizationsParam = urlParams.get('organizations');
        const personalConnected = urlParams.get('personalConnected') === 'true';
        const userName = urlParams.get('userName');

        if (selectLinkedIn === 'true' && selectionId && organizationsParam) {
            try {
                const organizations = JSON.parse(decodeURIComponent(organizationsParam));
                setLinkedInSelectionData({
                    selectionId,
                    organizations,
                    personalConnected,
                    userName
                });
                setShowLinkedInSelection(true);
                // Clean up URL but keep the modal open
                window.history.replaceState({}, '', '/team');
            } catch (e) {
                console.error('Failed to parse organizations:', e);
            }
            return;
        }

        if (success === 'team' && username) {
            alert(`Successfully connected account: ${username}!`);
            fetchSocialAccounts(); // Refresh the accounts list
            // Clean up URL
            window.history.replaceState({}, '', '/team');
        } else if (error) {
            let errorMessage = '';
            switch (error) {
                case 'no_org_pages':
                    errorMessage = `No LinkedIn organization pages were available for "${accountName || 'this account'}".\n\nIf you want to connect a LinkedIn Company Page, you need:\n\n1. Admin access to a LinkedIn Company Page\n2. "Super Admin" or "Content Admin" permissions\n\nIf this personal account was already connected to the team earlier, you can refresh the page and it should remain available.`;
                    break;
                case 'already_connected':
                    errorMessage = `This LinkedIn account "${accountName || ''}" is already connected to team "${existingTeam || 'another team'}".\n\nEach LinkedIn account can only be connected to one team. If you want to use it here, please disconnect it from the other team first.`;
                    break;
                default:
                    errorMessage = `Failed to connect account: ${error}`;
            }

            alert(errorMessage);
            // Clean up URL
            window.history.replaceState({}, '', '/team');
        }
    }, []);
    
    // Handle LinkedIn account type selection
    const handleLinkedInSelection = async (accountType, organizationId = null) => {
        if (!linkedInSelectionData) return;
        
        setSelectingAccount(true);
        try {
            const linkedinApiUrl = import.meta.env.VITE_LINKEDIN_API_URL || (
                import.meta.env.MODE === 'production'
                    ? 'https://apilinkedin.suitegenie.in'
                    : 'http://localhost:3004'
            );
            const response = await fetch(`${linkedinApiUrl}/api/oauth/linkedin/complete-team-selection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectionId: linkedInSelectionData.selectionId,
                    accountType,
                    organizationId
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                setShowLinkedInSelection(false);
                setLinkedInSelectionData(null);
                alert(`Successfully connected ${accountType === 'organization' ? 'organization page' : 'personal account'}!`);
                fetchSocialAccounts();
            } else {
                alert(data.error || 'Failed to complete account selection');
            }
        } catch (error) {
            console.error('Failed to complete LinkedIn selection:', error);
            alert('Failed to connect account. Please try again.');
        } finally {
            setSelectingAccount(false);
        }
    };

    const fetchTeam = async () => {
        try {
            const response = await api.get('/pro-team');
            
            if (response.data.success) {
                setTeam(response.data.team);
            }
        } catch (error) {
            console.error('Failed to fetch team:', error);
        } finally {
            setLoading(false);
        }
    };

    const createTeam = async () => {
        if (isCreatingTeam) return; // Prevent double-click
        
        setIsCreatingTeam(true);
        try {
            const response = await api.post('/pro-team', { teamName: teamName || 'My Team' });
            const data = response.data;

            if (data.success) {
                setTeam(data.team);
                setHasRetriedCreate(false);
                return;
            }

            if (data.code === 'UPGRADE_REQUIRED') {
                setShowUpgrade(true);
                return;
            }

            const errorMessage = data.error || 'Failed to create team';
            throw new Error(errorMessage);
        } catch (error) {
            console.error('Failed to create team:', error);

            // After upgrade, plan info can lag; refresh limits once and retry
            if (!hasRetriedCreate) {
                try {
                    await refreshPlanInfo();
                    setHasRetriedCreate(true);
                    const retryResponse = await api.post('/pro-team', { teamName: 'My Team' });
                    if (retryResponse.data?.success) {
                        setTeam(retryResponse.data.team);
                        return;
                    }
                } catch (retryError) {
                    console.error('Retry create team failed:', retryError);
                }
            }

            const errorMessage = error.response?.data?.error || error.message || 'Failed to create team';
            alert(errorMessage);
        } finally {
            setIsCreatingTeam(false);
        }
    };

    const inviteUser = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setIsInviting(true);
        setInviteErrorMessage('');
        try {
            const response = await api.post('/pro-team/invite', { 
                email: inviteEmail,
                role: inviteRole 
            });
            
            const data = response.data;
            
            if (data.success) {
                alert(`Invitation sent to ${inviteEmail} as ${inviteRole}!`);
                setInviteEmail('');
                setInviteRole('editor');
                fetchTeam(); // Refresh team data
            } else if (data.code === 'ALREADY_IN_ANOTHER_TEAM') {
                // Show inline prompt to the inviter (user X)
                setInviteErrorMessage(data.error || 'The user is already a member of another team and cannot be invited.');
            } else {
                alert(data.error || 'Failed to send invitation');
            }
        } catch (error) {
            console.error('Failed to invite user:', error);
            const code = error.response?.data?.code;
            if (code === 'ALREADY_IN_ANOTHER_TEAM') {
                setInviteErrorMessage(error.response.data?.error || 'The user is already a member of another team and cannot be invited.');
            } else {
                alert('Failed to send invitation');
            }
        } finally {
            setIsInviting(false);
        }
    };

    const removeMember = async (member) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            let response;
            if (member.user_id) {
                // Remove active member by user_id
                response = await api.delete(`/pro-team/members/${member.user_id}`);
            } else {
                // Remove pending/invited member by team_members id
                response = await api.delete(`/team/members/${member.id}`); // fallback to legacy endpoint
            }
            if (response.success || response.data?.success) {
                fetchTeam(); // Refresh team data
            } else {
                alert(response.error || response.data?.error || 'Failed to remove member');
            }
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('Failed to remove member');
        }
    };

    const fetchSocialAccounts = async () => {
        try {
            const response = await api.get('/pro-team/social-accounts');
            console.log('[FRONTEND] Social accounts API response:', response.data);
            setSocialAccountsApiResponse(response.data);
            if (response.data.success) {
                console.log('[FRONTEND] Setting accounts:', response.data.accounts);
                setSocialAccounts(response.data.accounts || []);
                // Debug log for socialAccounts
                console.log('[DEBUG] socialAccounts:', response.data.accounts || []);
            }
        } catch (error) {
            console.error('Failed to fetch social accounts:', error);
        }
    };
const fetchUserPermissions = async () => {
    try {
        const response = await api.get('/pro-team/permissions');
        if (response.data.success) {
            setUserPermissions({
                role: response.data.role,
                permissions: response.data.permissions || [],
                limits: response.data.limits || { max_profile_connections: 0 },
                user_id: response.data.user_id || response.data.userId || user?.id || null,
                team_id: response.data.team_id || response.data.teamId || team?.id || null
            });
            // Debug log for userPermissions
            console.log('[DEBUG] userPermissions after fetch:', {
                role: response.data.role,
                user_id: response.data.user_id || response.data.userId || user?.id || null,
                team_id: response.data.team_id || response.data.teamId || team?.id || null
            });
        }
    } catch (error) {
        console.error('Failed to fetch user permissions:', error);
    }
};

    const connectPlatform = async (platform) => {
        setConnecting(platform);
        try {
            let payload = { platform };
            if (platform === 'twitter-oauth1') {
                payload.accountData = { oauthType: 'oauth1' };
            }
            const response = await api.post('/pro-team/social-accounts/connect', payload);
            if (response.data.success) {
                window.location.href = response.data.redirectUrl;
            } else {
                alert(response.data.error || 'Failed to initiate connection');
            }
        } catch (error) {
            console.error('Failed to connect platform:', error);
            alert(error.response?.data?.error || 'Failed to initiate connection');
        } finally {
            setConnecting(null);
        }
    };

    const connectLinkedIn = () => connectPlatform('linkedin');
    const connectTwitter = () => connectPlatform('twitter');
    const connectThreads = () => connectPlatform('threads');

    const disconnectAccount = async (accountId) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;

        try {
            const response = await api.delete(`/pro-team/social-accounts/${accountId}`);
            if (response.data.success) {
                fetchSocialAccounts();
                alert('Account disconnected successfully');
            } else {
                alert(response.data.error || 'Failed to disconnect account');
            }
        } catch (error) {
            console.error('Failed to disconnect account:', error);
            alert(error.response?.data?.error || 'Failed to disconnect account');
        }
    };

    const leaveTeam = async () => {
        if (!team || team.user_role === 'owner') return;
        if (!confirm('Leave this team? You will lose access to its shared accounts and content.')) return;
        setLeaving(true);
        try {
            const response = await api.post('/pro-team/leave');
            if (response.data?.success) {
                setTeam(null);
                setSocialAccounts([]);
                setSocialAccountsApiResponse(null);
                setInviteEmail('');
                setInviteRole('editor');
                alert('You have left the team.');
            } else {
                alert(response.data?.error || 'Failed to leave team');
            }
        } catch (error) {
            console.error('Failed to leave team:', error);
            alert(error.response?.data?.error || 'Failed to leave team');
        } finally {
            setLeaving(false);
        }
    };

    const deleteTeam = async () => {
        if (!team || team.user_role !== 'owner') return;
        if (!confirm('Delete this team permanently? All members will lose access and connected accounts will be removed.')) return;
        setDeleting(true);
        try {
            const response = await api.delete('/pro-team');
            if (response.data?.success) {
                setTeam(null);
                setSocialAccounts([]);
                setSocialAccountsApiResponse(null);
                setInviteEmail('');
                setInviteRole('editor');
                alert('Team deleted.');
            } else {
                alert(response.data?.error || 'Failed to delete team');
            }
        } catch (error) {
            console.error('Failed to delete team:', error);
            alert(error.response?.data?.error || 'Failed to delete team');
        } finally {
            setDeleting(false);
        }
    };

    const refreshPage = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                fetchTeam(),
                fetchSocialAccounts(),
                fetchUserPermissions()
            ]);
        } catch (error) {
            console.error('Failed to refresh:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const getPlatformIcon = (platform) => {
        switch (platform?.toLowerCase()) {
            case 'linkedin': return <Linkedin className="h-5 w-5 text-blue-600" />;
            case 'twitter': return <Twitter className="h-5 w-5 text-blue-400" />;
            case 'wordpress': return <Globe className="h-5 w-5 text-blue-800" />;
            case 'facebook': return <MessageSquare className="h-5 w-5 text-blue-700" />;
            case 'instagram': return <ExternalLink className="h-5 w-5 text-purple-600" />;
            case 'threads': return <AtSign className="h-5 w-5 text-neutral-800" />;
            default: return <ExternalLink className="h-5 w-5 text-gray-500" />;
        }
    };

    const getAccountSubtitle = (account) => {
        const platformLabel = account?.platform || 'account';
        const username = typeof account?.account_username === 'string' ? account.account_username.trim() : '';
        if (username) {
            return `@${username} - ${platformLabel}`;
        }
        return platformLabel;
    };

    const updateMemberRole = async (memberId, newRole) => {
        // Optimistic update - update UI immediately
        const previousMembers = team.members;
        setTeam(prev => ({
            ...prev,
            members: prev.members.map(m => 
                m.id === memberId ? { ...m, role: newRole } : m
            )
        }));

        try {
            const response = await api.put(`/pro-team/members/${memberId}/role`, { role: newRole });
            
            // Refresh to ensure consistency
            await fetchTeam();
            
        } catch (error) {
            console.error('Failed to update member role:', error);
            // Revert on error
            setTeam(prev => ({ ...prev, members: previousMembers }));
            const errorMessage = error.response?.data?.error || error.message || 'Failed to update member role';
            alert(errorMessage);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
            case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
            case 'editor': return <Edit className="h-4 w-4 text-green-500" />;
            case 'viewer': return <Eye className="h-4 w-4 text-gray-500" />;
            default: return <Eye className="h-4 w-4 text-gray-500" />;
        }
    };

    const getRoleName = (role) => {
        switch (role) {
            case 'owner': return 'Owner';
            case 'admin': return 'Admin';
            case 'editor': return 'Editor';
            case 'viewer': return 'Viewer';
            default: return 'Member';
        }
    };

    const goToTweetGenie = async () => {
        // For now, redirect directly to Tweet Genie
        // TODO: Implement SSO token system later
        window.location.href = 'http://localhost:5174';
    };

    if (loading || planLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // No team and no Pro access - show upgrade
    if (!team && !hasTeamAccess) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center mb-8">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Collaboration</h1>
                    <p className="text-gray-600">Invite team members and collaborate on your social media strategy</p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
                    <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Collaboration - Pro Feature</h3>
                    <p className="text-gray-600 mb-6">
                        Upgrade to Pro to invite up to 5 team members, share social accounts, and collaborate on content creation.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
                        <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Team Members</h4>
                            <p className="text-sm text-gray-600">Invite up to 5 team members to collaborate</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Shared Accounts</h4>
                            <p className="text-sm text-gray-600">Connect up to 8 social accounts for the team</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Shared Analytics</h4>
                            <p className="text-sm text-gray-600">View performance across all team accounts</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowUpgrade(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                        Upgrade to Pro Plan
                    </button>
                </div>

                <UpgradePrompt
                    isOpen={showUpgrade}
                    feature="Team Collaboration"
                    description="Invite team members and collaborate on your social media strategy"
                    benefits={[
                        "Invite up to 5 team members",
                        "Connect up to 8 social accounts",
                        "Shared content calendar",
                        "Team analytics dashboard"
                    ]}
                    onUpgrade={handleTeamUpgradeCheckout}
                    isUpgrading={upgrading}
                    onClose={() => {
                        if (!upgrading) setShowUpgrade(false);
                    }}
                />
            </div>
        );
    }

    // Has Pro access but no team yet - show create team
    if (!team && hasTeamAccess) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center mb-8">
                    <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Team</h1>
                    <p className="text-gray-600">Start collaborating with your team members</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Ready to build your team?</h3>
                    <p className="text-gray-600 mb-6 text-center">
                        Create a team workspace where you can invite up to 5 members to collaborate on your social media strategy.
                    </p>
                    
                    <div className="mb-6">
                        <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                            Team Name (optional)
                        </label>
                        <input
                            id="teamName"
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="e.g., Marketing Team, Content Creators, Social Squad"
                            maxLength="50"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">{teamName.length}/50 characters</p>
                    </div>
                    
                    <button
                        onClick={createTeam}
                        disabled={isCreatingTeam}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isCreatingTeam ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                Creating Team...
                            </>
                        ) : (
                            'Create Team'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Has team - show team page
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{team.name}</h1>
                    <p className="text-gray-600">
                        {team.member_count} of {team.max_members} members - Pro Plan
                    </p>
                </div>
                {team.user_role !== 'owner' && (
                    <button
                        onClick={leaveTeam}
                        disabled={leaving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        title="Leave this team"
                    >
                        <LogOut className="h-4 w-4" />
                        {leaving ? 'Leaving...' : 'Leave Team'}
                    </button>
                )}
                {team.user_role === 'owner' && (
                    <button
                        onClick={deleteTeam}
                        disabled={deleting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        title="Delete this team"
                    >
                        <Trash2 className="h-4 w-4" />
                        {deleting ? 'Deleting...' : 'Delete Team'}
                    </button>
                )}
            </div>

            {/* Invite Section */}
            {team.canInvite && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h2>
                    <form onSubmit={inviteUser} className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="Enter email address"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                                <option value="viewer">Viewer</option>
                            </select>
                            <button
                                type="submit"
                                disabled={isInviting}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Mail className="h-4 w-4" />
                                {isInviting ? 'Sending...' : 'Send Invite'}
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="flex items-center gap-1">
                                    <Shield className="h-4 w-4 text-blue-500" />
                                    <span><strong>Admin:</strong> Can invite members and manage social accounts</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Edit className="h-4 w-4 text-green-500" />
                                    <span><strong>Editor:</strong> Can use connected social accounts and create content</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Eye className="h-4 w-4 text-gray-500" />
                                    <span><strong>Viewer:</strong> Can view team content but cannot create or edit</span>
                                </div>
                            </div>
                        </div>
                        {inviteErrorMessage && (
                            <div className="mt-2 text-sm text-red-600" role="alert">
                                {inviteErrorMessage}
                            </div>
                        )}
                    </form>
                </div>
            )}

            {/* Team Members */}
            <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                    {team?.members && Array.isArray(team.members) ? (
                        team.members.map((member) => (
                        <div key={member.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-600 font-semibold">
                                        {member.user_name?.charAt(0)?.toUpperCase() || member.email.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900 truncate">
                                        {member.user_name || member.email}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">{member.email}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                                {/* Role Display/Selector */}
                                {team.user_role === 'owner' && member.role !== 'owner' ? (
                                    <div className="flex items-center gap-2">
                                        {getRoleIcon(member.role)}
                                        <select
                                            value={member.role}
                                            onChange={(e) => updateMemberRole(member.id, e.target.value)}
                                            className="text-sm font-medium border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        {getRoleIcon(member.role)}
                                        <span className="text-sm font-medium text-gray-700">
                                            {getRoleName(member.role)}
                                        </span>
                                    </div>
                                )}
                                
                                {team.user_role === 'owner' && member.role !== 'owner' && (
                                    <button
                                        onClick={() => removeMember(member)}
                                        className="text-red-600 hover:text-red-700 transition-colors"
                                        title={member.user_id ? "Remove member" : "Remove pending invite"}
                                    >
                                        <UserX className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                    ) : (
                        <div className="p-8 text-center">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No team members yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Social Accounts Section */}
            <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Social Accounts</h2>
                            <p className="text-gray-600">Manage your team's social media connections</p>
                        </div>
                        <div className="text-sm text-gray-500">
                            {socialAccounts.length} / {userPermissions.limits?.max_profile_connections || 0} connected
                        </div>
                    </div>
                </div>
                
                {/* Connected Accounts */}
                <div className="divide-y divide-gray-200">
                    {socialAccounts.length === 0 ? (
                        <div className="p-8 text-center">
                            <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts connected</h3>
                            <p className="text-gray-600 mb-4">Connect your social media accounts to get started</p>
                        </div>
                    ) : (
                        socialAccounts.map((account) => (
                            <div key={account.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="flex-shrink-0">
                                        {getPlatformIcon(account.platform)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900 truncate">
                                            {account.account_display_name || account.account_username}
                                        </p>
                                        <p className="text-sm text-gray-600 truncate">
                                            {getAccountSubtitle(account)}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            Connected by {account.connected_by_name || account.connected_by_email}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        (account.active || account.is_active) 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {(account.active || account.is_active) ? 'Active' : 'Inactive'}
                                    </span>
                                    
                                    {['owner', 'admin'].includes(userPermissions.role) && (
                                        <button
                                            onClick={() => disconnectAccount(account.id)}
                                            className="text-red-600 hover:text-red-700 transition-colors p-1"
                                            title="Disconnect account"
                                        >
                                            <UserX className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {/* Connect New Accounts - Only owner/admin can connect (max 8 accounts) */}
                {['owner', 'admin'].includes(userPermissions.role) && 
                 socialAccounts.length < 8 && (
                    <div className="p-6 border-t border-gray-200">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Connect New Account</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <button
                                onClick={connectLinkedIn}
                                disabled={connecting === 'linkedin'}
                                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                            >
                                <Linkedin className="h-6 w-6 text-blue-600" />
                                <span className="font-medium text-gray-900">
                                    {connecting === 'linkedin' ? 'Connecting...' : 'LinkedIn'}
                                </span>
                            </button>
                            
                            <button
                                onClick={connectTwitter}
                                disabled={connecting === 'twitter'}
                                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                            >
                                <Twitter className="h-6 w-6 text-blue-400" />
                                <span className="font-medium text-gray-900">
                                    {connecting === 'twitter' ? 'Connecting...' : 'Twitter'}
                                </span>
                            </button>
                                <button
                                    onClick={connectTwitterOAuth1}
                                    disabled={connecting === 'twitter-oauth1'}
                                    className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-yellow-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors disabled:opacity-50"
                                >
                                    <Twitter className="h-6 w-6 text-yellow-500" />
                                    <span className="font-medium text-gray-900">
                                        {connecting === 'twitter-oauth1' ? 'Connecting Twitter (Media)...' : 'Twitter (Media Upload)'}
                                    </span>
                                </button>

                            <button
                                onClick={() => connectPlatform('wordpress')}
                                disabled={connecting === 'wordpress'}
                                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-800 hover:bg-blue-50 transition-colors disabled:opacity-50"
                            >
                                <Globe className="h-6 w-6 text-blue-800" />
                                <span className="font-medium text-gray-900">
                                    {connecting === 'wordpress' ? 'Connecting...' : 'WordPress'}
                                </span>
                            </button>
                            
                            <button
                                onClick={() => connectPlatform('facebook')}
                                disabled={connecting === 'facebook'}
                                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
                            >
                                <MessageSquare className="h-6 w-6 text-blue-700" />
                                <span className="font-medium text-gray-900">
                                    {connecting === 'facebook' ? 'Connecting...' : 'Facebook'}
                                </span>
                            </button>

                            <button
                                onClick={() => connectPlatform('instagram')}
                                disabled={connecting === 'instagram'}
                                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50"
                            >
                                <ExternalLink className="h-6 w-6 text-purple-600" />
                                <span className="font-medium text-gray-900">
                                    {connecting === 'instagram' ? 'Connecting...' : 'Instagram'}
                                </span>
                            </button>

                            <button
                                onClick={connectThreads}
                                disabled={connecting === 'threads'}
                                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-neutral-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <AtSign className="h-6 w-6 text-neutral-900" />
                                <span className="font-medium text-gray-900">
                                    {connecting === 'threads' ? 'Connecting...' : 'Threads'}
                                </span>
                            </button>

                            <button
                                disabled
                                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
                            >
                                <ExternalLink className="h-6 w-6 text-gray-400" />
                                <span className="font-medium text-gray-500">More Soon</span>
                            </button>
                        </div>
                        
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Team Social Accounts</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-medium text-blue-600">Team Limit: 8 accounts total</p>
                                    <p className="text-gray-600">Shared across all team members</p>
                                </div>
                                <div>
                                    <p className="font-medium text-orange-600">Connection Access:</p>
                                    <p className="text-gray-600">Only Owner & Admin can connect/disconnect</p>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-500">
                                All team members can use connected accounts for content creation
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showUpgrade && (
                <UpgradePrompt
                    isOpen={showUpgrade}
                    feature="Team Collaboration"
                    description="Enhance your team collaboration with more features"
                    benefits={[
                        "Invite more team members",
                        "Advanced role management",
                        "Team analytics dashboard",
                        "Priority support"
                    ]}
                    onUpgrade={handleTeamUpgradeCheckout}
                    isUpgrading={upgrading}
                    onClose={() => {
                        if (!upgrading) setShowUpgrade(false);
                    }}
                />
            )}
            
            {/* LinkedIn Account Selection Modal */}
            {showLinkedInSelection && linkedInSelectionData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Linkedin className="h-6 w-6" />
                                Select Account Type
                            </h3>
                            <p className="text-blue-100 text-sm mt-1">
                                Choose which LinkedIn account to connect
                            </p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Personal Account Option */}
                            {!linkedInSelectionData.personalConnected && (
                                <button
                                    onClick={() => handleLinkedInSelection('personal')}
                                    disabled={selectingAccount}
                                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4 disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="font-semibold text-gray-900">Personal Profile</div>
                                        <div className="text-sm text-gray-500">{linkedInSelectionData.userName}</div>
                                    </div>
                                </button>
                            )}
                            
                            {linkedInSelectionData.personalConnected && (
                                <div className="p-4 bg-gray-100 rounded-lg text-gray-500 text-sm flex items-center gap-3">
                                    <User className="h-5 w-5" />
                                    Personal profile already connected
                                </div>
                            )}
                            
                            {/* Organization Pages */}
                            <div className="border-t pt-4">
                                <div className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Organization Pages
                                </div>
                                
                                {linkedInSelectionData.organizations.map((org) => (
                                    <button
                                        key={org.id}
                                        onClick={() => handleLinkedInSelection('organization', org.id)}
                                        disabled={selectingAccount}
                                        className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4 mb-2 disabled:opacity-50"
                                    >
                                        {org.logo ? (
                                            <img src={org.logo} alt={org.name} className="w-12 h-12 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <Building2 className="h-6 w-6 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="text-left flex-1">
                                            <div className="font-semibold text-gray-900">{org.name}</div>
                                            <div className="text-sm text-gray-500">Organization Page</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                            <button
                                onClick={() => {
                                    setShowLinkedInSelection(false);
                                    setLinkedInSelectionData(null);
                                }}
                                disabled={selectingAccount}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPage;

