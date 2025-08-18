import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    timeout: 10000,
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
