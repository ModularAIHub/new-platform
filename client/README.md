# Autoverse Hub - Frontend Client

A modern React.js frontend application for the Autoverse Hub platform, providing user authentication, API key management, and credit tracking functionality.

## 🚀 Features

- **User Authentication**
  - Email/password registration with OTP verification
  - Secure login with JWT tokens
  - Forgot password with email verification
  - Session management with automatic token refresh

- **Account Management**
  - User profile settings
  - Password change with OTP verification
  - Account deletion with confirmation
  - Notification preferences

- **API Keys Management**
  - Create and manage API keys
  - View API key usage statistics
  - Regenerate keys with security confirmation

- **Credits System**
  - Real-time credit balance tracking
  - Usage history and analytics
  - Credit purchase and management

- **Modern UI/UX**
  - Responsive design with Tailwind CSS
  - Toast notifications for user feedback
  - Loading states and error handling
  - Accessible components and forms

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Form Validation**: Custom validation utilities
- **State Management**: React Context API

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Backend server running (see server README)

## 🔧 Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   
   Create a `.env` file in the client directory:
   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_APP_NAME=Autoverse Hub
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ForgotPasswordModal.jsx
│   ├── Layout.jsx
│   ├── Loader.jsx
│   ├── OTPModal.jsx
│   └── ProtectedRoute.jsx
├── contexts/           # React Context providers
│   └── AuthContext.jsx
├── pages/              # Application pages
│   ├── ApiKeysPage.jsx
│   ├── CreditsPage.jsx
│   ├── DashboardPage.jsx
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── SettingsPage.jsx
├── utils/              # Utility functions
│   ├── api.js         # Axios configuration
│   └── validation.js  # Form validation utilities
├── App.jsx            # Main app component
├── index.css          # Global styles
└── main.jsx           # Application entry point
```

## 🔐 Authentication Flow

1. **Registration**: Email verification with OTP → Account creation
2. **Login**: Email/password → JWT tokens (access + refresh)
3. **Password Reset**: Email verification → New password setup
4. **Session Management**: Automatic token refresh on API calls

## 🎨 UI Components

### Authentication
- Registration form with client-side validation
- Login form with error handling
- OTP verification modal (reusable)
- Password reset flow

### Dashboard
- Welcome screen with user stats
- Quick access to main features
- Credit balance display

### Settings
- Account information management
- Password change with OTP verification
- Account deletion with confirmation
- Notification preferences

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔧 Configuration

### API Configuration
Update `src/utils/api.js` to modify API endpoints and request/response interceptors.

### Validation Rules
Customize validation in `src/utils/validation.js`:
- Email format validation
- Password strength requirements
- Form field validation rules

## 🚦 Development Workflow

1. **Start the backend server** (see server README)
2. **Start the frontend dev server**: `npm run dev`
3. **Make changes** and see live updates
4. **Test authentication flows** with the backend
5. **Build for production**: `npm run build`

## 🔍 Debugging

- **Network Tab**: Monitor API calls in browser dev tools
- **Console Logs**: Check browser console for errors
- **React DevTools**: Install browser extension for component debugging

## 📦 Production Build

```bash
npm run build
```

The build files will be generated in the `dist/` directory and can be served by any static file server.

## 🤝 Contributing

1. Follow the existing code style and structure
2. Add proper validation for all forms
3. Include error handling for API calls
4. Test responsive design on multiple devices
5. Update this README for any new features

## 🐛 Common Issues

**CORS Errors**: Ensure backend CORS is configured for the frontend URL
**API Connection**: Check that `VITE_API_URL` points to the running backend
**Build Errors**: Clear node_modules and reinstall dependencies

## 📄 License

This project is part of the Autoverse Hub platform.
