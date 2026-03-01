import React from 'react'
import ReactDOM from 'react-dom/client'
import { Honeybadger, HoneybadgerErrorBoundary } from '@honeybadger-io/react';
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import { FirebaseProvider } from './contexts/FirebaseContext.jsx'
import './index.css'

const isLocalhost = (() => {
    if (typeof window === 'undefined') return false
    const host = String(window.location.hostname || '').toLowerCase()
    return host === 'localhost' || host === '127.0.0.1' || host === '::1'
})()

const isDev = Boolean(import.meta.env.DEV)

const honeybadger = Honeybadger.configure({
    apiKey: 'hbp_A8vjKimYh8OnyV8J3djwKrpqc4OniI3a4MJg', // Replace with your real key
    environment: isDev || isLocalhost ? 'development' : 'production'
});


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HoneybadgerErrorBoundary honeybadger={honeybadger}>
            <FirebaseProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <ScrollToTop />
                    <App />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                            success: {
                                duration: 3000,
                                iconTheme: {
                                    primary: '#22c55e',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                duration: 5000,
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </BrowserRouter>
            </FirebaseProvider>
        </HoneybadgerErrorBoundary>
    </React.StrictMode>,
)
