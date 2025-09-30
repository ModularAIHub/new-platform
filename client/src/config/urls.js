// Centralized URL configuration
// Import all URLs from environment variables

export const URLS = {
  // API URLs
  API_BASE: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  
  // Tool URLs
  TWEET_GENIE: 'https://tweet.suitegenie.in',
  LINKEDIN_GENIE: 'https://linkedin.suitegenie.in',
  WORDPRESS_WRITER: import.meta.env.VITE_WORDPRESS_WRITER_URL || 'http://localhost:5176',
  CUSTOM_LLM: import.meta.env.VITE_CUSTOM_LLM_URL || 'http://localhost:5177',
  
  // Production URLs (for reference)
  PRODUCTION: {
    TWEET_GENIE: 'https://tweet.suitegenie.in',
    LINKEDIN_GENIE: 'https://linkedin.suitegenie.in',
    WORDPRESS_WRITER: 'https://wordpress.suitegenie.in',
    CUSTOM_LLM: 'https://llm.suitegenie.in',
    API_BASE: 'https://api.suitegenie.in'
  }
};

// Tool configurations with metadata
export const TOOLS = {
  TWEET_GENIE: {
    name: 'Tweet Genie',
    description: 'AI-powered tweet and thread generation with smart scheduling. Connect via OAuth, create content in bulk with credits, and track performance with detailed analytics. Scale your X/Twitter presence effortlessly.',
    url: URLS.TWEET_GENIE,
    status: 'active',
    icon: 'ExternalLink'
  },
  LINKEDIN_GENIE: {
    name: 'LinkedIn Genie',
    description: 'Professional LinkedIn content creation',
    url: 'https://linkedin.suitegenie.in',
    status: 'active',
    icon: 'ExternalLink'
  },
  WORDPRESS_WRITER: {
    name: 'WordPress Genie',
    description: 'WordPress content automation',
    url: URLS.WORDPRESS_WRITER,
    status: 'coming-soon',
    icon: 'ExternalLink'
  },
  CUSTOM_LLM: {
    name: 'Custom LLM',
    description: 'Custom AI model integration',
    url: URLS.CUSTOM_LLM,
    status: 'coming-soon',
    icon: 'ExternalLink'
  }
};

// Helper functions
export const getToolUrl = (toolName) => {
  const tool = TOOLS[toolName.toUpperCase().replace(/\s+/g, '_')];
  return tool?.url || '#';
};

export const isProduction = () => {
  return import.meta.env.MODE === 'production';
};

export const getEnvironmentUrls = () => {
  return isProduction() ? URLS.PRODUCTION : URLS;
};

export default URLS;
