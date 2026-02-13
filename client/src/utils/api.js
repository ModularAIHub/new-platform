import axios from 'axios'

// CSRF token cache
let csrfToken = null;

// Fetch CSRF token from backend
export async function fetchCsrfToken() {
    try {
        const res = await api.get('/csrf-token');
        csrfToken = res.data.csrfToken;
        return csrfToken;
    } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        return null;
    }
}

// Use relative URL in development to leverage Vite proxy, production uses absolute backend URL
// Dynamic baseURL selection for different platforms
const getBaseURL = (platform) => {
    if (platform === 'twitter') {
        // Tweet Genie backend
        return 'http://localhost:3002/api';
    } else if (platform === 'linkedin') {
        // Linkedin Genie backend
        return 'http://localhost:3004/api';
    } else {
        // New Platform backend
        return import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://api.suitegenie.in/api');
    }
};

const baseURL = getBaseURL();

// Set timeout: 45s for production, 20s for local/dev
const isProd = window.location.hostname.includes('suitegenie.in') || import.meta.env.MODE === 'production';
const timeoutFromEnv = Number.parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '', 10);
const timeout = Number.isFinite(timeoutFromEnv) && timeoutFromEnv > 0
    ? timeoutFromEnv
    : (isProd ? 45000 : 20000);

const api = axios.create({
    baseURL,
    withCredentials: true,
    timeout,
})

// Helper for Twitter-specific requests
export const twitterApi = axios.create({
    baseURL: getBaseURL('twitter'),
    withCredentials: true,
    timeout,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
    async (config) => {
        const method = config.method && config.method.toUpperCase();
        if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
            if (!csrfToken) {
                await fetchCsrfToken();
            }
            if (csrfToken) {
                config.headers['X-CSRF-Token'] = csrfToken;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor with token refresh logic
api.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config;

        // Only attempt token refresh for 401 errors on protected routes
        // Exclude auth endpoints and already retried requests
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url.includes('/auth/login') && 
            !originalRequest.url.includes('/auth/register') &&
            !originalRequest.url.includes('/auth/refresh') &&
            !originalRequest.url.includes('/auth/verify-token')) {
            
            // Check if we have tokens to refresh (basic check)
            const hasTokens = document.cookie.includes('accessToken') || 
                             document.cookie.includes('refreshToken') ||
                             localStorage.getItem('accessToken') ||
                             sessionStorage.getItem('accessToken');
            
            if (!hasTokens) {
                // No tokens available, but don't redirect if on guest pages
                const isGuestPage = window.location.pathname === '/' || 
                                   window.location.pathname === '/login' || 
                                   window.location.pathname === '/register' ||
                                   window.location.pathname === '/about' ||
                                   window.location.pathname === '/contact' ||
                                   window.location.pathname === '/plans';
                                   
                if (typeof window !== 'undefined' && !isGuestPage) {
                    window.location.href = '/';
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log('Attempting token refresh...');
                // Always fetch and send CSRF token for refresh
                if (!csrfToken) {
                    await fetchCsrfToken();
                }
                const response = await api.post('/auth/refresh', {}, {
                    headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
                });
                console.log('Token refresh successful');
                
                processQueue(null);
                isRefreshing = false;
                
                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                console.log('Token refresh failed:', refreshError);
                processQueue(refreshError);
                isRefreshing = false;
                
                // If refresh fails, but don't redirect if on guest pages
                const isGuestPage = window.location.pathname === '/' || 
                                   window.location.pathname === '/login' || 
                                   window.location.pathname === '/register' ||
                                   window.location.pathname === '/about' ||
                                   window.location.pathname === '/contact' ||
                                   window.location.pathname === '/plans';
                                   
                if (typeof window !== 'undefined' && !isGuestPage) {
                    window.location.href = '/';
                }
                
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
)

export default api
