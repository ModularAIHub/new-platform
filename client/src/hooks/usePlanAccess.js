import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export const usePlanAccess = () => {
  const [userPlan, setUserPlan] = useState(null);
  const [planLimits, setPlanLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchPlanInfo();
  }, []);

  const fetchPlanInfo = async () => {
    try {
      const response = await api.get('/plans/limits');
      
      setUserPlan(response.data.currentPlan);
      setPlanLimits(response.data.limits);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch plan info:', error);
      setLoading(false);
    }
  };

  const hasFeatureAccess = (featureName) => {
    if (!userPlan) return false;
    
    const featureMap = {
      'bulk_scheduling': userPlan.type !== 'free',
      'advanced_analytics': userPlan.type !== 'free', 
      'multi_accounts': userPlan.type !== 'free',
      'priority_support': userPlan.type !== 'free',
      'team_collaboration': userPlan.type === 'pro' || userPlan.type === 'enterprise',
      'own_keys': true, // Available to all users
      'basic_ai_generation': true, // Available to all users
      'built_in_keys': true // Available to all users
    };

    return featureMap[featureName] || false;
  };

  const canAddMoreAccounts = (currentCount) => {
    if (!planLimits) return false;
    return currentCount < planLimits.totalSocialAccounts;
  };

  const canAddMoreProfiles = (platform, currentCount) => {
    if (!planLimits) return false;
    return currentCount < planLimits.profilesPerPlatform;
  };

  const upgradeToPro = async () => {
    try {
      const response = await api.post('/plans/upgrade', {
        planType: 'pro'
      });
      
      // Refresh plan info after upgrade
      await fetchPlanInfo();
      return response.data;
    } catch (error) {
      console.error('Failed to upgrade plan:', error);
      throw error;
    }
  };

  return {
    userPlan,
    planLimits,
    loading,
    hasFeatureAccess,
    canAddMoreAccounts,
    canAddMoreProfiles,
    upgradeToPro,
    refreshPlanInfo: fetchPlanInfo
  };
};

export default usePlanAccess;
