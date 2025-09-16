# Autoverse Hub - Backend Server

A robust Node.js/Express backend API for the Autoverse Hub platform, providing authentication, user management, API key handling, and credit tracking functionality.

## 🚀 Features

- **Authentication & Security**
  - JWT-based authentication with access and refresh tokens
  - Email verification with OTP (Redis-backed)
  - Password hashing with bcrypt
  - Rate limiting and request validation
  - CORS protection

- **User Management**
  - User registration and login
  - Profile management
  - Password reset functionality
  - Account deletion


- **BYOK API Keys System**
   - Securely store and manage user-provided API keys (BYOK)
   - Usage tracking and analytics
   - Key rotation and security

- **Credits Management**
  - Credit allocation and tracking
  - Usage monitoring
  - Redis-backed real-time balances

- **Database Integration**
  - PostgreSQL for persistent data
  - Redis for sessions, OTP, and caching
  - Database migrations and seeding

## 🛠️ Tech Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache/Sessions**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Custom validation utilities
- **Email**: Nodemailer (configurable)
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- npm or yarn package manager

## 🔧 Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   
   Copy the example environment file and configure:
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=autoverse_hub
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key
   JWT_REFRESH_SECRET=your_refresh_token_secret
   
   # Email (Optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

3. **Database Setup**
   
   Create PostgreSQL database:
   ```sql
   CREATE DATABASE autoverse_hub;
   ```
   
   Run migrations:
   ```bash
   npm run migrate
   ```
   
   Seed initial data (optional):
   ```bash
   npm run seed
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with initial data
- `npm test` - Run test suite
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
server/
├── config/             # Configuration files
│   ├── database.js    # PostgreSQL configuration
│   └── redis.js       # Redis configuration
├── controllers/        # Route controllers
│   ├── authController.js
│   ├── creditController.js
│   ├── paymentsController.js
│   └── plansController.js
├── middleware/         # Express middleware
│   ├── auth.js        # JWT authentication
│   ├── errorHandler.js
│   └── validate.js    # Request validation
├── routes/            # API routes
│   ├── auth.js
│   ├── credits.js
│   ├── payments.js
│   ├── plans.js
│   └── index.js
├── scripts/           # Database scripts
│   ├── migrate.js
│   └── seed.js
├── services/          # Business logic
│   └── creditService.js
├── utils/             # Utility functions
│   ├── bcrypt.js
│   ├── email.js
│   ├── encryption.js
│   └── validation.js
├── workers/           # Background workers
│   └── syncWorker.js
├── package.json
└── index.js          # Server entry point
```

## 🛣️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/change-password` - Change password (authenticated)
- `POST /api/auth/reset-password` - Reset password (with token)
- `GET /api/auth/verify-token` - Verify JWT token


### BYOK (Bring Your Own Key)
- `GET /byok/keys` - List user's BYOK API keys
- `POST /byok/key` - Add a new BYOK API key
- `DELETE /byok/key/:id` - Delete BYOK API key
- `PUT /byok/key/:id` - Update BYOK API key

### Credits
- `GET /api/credits` - Get user's credit balance
- `GET /api/credits/history` - Get credit usage history
- `POST /api/credits/purchase` - Purchase credits

### Plans
- `GET /api/plans` - List available plans
- `GET /api/plans/current` - Get user's current plan

## 🔐 Authentication Flow

### Registration
1. `POST /auth/register` with email, password, name
2. System sends OTP to email
3. `POST /auth/verify-otp` to verify email
4. Account created and ready for login

### Login
1. `POST /auth/login` with email and password
2. Returns access token (15min) and refresh token (7 days)
3. Access token used for authenticated requests
4. Refresh token used to get new access tokens

### Token Refresh
- Access tokens automatically refreshed by frontend
- Refresh tokens stored in httpOnly cookies (secure)

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) DEFAULT 'free',
   credits_remaining INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```


### User API Keys Table (BYOK)
```sql
CREATE TABLE user_api_keys (
   id SERIAL PRIMARY KEY,
   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
   provider VARCHAR(32) NOT NULL,
   key_name VARCHAR(64),
   encrypted_key TEXT NOT NULL,
   created_at TIMESTAMP DEFAULT NOW(),
   updated_at TIMESTAMP DEFAULT NOW(),
   is_active BOOLEAN DEFAULT TRUE
);
```

## 🔧 Configuration

### Environment Variables
- **PORT**: Server port (default: 3000)
- **NODE_ENV**: Environment (development/production)
- **DB_***: PostgreSQL connection settings
- **REDIS_***: Redis connection settings
- **JWT_***: JWT signing secrets
- **SMTP_***: Email configuration

### Rate Limiting
- OTP requests: 5 per hour per email
- Login attempts: 10 per hour per IP
- API key creation: 10 per hour per user

## 🚦 Development Workflow

1. **Setup environment** (database, Redis, .env)
2. **Run migrations**: `npm run migrate`
3. **Start development server**: `npm run dev`
4. **Test endpoints** with Postman/curl
5. **Check logs** for errors and debugging

## 🧪 Testing

### Backend Test Script
```bash
# Run comprehensive backend tests
./test-backend.sh
```

Tests include:
- User registration flow
- Authentication endpoints
- API key management
- Credit system
- Error handling

### Manual Testing
Use the provided test script or tools like:
- Postman collections
- curl commands
- Frontend integration testing

## 🔍 Debugging

### Logs
- Server logs output to console
- Error details in development mode
- Request/response logging available

### Database
```bash
# Connect to PostgreSQL
psql -h localhost -U your_user -d autoverse_hub

# Check Redis
redis-cli
> keys *
> get "some_key"
```

## 🚀 Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   # Set production database and Redis URLs
   # Use strong JWT secrets
   ```

2. **Database Migration**
   ```bash
   npm run migrate
   ```

3. **Start Server**
   ```bash
   npm start
   ```

4. **Process Management** (PM2 recommended)
   ```bash
   pm2 start index.js --name "autoverse-api"
   pm2 startup
   pm2 save
   ```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Short-lived access tokens + refresh tokens
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: All endpoints validate input data
- **CORS Protection**: Configurable CORS policies
- **Environment Isolation**: Secrets in environment variables

## 🤝 Contributing

1. Follow REST API conventions
2. Add input validation for all endpoints
3. Include error handling and logging
4. Test with the provided test script
5. Update API documentation for changes

## 🐛 Common Issues

**Database Connection**: Check PostgreSQL is running and credentials are correct
**Redis Connection**: Ensure Redis server is running
**JWT Errors**: Verify JWT secrets are properly set
**Email Issues**: Check SMTP configuration for OTP delivery

## 📄 License

This project is part of the Autoverse Hub platform.
