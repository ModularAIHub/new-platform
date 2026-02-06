// SocialAccountsPage.jsx - Manage team's social media connections
import React, { useState, useEffect } from 'react';
import { Twitter, Linkedin, Plus, Trash2, Users, Shield, Crown, Edit, Eye, ExternalLink } from 'lucide-react';
import api from '../utils/api';
import usePlanAccess from '../hooks/usePlanAccess';

const SocialAccountsPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [userPermissions, setUserPermissions] = useState({ role: null, permissions: [], limits: null });
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(null);
    const { hasFeatureAccess } = usePlanAccess();

    const hasTeamAccess = hasFeatureAccess('team_collaboration');

    useEffect(() => {
        if (hasTeamAccess) {
            fetchSocialAccounts();
            fetchUserPermissions();
        }
        setLoading(false);
    }, [hasTeamAccess]);

    const fetchSocialAccounts = async () => {
        try {
            const response = await api.get('/pro-team/social-accounts');
            if (response.success) {
                setAccounts(response.accounts || []);
            }
        } catch (error) {
            console.error('Failed to fetch social accounts:', error);
        }
    };

    const fetchUserPermissions = async () => {
        try {
            const response = await api.get('/pro-team/permissions');
            if (response.success) {
                setUserPermissions({
                    role: response.role,
                    permissions: response.permissions || [],
                    limits: response.limits
                });
            }
        } catch (error) {
            console.error('Failed to fetch user permissions:', error);
        }
    };

    const canConnectProfiles = userPermissions.permissions.includes('connect_profiles');
    const maxConnections = userPermissions.limits?.max_profile_connections || 0;
    const currentConnections = accounts.length;
    const canAddMore = canConnectProfiles && currentConnections < maxConnections;

    const connectLinkedIn = async () => {
        setConnecting('linkedin');
        try {
            // Redirect to LinkedIn OAuth
            window.location.href = '/api/linkedin/auth';
        } catch (error) {
            console.error('LinkedIn connection failed:', error);
            setConnecting(null);
        }
    };

    const connectTwitter = async () => {
        setConnecting('twitter');
        try {
            // Redirect to Twitter OAuth  
            window.location.href = '/api/twitter/auth';
        } catch (error) {
            console.error('Twitter connection failed:', error);
            setConnecting(null);
        }
    };

    const disconnectAccount = async (accountId) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;

        try {
            const response = await api.delete(`/pro-team/social-accounts/${accountId}`);
            if (response.success) {
                fetchSocialAccounts();
            } else {
                alert('Failed to disconnect account');
            }
        } catch (error) {
            console.error('Failed to disconnect account:', error);
            alert('Failed to disconnect account');
        }
    };

    const getPlatformIcon = (platform) => {
        switch (platform.toLowerCase()) {
            case 'linkedin': return <Linkedin className="h-5 w-5 text-blue-600" />;
            case 'twitter': return <Twitter className="h-5 w-5 text-blue-400" />;
            default: return <ExternalLink className="h-5 w-5 text-gray-500" />;
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
            case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
            case 'editor': return <Edit className="h-4 w-4 text-green-500" />;
            case 'viewer': return <Eye className="h-4 w-4 text-gray-500" />;
            default: return <Users className="h-4 w-4 text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!hasTeamAccess) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Accounts Management</h2>
                    <p className="text-gray-600 mb-8">Connect and manage your social media accounts for team collaboration</p>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">🚀 Upgrade to Teams for Social Accounts</h3>
                        <p className="text-blue-700 mb-6">
                            Connect up to 8 social media accounts and collaborate with your team on content creation and scheduling.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                                <h4 className="font-semibold text-gray-900 mb-2">📱 Multiple Platforms</h4>
                                <p className="text-sm text-gray-600">Connect LinkedIn, Twitter, and more platforms</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                                <h4 className="font-semibold text-gray-900 mb-2">👥 Team Collaboration</h4>
                                <p className="text-sm text-gray-600">Share accounts with team members based on roles</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => window.location.href = '/plans'}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Upgrade to Teams
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Social Accounts</h1>
                        <p className="text-gray-600 mt-2">Manage your team's social media connections</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                        {getRoleIcon(userPermissions.role)}
                        <span className="text-sm font-medium text-gray-700">
                            {userPermissions.role?.charAt(0).toUpperCase() + userPermissions.role?.slice(1)}
                        </span>
                    </div>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-900">
                                Connected Accounts: {currentConnections} / {maxConnections}
                            </p>
                            <p className="text-sm text-blue-700">
                                {canConnectProfiles 
                                    ? `You can connect up to ${maxConnections} social media accounts`
                                    : 'Contact team owner/admin to connect new accounts'
                                }
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{currentConnections}</div>
                            <div className="text-sm text-blue-500">accounts</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connected Accounts */}
            <div className="bg-white border border-gray-200 rounded-lg mb-8">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Connected Accounts</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                    {accounts.length === 0 ? (
                        <div className="p-8 text-center">
                            <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts connected</h3>
                            <p className="text-gray-600 mb-4">Connect your first social media account to get started</p>
                        </div>
                    ) : (
                        accounts.map((account) => (
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
                                        account.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {account.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    
                                    {canConnectProfiles && (
                                        <button
                                            onClick={() => disconnectAccount(account.id)}
                                            className="text-red-600 hover:text-red-700 transition-colors p-1"
                                            title="Disconnect account"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Connect New Accounts */}
            {canConnectProfiles && canAddMore && (
                <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Connect New Account</h2>
                        <p className="text-gray-600">Add more social media platforms to your team</p>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={connectLinkedIn}
                                disabled={connecting === 'linkedin'}
                                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                            >
                                <Linkedin className="h-6 w-6 text-blue-600" />
                                <span className="font-medium text-gray-900">
                                    {connecting === 'linkedin' ? 'Connecting LinkedIn...' : 'Connect LinkedIn'}
                                </span>
                            </button>
                            
                            <button
                                onClick={connectTwitter}
                                disabled={connecting === 'twitter'}
                                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                            >
                                <Twitter className="h-6 w-6 text-blue-400" />
                                <span className="font-medium text-gray-900">
                                    {connecting === 'twitter' ? 'Connecting Twitter...' : 'Connect Twitter'}
                                </span>
                            </button>
                        </div>
                        
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Role-based Access</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-medium text-blue-600">👑 Owner & 🛡️ Admin: 8 accounts</p>
                                    <p className="text-gray-600">Can connect all available social platforms</p>
                                </div>
                                <div>
                                    <p className="font-medium text-green-600">✏️ Editor: 2 accounts</p>
                                    <p className="text-gray-600">Limited connections for content creation</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!canConnectProfiles && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-amber-600" />
                        <div>
                            <h3 className="font-medium text-amber-900">Limited Access</h3>
                            <p className="text-amber-700">
                                Your role ({userPermissions.role}) doesn't allow connecting new social accounts. 
                                Contact your team owner or admin for access.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialAccountsPage;