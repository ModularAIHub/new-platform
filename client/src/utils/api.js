import axios from 'axios'


const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Set timeout: 45s for production, 10s for local/dev
const isProd = window.location.hostname.includes('kanishksaraswat.me') || import.meta.env.MODE === 'production';
const timeout = isProd ? 45000 : 10000;

const api = axios.create({
    baseURL,
    withCredentials: true,
    timeout,
})

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add any request headers here if needed
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - simplified to not auto-refresh
api.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        // Simply return the error without trying to refresh
        return Promise.reject(error)
    }
)

export default api
