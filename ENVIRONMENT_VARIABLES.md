# Environment Variables Documentation

This document lists all environment variables required for the Finance Manager application.

## Table of Contents
- [Backend Environment Variables](#backend-environment-variables)
- [Frontend Environment Variables](#frontend-environment-variables)
- [Setup Instructions](#setup-instructions)
- [Production Deployment](#production-deployment)

---

## Backend Environment Variables

### Required Variables

| Variable | Type | Description | Example | Required |
|----------|------|-------------|---------|----------|
| `DATABASE_URL` | string | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |  Yes |
| `JWT_SECRET` | string | Secret key for JWT signing (min 32 chars) | Generated via `openssl rand -base64 32` |  Yes |
| `JWT_EXPIRES_IN` | string | JWT token expiration time | `7d`, `24h`, `60m` |  Yes |
| `CORS_ORIGIN` | string | Allowed CORS origin(s) | `http://localhost:5173` |  Yes |

### Optional Variables

| Variable | Type | Description | Default | Required |
|----------|------|-------------|---------|----------|
| `NODE_ENV` | string | Application environment | `development` | No |
| `PORT` | number | Server port | `3000` | No (auto in Vercel) |
| `LOG_LEVEL` | string | Logging level | `info` | No |

---

## Frontend Environment Variables

### Required Variables

| Variable | Type | Description | Example | Required |
|----------|------|-------------|---------|----------|
| `VITE_API_URL` | string | Backend API base URL | `http://localhost:3000/api/v1` |  Yes |

### Optional Variables

| Variable | Type | Description | Default | Required |
|----------|------|-------------|---------|----------|
| `VITE_DEBUG` | boolean | Enable debug mode | `false` | No |

---

## Setup Instructions

### Local Development

#### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the example file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and fill in the required values:
   ```bash
   # Example local development values
   DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_manager
   JWT_SECRET=$(openssl rand -base64 32)
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   NODE_ENV=development
   PORT=3000
   LOG_LEVEL=info
   ```

#### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Copy the example file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and set the API URL:
   ```bash
   VITE_API_URL=http://localhost:3000/api/v1
   ```

---

## Production Deployment

### Vercel Backend Configuration

Set these environment variables in the Vercel dashboard:

```bash
# Database (use Vercel Postgres, Supabase, or Railway)
DATABASE_URL=<your-production-database-url>

# JWT (generate a secure secret)
JWT_SECRET=<generated-secure-secret-32-chars>
JWT_EXPIRES_IN=7d

# CORS (set to your frontend URL)
CORS_ORIGIN=https://your-app.vercel.app

# Environment
NODE_ENV=production
LOG_LEVEL=info
```

### Vercel Frontend Configuration

Set these environment variables in the Vercel dashboard:

```bash
# API URL (set to your backend URL)
VITE_API_URL=https://your-backend.vercel.app/api/v1
```

---

## Security Best Practices

### DO 
- Use strong, randomly generated JWT secrets (min 32 characters)
- Generate JWT_SECRET with: `openssl rand -base64 32`
- Use different secrets for development and production
- Keep `.env` files in `.gitignore`
- Use environment-specific values (different DB for dev/prod)
- Rotate secrets periodically in production

### DON'T L
- Never commit `.env` files to version control
- Never share production secrets in chat/email
- Never use simple/weak JWT secrets like "secret123"
- Never use the same database for development and production
- Never hardcode secrets in source code
- Never expose backend environment variables to frontend

---

## Generating Secure Secrets

### JWT Secret
```bash
# Generate a secure 32-character secret
openssl rand -base64 32
```

### Database Password
```bash
# Generate a secure database password
openssl rand -base64 24
```

---

## Troubleshooting

### Common Issues

#### Backend won't start
- **Check:** Is `DATABASE_URL` correct?
- **Check:** Can you connect to the database?
- **Check:** Is `JWT_SECRET` set and at least 32 characters?

#### Frontend API calls fail
- **Check:** Is `VITE_API_URL` correct?
- **Check:** Does `CORS_ORIGIN` in backend match frontend URL?
- **Check:** Is the backend server running?

#### CORS errors
- **Check:** `CORS_ORIGIN` in backend `.env` matches frontend URL exactly
- **Check:** No trailing slashes in URLs
- **Check:** Protocol matches (http vs https)

#### JWT token issues
- **Check:** `JWT_SECRET` is the same across all backend instances
- **Check:** `JWT_EXPIRES_IN` is valid format (`7d`, `24h`, etc.)
- **Check:** System clocks are synchronized

---

## Environment-Specific Examples

### Local Development
```bash
# Backend
DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_dev
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3000/api/v1
```

### Staging/Testing
```bash
# Backend
DATABASE_URL=postgresql://user:pass@staging-db.com:5432/finance_staging
CORS_ORIGIN=https://staging-app.vercel.app

# Frontend
VITE_API_URL=https://staging-api.vercel.app/api/v1
```

### Production
```bash
# Backend
DATABASE_URL=postgresql://user:pass@prod-db.com:5432/finance_prod
CORS_ORIGIN=https://app.yourdomain.com
NODE_ENV=production

# Frontend
VITE_API_URL=https://api.yourdomain.com/api/v1
```

---

## Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
