import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import usePlanAccess from '../hooks/usePlanAccess';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { loadRazorpayScript } from '../utils/payment';
import PublicSeo from '../components/PublicSeo';

const INR_TO_USD_APPROX = 83;
const toUsdApprox = (inrAmount) => (inrAmount / INR_TO_USD_APPROX).toFixed(2);

const PlansPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { userPlan, refreshPlanInfo } = usePlanAccess();
  const [openFaq, setOpenFaq] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [addonCheckoutLoading, setAddonCheckoutLoading] = useState('');
  const [agencyBillingLoading, setAgencyBillingLoading] = useState(false);
  const [agencyBillingBusyAction, setAgencyBillingBusyAction] = useState('');
  const [agencyBilling, setAgencyBilling] = useState({ subscription: null, invoices: [] });
  const pendingIntent = searchParams.get('intent');
  const currentIndividualPlanType = String(
    userPlan?.individualPlan ||
    user?.planType ||
    user?.plan_type ||
    'free'
  ).toLowerCase();
  const automationAccess = userPlan?.automationAccess || { active: false, packages: [] };
  const agencyAddonAccess = userPlan?.agencyAddonAccess || {
    active: false,
    packages: [],
    features: {
      whiteLabelEnabled: false,
      reportingExportEnabled: false,
      mediaLibraryEnabled: false,
      mediaLibraryStorageGb: 0,
    },
    limits: null,
  };
  const hasSoloAutomation = automationAccess.packages?.some((pkg) => pkg.packageId === 'solo_automation');
  const hasAgencyAutomation = automationAccess.packages?.some((pkg) => pkg.packageId === 'agency_automation');
  const extraSeatQuantity = Number(agencyAddonAccess.packages?.find((pkg) => pkg.packageId === 'agency_extra_seat')?.quantity || 0);
  const extraWorkspaceQuantity = Number(agencyAddonAccess.packages?.find((pkg) => pkg.packageId === 'agency_extra_workspace')?.quantity || 0);
  const hasWhiteLabelAddon = agencyAddonAccess.packages?.some((pkg) => pkg.packageId === 'agency_white_label');
  const hasReportingExportAddon = agencyAddonAccess.packages?.some((pkg) => pkg.packageId === 'agency_reporting_export');
  const hasMediaLibraryAddon = agencyAddonAccess.packages?.some((pkg) => pkg.packageId === 'agency_media_library');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const refreshAgencyBilling = async () => {
    if (!user) return;
    setAgencyBillingLoading(true);
    try {
      const [statusResponse, invoicesResponse] = await Promise.all([
        api.get('/payments/agency/status'),
        api.get('/payments/agency/invoices'),
      ]);
      setAgencyBilling({
        subscription: statusResponse.data?.subscription || null,
        actions: statusResponse.data?.actions || { canCancel: false, canResume: false },
        invoices: Array.isArray(invoicesResponse.data?.invoices) ? invoicesResponse.data.invoices : [],
      });
    } catch (error) {
      setAgencyBilling({ subscription: null, actions: { canCancel: false, canResume: false }, invoices: [] });
    } finally {
      setAgencyBillingLoading(false);
    }
  };

  useEffect(() => {
    refreshAgencyBilling();
  }, [user?.id]);

  const plans = [
    {
      name: 'Free',
      displayName: 'Free',
      price: 'Free',
      monthlyPrice: '$0',
      description: 'For testing the workflow, connecting a couple of accounts, and learning how SuiteGenie operates before you scale.',
      features: [
        'Manual publishing across the Genie modules you connect',
        'Basic AI drafting with SuiteGenie credits or BYOK',
        'Starter scheduling and publishing history',
        'Basic analytics',
        'Starter access to Tweet Genie and LinkedIn Genie',
        'Encrypted BYOK (OpenAI, Gemini, Perplexity)',
        '15 platform credits per month',
        '50 BYOK credits per month',
      ],
      notIncluded: [],
      buttonText: 'Start Free',
      popular: false
    },
    {
      name: 'Pro',
      displayName: 'Pro',
      price: 'Rs 499',
      monthlyPrice: 'Rs 499',
      monthlyPriceUsdApprox: `~$${toUsdApprox(499)}`,
      description: 'Best for solo operators and lean internal teams who need stronger AI, more channels, and shared collaboration.',
      features: [
        'Everything in Free',
        'Higher-quality AI generation and image generation',
        'Bulk content generation and strategy builder',
        'Internal team mode with up to 5 members',
        'Connect up to 8 social accounts across supported modules',
        'Role-based access control (Owner, Admin, Editor, Viewer)',
        'Automation-ready workflows through credits and BYOK',
        'Advanced analytics and insights',
        '120 platform credits per month',
        '220 BYOK credits per month',
        'Priority support',
      ],
      notIncluded: [],
      buttonText: 'Upgrade to Pro',
      popular: true
    },
    {
      name: 'Agency',
      displayName: 'Agency',
      price: 'Rs 2499',
      monthlyPrice: 'Rs 2499',
      monthlyPriceUsdApprox: `~$${toUsdApprox(2499)}`,
      description: 'Built for client delivery: workspaces, approvals, pooled credits, and calmer publishing operations at agency scale.',
      features: [
        '6 client workspaces (included)',
        '6 seats total including owner (included)',
        'Client workspace management: brand, logo, timezone, pause/archive',
        'Assign team members to specific client workspaces',
        'Roles: Admin, Editor, Viewer with workspace-level access control',
        'Attach workspace accounts across X, LinkedIn, Threads, and staged Social Genie rollouts',
        'Launch Tweet Genie, LinkedIn Genie, and Social Genie from workspace context',
        'Client approval links, workspace publishing, and shared client calendar views',
        'Pooled agency credits across all workspaces',
        '900 platform credits per month for the agency pool',
        '1800 BYOK credits per month for the agency pool',
        'Shared analytics summary per workspace',
        'Priority support',
      ],
      notIncluded: [],
      buttonText: 'Upgrade to Agency',
      popular: false
    }
  ];

  const comparisonFeatures = [
    { name: 'Best for', free: 'Testing and setup', pro: 'Solo + internal teams', agency: 'Client workspaces' },
    { name: 'Ownership scope', free: 'Personal', pro: 'Personal or team', agency: 'Agency pool' },
    { name: 'AI quality mode', free: 'Basic AI', pro: 'Upgraded AI', agency: 'Upgraded AI + workspace context' },
    { name: 'Monthly credits (Platform)', free: '15', pro: '120', agency: '900 pooled' },
    { name: 'Monthly credits (BYOK)', free: '50', pro: '220', agency: '1800 pooled' },
    { name: 'Connected accounts', free: '2 starter connections', pro: 'Up to 8', agency: 'Per workspace allocation' },
    { name: 'Automation path', free: 'Starter only', pro: 'Credits + BYOK', agency: 'Pooled credits + BYOK' },
    { name: 'Analytics', free: 'Basic', pro: 'Advanced', agency: 'Workspace-level reporting' },
    { name: 'Image generation', free: false, pro: true, agency: true },
    { name: 'Bulk generation', free: false, pro: true, agency: true },
    { name: 'Team collaboration', free: false, pro: true, agency: true },
    { name: 'Client approvals', free: false, pro: false, agency: true },
    { name: 'Client workspaces', free: false, pro: false, agency: true },
    { name: 'Priority support', free: false, pro: true, agency: true },
  ];

  const faqs = [
    {
      question: 'How do I upgrade to Pro?',
      answer: `Click 'Upgrade to Pro', complete the secure Razorpay checkout, and your account will be upgraded for Rs 499/month (about $${toUsdApprox(499)}/month).`
    },
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
    },
    {
      question: 'What social platforms do you support?',
      answer: 'SuiteGenie currently supports X/Twitter and LinkedIn deeply, with Social Genie handling Threads and staged Instagram or YouTube rollouts based on workspace availability and deployment settings.'
    },
    {
      question: 'Is there a setup fee or contract?',
      answer: 'No setup fees and no long-term contracts required. You can cancel anytime with just a few clicks from your account settings.'
    },
    {
      question: 'How does the AI content generation work?',
      answer: 'Our AI uses the credits attached to your plan or your own BYOK setup to generate drafts, refinements, strategy outputs, and analysis. In Agency mode, that context is pooled at the workspace and agency level instead of acting like a blank personal account.'
    },
    /* {
      question: 'Can I get a refund if I\'m not satisfied?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not completely satisfied, contact our support team for a full refund.'
    }, */

    {
      question: 'What kind of support do you provide?',
      answer: 'Free users get starter support. Pro and Agency customers get faster priority support so active publishing workflows are not blocked for long.'
    },
    {
      question: 'Where do I manage my team after upgrading to Pro?',
      answer: 'After upgrading to Pro, you can visit the /team page on your dashboard to create or manage your team. You\'ll be able to invite members, manage social accounts, and collaborate with your team on content creation.'
    },
    {
      question: 'How do I start with Agency plan?',
      answer: `Click 'Upgrade to Agency', complete the secure Razorpay subscription checkout, and your account will be upgraded to Agency for Rs 2499/month (about $${toUsdApprox(2499)}/month).`
    },
    {
      question: 'Is automation a separate plan?',
      answer: 'Automation is an add-on layer on top of a paid base plan. Standalone Automation sits on Pro, while Agency Automation sits on top of the Agency base plan for pooled client delivery.'
    },
    {
      question: 'How do agency credits work?',
      answer: 'Agency credits are pooled at the agency level and can be used across client workspaces. Publishing, approvals, comments, and scheduling stay workflow-native, while AI-heavy actions consume credits.'
    },
    {
      question: 'Will there be automation add-ons later?',
      answer: 'They are live now. Standalone Automation builds on Pro for solo workflows, and Agency Automation builds on Agency for client-workspace delivery.'
    }
  ];

  const agencyExpansionAddons = [
    {
      id: 'agency_extra_seat',
      title: 'Extra Seat',
      priceLabel: '₹249 one-time',
      description: 'Add 1 more permanent team seat to your Agency account for client delivery.',
      active: false,
      buttonText: '+1 Seat',
      helper: extraSeatQuantity > 0 ? `${extraSeatQuantity} extra seat${extraSeatQuantity === 1 ? '' : 's'} active` : 'Stacks on top of the 6 seats already included.',
    },
    {
      id: 'agency_extra_workspace',
      title: 'Extra Workspace',
      priceLabel: '₹349 one-time',
      description: 'Add 1 more permanent client workspace when your base Agency allocation is full.',
      active: false,
      buttonText: '+1 Workspace',
      helper: extraWorkspaceQuantity > 0 ? `${extraWorkspaceQuantity} extra workspace${extraWorkspaceQuantity === 1 ? '' : 's'} active` : 'Stacks on top of the 6 workspaces already included.',
    },
    {
      id: 'agency_white_label',
      title: 'White-label',
      priceLabel: '₹999 one-time',
      description: 'Unlock white-label controls for client approval links and future agency-facing surfaces.',
      active: hasWhiteLabelAddon,
      buttonText: hasWhiteLabelAddon ? 'Active' : 'Unlock White-label',
      helper: hasWhiteLabelAddon ? 'White-label is active on this Agency account.' : 'Best for agencies presenting a branded client experience.',
    },
    {
      id: 'agency_reporting_export',
      title: 'Reporting Export',
      priceLabel: '₹699 one-time',
      description: 'Unlock premium reporting export controls for client-ready delivery and reporting workflows.',
      active: hasReportingExportAddon,
      buttonText: hasReportingExportAddon ? 'Active' : 'Unlock Reporting Export',
      helper: hasReportingExportAddon ? 'Reporting export is active on this Agency account.' : 'Use this when your team needs client-facing report delivery.',
    },
    {
      id: 'agency_media_library',
      title: 'Media Library',
      priceLabel: '₹499 one-time',
      description: 'Unlock the shared Agency media library with 25 GB included workspace-ready storage.',
      active: hasMediaLibraryAddon,
      buttonText: hasMediaLibraryAddon ? 'Active' : 'Unlock Media Library',
      helper: hasMediaLibraryAddon
        ? `${agencyAddonAccess.features?.mediaLibraryStorageGb || 25} GB storage enabled for this Agency account.`
        : 'Makes asset reuse cleaner across client workspaces.',
    },
  ];

  const handleAddonCheckout = async (packageId) => {
    if (addonCheckoutLoading) return;

    if (!user) {
      if (packageId === 'solo_automation') {
        navigate('/register?plan=pro&intent=solo_automation');
      } else if (packageId.startsWith('agency_')) {
        navigate(`/register?plan=agency&intent=${packageId}`);
      } else {
        navigate(`/register?intent=${packageId}`);
      }
      return;
    }

    if (packageId === 'solo_automation' && currentIndividualPlanType === 'free') {
      toast.error('Standalone Automation sits on top of Pro. Upgrade to Pro first.');
      return;
    }

    if (packageId.startsWith('agency_') && currentIndividualPlanType !== 'agency') {
      toast.error(packageId === 'agency_automation'
        ? 'Agency Automation requires an active Agency plan first.'
        : 'Agency expansion packs require an active Agency plan first.'
      );
      return;
    }

    setAddonCheckoutLoading(packageId);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        return;
      }

      const orderResponse = await api.post('/payments/create-order', {
        type: 'addon',
        package: packageId,
      });

      const { orderId, amount, currency, description, demo } = orderResponse.data || {};

      if (!orderId) {
        toast.error('Failed to initialize automation checkout. Please try again.');
        return;
      }

      if (demo) {
        const confirmDemo = window.confirm(
          `DEMO MODE: This is a simulated ${String(packageId || '').replace(/_/g, ' ')} activation. Continue?`
        );

        if (!confirmDemo) {
          return;
        }

        const verifyResponse = await api.post('/payments/verify', {
          razorpayOrderId: orderId,
          razorpayPaymentId: 'demo_payment_id',
          razorpaySignature: 'demo_signature',
          demoOrderType: 'addon',
          demoPackage: packageId,
        });

        await refreshUser();
        await refreshPlanInfo();
        toast.success(verifyResponse.data?.message || 'Add-on activated successfully.');
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
              toast.success(verifyResponse.data?.message || 'Add-on activated successfully.');
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
            ondismiss: () => reject(new Error('CHECKOUT_DISMISSED')),
          },
        });

        razorpay.on('payment.failed', (failure) => {
          const reason = failure?.error?.description || 'Payment failed. Please try again.';
          reject(new Error(reason));
        });

        razorpay.open();
      });
    } catch (error) {
      if (error?.message === 'CHECKOUT_DISMISSED') {
        toast.error('Payment was cancelled.');
      } else {
        toast.error(error?.response?.data?.error || error?.message || 'Failed to activate add-on.');
      }
    } finally {
      setAddonCheckoutLoading('');
    }
  };

  const handleProUpgrade = async () => {
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
      return;
    }

    if (authoritativePlanType === 'enterprise') {
      toast.success('Legacy plan detected. Contact support to change plan.');
      return;
    }
    if (authoritativePlanType === 'agency') {
      toast.success('You are already on Agency.');
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

      const { orderId, amount, currency, description, demo } = orderResponse.data;

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
          demoOrderType: 'plan',
          demoPackage: 'pro',
        });

        await refreshUser();
        toast.success(verifyResponse.data?.message || 'Pro plan activated successfully.');
        navigate('/team');
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

      navigate('/team');
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

  const handleAgencyUpgrade = async () => {
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

    if (authoritativePlanType === 'agency') {
      toast.success('Your Agency plan is already active.');
      navigate('/agency');
      return;
    }

    if (authoritativePlanType === 'enterprise') {
      toast.success('Legacy plan detected. Contact support to change plan.');
      return;
    }

    setUpgrading(true);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        return;
      }

      const subscriptionResponse = await api.post('/payments/agency/subscribe');
      const {
        subscriptionId,
        amount,
        currency,
        planName,
        demo,
        razorpayKey: responseKey,
      } = subscriptionResponse.data || {};

      if (!subscriptionId) {
        toast.error('Agency subscription could not be created. Please try again.');
        return;
      }

      if (demo) {
        const confirmDemo = window.confirm(
          'DEMO MODE: This is a simulated Agency subscription payment. Continue?'
        );

        if (!confirmDemo) {
          return;
        }

        const confirmResponse = await api.post('/payments/agency/confirm', {
          razorpaySubscriptionId: subscriptionId,
          razorpayPaymentId: 'demo_payment_id',
          razorpaySignature: 'demo_signature',
        });

        await refreshUser();
        await refreshPlanInfo();
        toast.success(confirmResponse.data?.message || 'Agency plan activated successfully.');
        navigate('/agency');
        return;
      }

      const razorpayKey = responseKey || import.meta.env.VITE_RAZORPAY_KEY_ID || '';
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
          subscription_id: subscriptionId,
          name: 'SuiteGenie',
          description: planName || 'SuiteGenie Agency subscription',
          amount,
          currency,
          handler: async (response) => {
            try {
              const confirmResponse = await api.post('/payments/agency/confirm', {
                razorpaySubscriptionId: response.razorpay_subscription_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              await refreshUser();
              await refreshPlanInfo();
              toast.success(confirmResponse.data?.message || 'Agency plan activated successfully.');
              resolve(confirmResponse.data);
            } catch (confirmationError) {
              reject(confirmationError);
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
          const reason = failure?.error?.description || 'Subscription payment failed. Please try again.';
          reject(new Error(reason));
        });

        razorpay.open();
      });

      navigate('/agency');
    } catch (error) {
      if (error?.message === 'CHECKOUT_DISMISSED') {
        toast.error('Payment was cancelled.');
      } else {
        toast.error(error?.response?.data?.error || error?.message || 'Failed to upgrade to Agency.');
      }
    } finally {
      setUpgrading(false);
    }
  };

  const handleAgencyCancel = async () => {
    setAgencyBillingBusyAction('cancel');
    try {
      const response = await api.post('/payments/agency/cancel');
      toast.success(response.data?.message || 'Agency cancellation scheduled.');
      await refreshAgencyBilling();
      await refreshPlanInfo();
      await refreshUser();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to cancel Agency subscription.');
    } finally {
      setAgencyBillingBusyAction('');
    }
  };

  const handleAgencyResume = async () => {
    setAgencyBillingBusyAction('resume');
    try {
      const response = await api.post('/payments/agency/resume');
      toast.success(response.data?.message || 'Agency subscription resumed.');
      await refreshAgencyBilling();
      await refreshPlanInfo();
      await refreshUser();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to resume Agency subscription.');
    } finally {
      setAgencyBillingBusyAction('');
    }
  };

  const getPlanButtonText = (plan) => {
    if (upgrading) return 'Processing...';

    if (plan.name === 'Agency') {
      if (currentIndividualPlanType === 'agency') return 'Current Plan - Agency';
      if (currentIndividualPlanType === 'enterprise') return 'Contact Support';
      return 'Upgrade to Agency';
    }

    if (plan.name === 'Pro') {
      if (currentIndividualPlanType === 'pro') return 'Current Plan - Active';
      if (currentIndividualPlanType === 'enterprise') return 'Contact Support';
      if (currentIndividualPlanType === 'agency') return 'Already on Agency';
      if (pendingIntent === 'pro') return 'Upgrade to Pro (Recommended)';
    }

    return plan.buttonText;
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <PublicSeo
        title="SuiteGenie Plans and Pricing | Free, Pro, and Agency"
        description="Compare SuiteGenie Free, Pro, and Agency plans for AI social media operations, BYOK, internal teams, client workspaces, pooled credits, and automation-friendly publishing."
        canonicalPath="/plans"
        keywords="SuiteGenie pricing, SuiteGenie plans, social media automation pricing, BYOK pricing, AI content automation plans"
        schema={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'SuiteGenie',
            description:
              'AI social media automation platform for creators, founders, and teams.',
            brand: {
              '@type': 'Brand',
              name: 'SuiteGenie',
            },
            offers: [
              {
                '@type': 'Offer',
                name: 'SuiteGenie Free',
                price: '0',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
              {
                '@type': 'Offer',
                name: 'SuiteGenie Pro',
                price: '499',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
              {
                '@type': 'Offer',
                name: 'SuiteGenie Agency',
                price: '2499',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
              {
                '@type': 'Offer',
                name: 'SuiteGenie Standalone Automation Add-on',
                price: '799',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
              {
                '@type': 'Offer',
                name: 'SuiteGenie Agency Automation Add-on',
                price: '2999',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
              {
                '@type': 'Offer',
                name: 'SuiteGenie Agency Extra Seat',
                price: '249',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
              {
                '@type': 'Offer',
                name: 'SuiteGenie Agency Extra Workspace',
                price: '349',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
              {
                '@type': 'Offer',
                name: 'SuiteGenie Agency White-label',
                price: '999',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
              {
                '@type': 'Offer',
                name: 'SuiteGenie Agency Reporting Export',
                price: '699',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
              {
                '@type': 'Offer',
                name: 'SuiteGenie Agency Media Library',
                price: '499',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          },
        ]}
      />

      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose the right operating layer for how you work: solo, internal team, or agency client delivery.
            AI-heavy usage scales through credits and BYOK instead of pushing you into a confusing extra plan.
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-700">
            <span className="font-medium">Base plan = ownership scope</span>
            <span className="text-blue-300">•</span>
            <span>Credits + BYOK = AI usage depth</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Ownership Scope</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-3">Pick the workspace model first</h2>
            <p className="text-sm text-gray-600 mt-2">
              Free is for solo testing. Pro is for creators and internal teams. Agency is for client workspaces, approvals, and pooled delivery.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">AI Usage</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-3">Credits meter expensive work</h2>
            <p className="text-sm text-gray-600 mt-2">
              AI-heavy actions consume credits. Publishing, approvals, scheduling, comments, and calendar workflows stay operational instead of charging you per click.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Automation + BYOK</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-3">Scale usage without changing products</h2>
            <p className="text-sm text-gray-600 mt-2">
              BYOK lowers hosted AI cost pressure, while higher plans give you more room for bulk generation, analysis refreshes, and automation-heavy workflows.
            </p>
          </div>
        </div>
      </div>

      {user && (currentIndividualPlanType === 'agency' || agencyBilling?.subscription) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Agency Billing</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage cancellation, resume access, and recent invoices.
                </p>
                <p className="text-sm text-gray-700 mt-3">
                  Status: <span className="font-semibold">{agencyBilling?.subscription?.status || 'not_started'}</span>
                  {agencyBilling?.subscription?.cancel_at_cycle_end ? ' • Cancels at cycle end' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAgencyCancel}
                  disabled={agencyBillingLoading || agencyBillingBusyAction !== '' || !agencyBilling?.actions?.canCancel}
                  className="rounded-lg border border-red-200 text-red-700 px-4 py-2 text-sm hover:bg-red-50 disabled:opacity-50"
                >
                  {agencyBillingBusyAction === 'cancel' ? 'Cancelling...' : 'Cancel at Cycle End'}
                </button>
                <button
                  type="button"
                  onClick={handleAgencyResume}
                  disabled={agencyBillingLoading || agencyBillingBusyAction !== '' || !agencyBilling?.actions?.canResume}
                  className="rounded-lg border border-green-200 text-green-700 px-4 py-2 text-sm hover:bg-green-50 disabled:opacity-50"
                >
                  {agencyBillingBusyAction === 'resume' ? 'Resuming...' : 'Resume Subscription'}
                </button>
              </div>
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium text-gray-900 mb-2">Recent Invoices</p>
              {agencyBillingLoading ? (
                <p className="text-sm text-gray-500">Loading billing history...</p>
              ) : agencyBilling?.invoices?.length > 0 ? (
                <div className="space-y-2">
                  {agencyBilling.invoices.slice(0, 8).map((invoice) => (
                    <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 border rounded-lg px-3 py-2">
                      <p className="text-sm text-gray-800">
                        {invoice.status || 'unknown'} • {invoice.currency || 'INR'} {(Number(invoice.amount || 0) / 100).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : 'No paid date'}
                        </span>
                        {invoice.hostedUrl && (
                          <button
                            type="button"
                            onClick={() => window.open(invoice.hostedUrl, '_blank', 'noopener,noreferrer')}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Open
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No invoices yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-lg p-8 relative ${plan.popular ? 'border-2 border-blue-500 scale-105' : 'border border-gray-200'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.displayName || plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">{plan.monthlyPrice}</span>
                  {plan.price !== 'Free' && plan.price !== 'Custom' && (
                    <span className="text-gray-500 ml-1">/month</span>
                  )}
                </div>
                {plan.monthlyPriceUsdApprox && (
                  <p className="mt-2 text-sm text-gray-500">{plan.monthlyPriceUsdApprox} / month</p>
                )}
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feature, idx) => (
                  <div key={idx} className="flex items-start opacity-50">
                    <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-500">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={async () => {
                  // If not logged in, redirect to register with plan parameter
                  if (!user) {
                    if (plan.name === 'Pro') {
                      navigate('/register?plan=pro');
                    } else if (plan.name === 'Agency') {
                      navigate('/register?plan=agency');
                    } else {
                      navigate('/register');
                    }
                    return;
                  }

                  if (plan.name === 'Agency') {
                    if (currentIndividualPlanType === 'agency') {
                      navigate('/agency');
                      return;
                    }
                    await handleAgencyUpgrade();
                    return;
                  }

                  // If user is logged in and clicking Pro plan, upgrade
                  if (plan.name === 'Pro') {
                    await handleProUpgrade();
                    return;
                  }
                }}
                disabled={upgrading}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } ${upgrading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {getPlanButtonText(plan)}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Automation + Add-ons</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">Automation add-ons now sit on the right paid base</h3>
              <p className="mt-3 text-slate-700">
                Buy only the automation layer you need, but keep the ownership model clean. Standalone Automation builds on Pro, while Agency Automation builds on Agency.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:w-[520px]">
              <div className="rounded-xl border border-white bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Standalone Automation</p>
                <p className="mt-1 text-sm text-slate-600">₹799 / 30 days. Best for solo operators on Pro who want recurring generation and deeper automation without moving into Agency.</p>
                <button
                  type="button"
                  onClick={() => handleAddonCheckout('solo_automation')}
                  disabled={addonCheckoutLoading !== '' || hasSoloAutomation || (Boolean(user) && currentIndividualPlanType === 'free')}
                  className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {hasSoloAutomation ? 'Automation Active' : Boolean(user) && currentIndividualPlanType === 'free' ? 'Requires Pro Plan' : addonCheckoutLoading === 'solo_automation' ? 'Processing...' : 'Activate Standalone Automation'}
                </button>
              </div>
              <div className="rounded-xl border border-white bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Agency Automation</p>
                <p className="mt-1 text-sm text-slate-600">₹2999 / 30 days. Adds a deeper automation layer to Agency workspaces, approvals, and pooled client operations.</p>
                <button
                  type="button"
                  onClick={() => handleAddonCheckout('agency_automation')}
                  disabled={addonCheckoutLoading !== '' || hasAgencyAutomation || currentIndividualPlanType !== 'agency'}
                  className="mt-4 w-full rounded-lg border border-amber-300 bg-amber-100 px-4 py-2.5 text-sm font-medium text-amber-900 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {hasAgencyAutomation ? 'Agency Automation Active' : currentIndividualPlanType !== 'agency' ? 'Requires Agency Plan' : addonCheckoutLoading === 'agency_automation' ? 'Processing...' : 'Activate Agency Automation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Agency Expansion Packs</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">Add the extra Agency capacity and delivery features when you need them</h3>
            <p className="mt-3 text-slate-600">
              These are one-time Agency upgrades. Seats and workspaces stack on top of your included limits, while white-label, reporting export, and media library unlock once for the whole Agency account.
            </p>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {agencyExpansionAddons.map((addon) => {
              const requiresAgencyPlan = currentIndividualPlanType !== 'agency';
              const isProcessing = addonCheckoutLoading === addon.id;
              const isDisabled = addonCheckoutLoading !== '' || addon.active || requiresAgencyPlan;

              return (
                <div key={addon.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{addon.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{addon.description}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {addon.priceLabel}
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">{addon.helper}</p>
                  <button
                    type="button"
                    onClick={() => handleAddonCheckout(addon.id)}
                    disabled={isDisabled}
                    className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {addon.active
                      ? addon.buttonText
                      : requiresAgencyPlan
                        ? 'Requires Agency Plan'
                        : isProcessing
                          ? 'Processing...'
                          : addon.buttonText}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Compare Features Across Plans</h2>
            <p className="text-xl text-gray-600">See exactly what's included in each plan</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Features</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900">Free</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 bg-blue-50">Pro</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 bg-indigo-50">Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900">{feature.name}</td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center bg-blue-50">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 font-medium">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center bg-indigo-50">
                      {typeof feature.agency === 'boolean' ? (
                        feature.agency ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 font-medium">{feature.agency}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pricing Model Section */}
      <div className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How the Model Works</h2>
            <p className="text-xl text-gray-600">Choose the operating layer you need, then scale AI usage through credits and BYOK.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">01</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pick the Base Layer</h3>
              <p className="text-gray-600">Use Free for solo testing, Pro for creators and internal teams, and Agency when your work revolves around client workspaces and approvals.</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">02</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Use Credits for AI Work</h3>
              <p className="text-gray-600">Draft generation, refinements, and heavier analysis use credits. Scheduling, publishing, approvals, and collaboration stay workflow-native.</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">03</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scale with BYOK</h3>
              <p className="text-gray-600">Bring your own keys when you want tighter AI cost control and a higher usage ceiling without changing how the product works.</p>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-lg p-8 border-2 border-blue-500">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Start with the Workflow You Actually Need</h3>
            <p className="text-gray-600 text-center mb-6">
              Pro is the best fit when you need stronger AI and team collaboration. Agency is the right move when you need client workspaces, approvals, and pooled credits across delivery.
            </p>
            <div className="text-center">
              <button
                onClick={() => navigate(currentIndividualPlanType === 'agency' ? '/agency' : currentIndividualPlanType === 'pro' ? '/team' : '/register')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {currentIndividualPlanType === 'agency' ? 'Open Agency Hub' : currentIndividualPlanType === 'pro' ? 'Open Team Workspace' : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about our pricing and features</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <button
              onClick={() => navigate('/contact')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Our Support Team
            </button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to run calmer content operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start free, move to Pro when you need more output, or switch to Agency when client delivery needs a real system.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
          >
            Get Started Today
          </button>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PlansPage;
