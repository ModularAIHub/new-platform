// TeamPage.jsx - Pro plan team collaboration
import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, UserX, Crown, Shield, Eye, Edit, Linkedin, Twitter, ExternalLink, Globe, MessageSquare } from 'lucide-react';
import usePlanAccess from '../hooks/usePlanAccess';
import UpgradePrompt from '../components/UpgradePrompt';
import api from '../utils/api';

const TeamPage = () => {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [isInviting, setIsInviting] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [socialAccounts, setSocialAccounts] = useState([]);
    const [socialAccountsApiResponse, setSocialAccountsApiResponse] = useState(null);
    const [userPermissions, setUserPermissions] = useState({ role: null, permissions: [], limits: null });
    const [connecting, setConnecting] = useState(null);
    const { hasFeatureAccess, userPlan } = usePlanAccess();

    const hasTeamAccess = hasFeatureAccess('team_collaboration');

    useEffect(() => {
        if (hasTeamAccess) {
            fetchTeam();
            fetchSocialAccounts();
            fetchUserPermissions();
        } else {
            setLoading(false);
        }
    }, [hasTeamAccess]);

    // Handle OAuth callback success
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');
        const username = urlParams.get('username');
        const error = urlParams.get('error');
        
        if (success === 'team' && username) {
            alert(`Successfully connected Twitter account @${username}!`);
            fetchSocialAccounts(); // Refresh the accounts list
            // Clean up URL
            window.history.replaceState({}, '', '/team');
        } else if (error) {
            alert(`Failed to connect account: ${error}`);
            // Clean up URL
            window.history.replaceState({}, '', '/team');
        }
    }, []);

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
        try {
            const response = await api.post('/pro-team', { teamName: 'My Team' });
            
            const data = response.data;
            
            if (data.success) {
                setTeam(data.team);
            } else if (data.code === 'UPGRADE_REQUIRED') {
                setShowUpgrade(true);
            }
        } catch (error) {
            console.error('Failed to create team:', error);
        }
    };

    const inviteUser = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setIsInviting(true);
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
            } else {
                alert(data.error || 'Failed to send invitation');
            }
        } catch (error) {
            console.error('Failed to invite user:', error);
            alert('Failed to send invitation');
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
            setSocialAccountsApiResponse(response.data);
            if (response.data.success) {
                setSocialAccounts(response.data.accounts || []);
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
                    limits: response.data.limits || { max_profile_connections: 0 }
                });
            }
        } catch (error) {
            console.error('Failed to fetch user permissions:', error);
        }
    };

    const connectPlatform = async (platform) => {
        setConnecting(platform);
        try {
            const response = await api.post('/pro-team/social-accounts/connect', { platform });
            if (response.data.success) {
                // Redirect to subdomain for OAuth
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

    const getPlatformIcon = (platform) => {
        switch (platform?.toLowerCase()) {
            case 'linkedin': return <Linkedin className="h-5 w-5 text-blue-600" />;
            case 'twitter': return <Twitter className="h-5 w-5 text-blue-400" />;
            case 'wordpress': return <Globe className="h-5 w-5 text-blue-800" />;
            case 'facebook': return <MessageSquare className="h-5 w-5 text-blue-700" />;
            case 'instagram': return <ExternalLink className="h-5 w-5 text-purple-600" />;
            default: return <ExternalLink className="h-5 w-5 text-gray-500" />;
        }
    };

    const updateMemberRole = async (memberId, newRole) => {
        try {
            const response = await api.put(`/pro-team/members/${memberId}/role`, { role: newRole });
            
            // Check if response indicates success (either response.success or HTTP 200)
            if (response.success || response.message) {
                fetchTeam(); // Refresh team data
                // Show success message if available
                if (response.message) {
                    // Optional: could show a toast notification instead of alert
                    console.log('Role updated:', response.message);
                }
            } else {
                alert(response.error || 'Failed to update member role');
            }
        } catch (error) {
            console.error('Failed to update member role:', error);
            
            // Check if it's actually a success response disguised as an error
            if (error.response?.status === 200 && error.response?.data?.success) {
                fetchTeam(); // Refresh on success
                return;
            }
            
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Free plan users see upgrade prompt
    if (!hasTeamAccess) {
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
                            <h4 className="font-semibold text-gray-900 mb-2">👥 Team Members</h4>
                            <p className="text-sm text-gray-600">Invite up to 5 team members to collaborate</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">🔗 Shared Accounts</h4>
                            <p className="text-sm text-gray-600">Connect up to 8 social accounts for the team</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">📊 Shared Analytics</h4>
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

                {showUpgrade && (
                    <UpgradePrompt
                        feature="Team Collaboration"
                        description="Invite team members and collaborate on your social media strategy"
                        benefits={[
                            "Invite up to 5 team members",
                            "Connect up to 8 social accounts",
                            "Shared content calendar",
                            "Team analytics dashboard"
                        ]}
                        onClose={() => setShowUpgrade(false)}
                    />
                )}
            </div>
        );
    }

    // Pro users without a team yet
    if (!team) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center mb-8">
                    <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Team</h1>
                    <p className="text-gray-600">Start collaborating with your team members</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to build your team?</h3>
                    <p className="text-gray-600 mb-6">
                        Create a team workspace where you can invite up to 5 members to collaborate on your social media strategy.
                    </p>
                    
                    <button
                        onClick={createTeam}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                        Create Team
                    </button>
                </div>
            </div>
        );
    }

    // Pro users with a team
    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Debug: Show raw social accounts API response */}
            <div className="card p-4 mb-4 bg-yellow-100 text-xs text-gray-800">
                <strong>Debug: /pro-team/social-accounts API Response</strong>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(socialAccountsApiResponse, null, 2)}</pre>
            </div>
            {/* Debug: Show raw socialAccounts array */}
            <div className="card p-4 mb-4 bg-yellow-50 text-xs text-gray-800">
                <strong>Debug: Raw Social Accounts Array</strong>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(socialAccounts, null, 2)}</pre>
            </div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{team.name}</h1>
                <p className="text-gray-600">
                    {team.member_count} of {team.max_members} members • Pro Plan
                </p>
            </div>

            {/* Invite Section */}
            {team.canInvite && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h2>
                    <form onSubmit={inviteUser} className="space-y-4">
                        <div className="flex gap-4">
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
                            <div className="flex items-center gap-4">
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
                    </form>
                </div>
            )}

            {/* Team Members */}
            <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                    {team.members.map((member) => (
                        <div key={member.id} className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold">
                                        {member.user_name?.charAt(0)?.toUpperCase() || member.email.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {member.user_name || member.email}
                                    </p>
                                    <p className="text-sm text-gray-500">{member.email}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
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
                    ))}
                </div>
            </div>

            {/* Platform Tools Section */}
            <div className="bg-white border border-gray-200 rounded-lg mb-6">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Platform Tools</h2>
                    <p className="text-gray-600">Access specialized tools for each social media platform</p>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={goToTweetGenie}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                        >
                            <div className="flex-shrink-0">
                                <Twitter className="h-8 w-8 text-blue-400 group-hover:text-blue-500" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-900">Tweet Genie</h3>
                                <p className="text-sm text-gray-600">Advanced Twitter management</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 ml-auto" />
                        </button>
                        
                        <button
                            disabled
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
                        >
                            <div className="flex-shrink-0">
                                <Linkedin className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-500">LinkedIn Pro</h3>
                                <p className="text-sm text-gray-400">Coming soon</p>
                            </div>
                        </button>
                        
                        <button
                            disabled
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
                        >
                            <div className="flex-shrink-0">
                                <Globe className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-500">Content Hub</h3>
                                <p className="text-sm text-gray-400">Coming soon</p>
                            </div>
                        </button>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">🚀 Seamless Team Access</h4>
                        <p className="text-sm text-blue-700">
                            Click any tool to access it with your team role and permissions automatically applied. 
                            No need to log in again!
                        </p>
                    </div>
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
                            <div key={account.id} className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0">
                                        {getPlatformIcon(account.platform)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {account.account_display_name || account.account_username}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            @{account.account_username} • {account.platform}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Connected by {account.connected_by_name || account.connected_by_email}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        account.active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {account.active ? 'Active' : 'Inactive'}
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
                                    <p className="font-medium text-blue-600">� Team Limit: 8 accounts total</p>
                                    <p className="text-gray-600">Shared across all team members</p>
                                </div>
                                <div>
                                    <p className="font-medium text-orange-600">🔒 Connection Access:</p>
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
                    feature="Team Collaboration"
                    description="Enhance your team collaboration with more features"
                    benefits={[
                        "Invite more team members",
                        "Advanced role management",
                        "Team analytics dashboard",
                        "Priority support"
                    ]}
                    onClose={() => setShowUpgrade(false)}
                />
            )}
        </div>
    );
};

export default TeamPage;