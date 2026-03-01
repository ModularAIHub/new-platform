import React, { createContext, useContext, useEffect } from 'react';
import { analytics } from '../config/firebase';
import { logEvent } from 'firebase/analytics';

const FirebaseContext = createContext(null);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  return context;
};

export const FirebaseProvider = ({ children }) => {
  useEffect(() => {
    // Log initial page view
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_path: window.location.pathname,
        page_title: document.title
      });
    }
  }, []);

  // Track route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (analytics) {
        logEvent(analytics, 'page_view', {
          page_path: window.location.pathname,
          page_title: document.title
        });
      }
    };

    // Listen for route changes (for React Router)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const value = {
    analytics,
    // Helper function to log custom events
    logAnalyticsEvent: (eventName, eventParams = {}) => {
      if (analytics) {
        logEvent(analytics, eventName, eventParams);
      }
    }
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
