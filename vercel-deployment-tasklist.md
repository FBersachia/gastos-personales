# Vercel Deployment Tasklist

## Progress Overview
- ✅ Phase 1.1: Environment Configuration (Completed)
- ✅ Phase 1.2: Backend Configuration (Completed)
- ✅ Phase 1.3: Database Migration Strategy (Completed)
- ⏳ Phase 1.4-10: In Progress
- 📊 Overall Progress: ~15% (3/20 major tasks)

**Last Updated:** 2025-11-14

---

## Project URLs

### Production URLs (Planned)
- **Frontend:** `https://finance.fbersachia.com.ar`
- **Backend:** TBD (will be Vercel URL or custom domain like `api.fbersachia.com.ar`)
- **Database:** Supabase (aws-1-sa-east-1.pooler.supabase.com)

### Development URLs
- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:3000`
- **Database:** Supabase (production database)

### Domain DNS Configuration
- **Frontend Subdomain:** `finance.fbersachia.com.ar`
  - Type: CNAME
  - Value: cname.vercel-dns.com
- **Backend Subdomain (Optional):** `api.fbersachia.com.ar`
  - Type: CNAME
  - Value: cname.vercel-dns.com

---

## Prerequisites
- [ ] Vercel account created
- [x] GitHub repository set up with latest code (https://github.com/FBersachia/gastos-personales.git)
- [x] PostgreSQL database provider chosen (Supabase)
- [x] Environment variables documented in `import.env` file (ready to copy-paste to Vercel)

---

## Phase 1: Prepare Backend for Deployment

### 1.1 Environment Configuration ✅ COMPLETED
- [x] Create `.env.example` file with all required variables (without values)
- [x] Document all environment variables needed:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `NODE_ENV`
  - `PORT` (optional for Vercel)
  - `CORS_ORIGIN`
  - `LOG_LEVEL`
- [x] Created frontend `.env.example` with `VITE_API_URL`
- [x] Created comprehensive `ENVIRONMENT_VARIABLES.md` documentation

### 1.2 Update Backend Configuration ✅ COMPLETED
- [x] Update CORS configuration to accept Vercel frontend domain (supports multiple comma-separated origins)
- [x] Ensure all hardcoded localhost URLs are replaced with environment variables (all URLs use env vars)
- [x] Add Vercel-specific configuration in `vercel.json` for backend
- [x] Created `api/index.ts` serverless function entry point for Vercel
- [x] Fixed `vercel.json` to remove conflicting `builds` property (modern `functions` approach)
- [x] Updated `tsconfig.json` to include api folder
- [x] Created `.vercelignore` for optimized deployments
- [x] Created frontend `vercel.json` for SPA routing and caching

### 1.3 Database Migration Strategy ✅ COMPLETED
- [x] Decided on database provider (Supabase)
- [x] Set up production database with connection string
- [x] Configured Prisma schema to use separate `finance_app` PostgreSQL schema
- [x] Tested Prisma schema on production database using `npx prisma db push`
- [x] Verified all tables created successfully:
  - users
  - payment_methods
  - macro_categories
  - categories
  - recurring_series
  - transactions
  - exchange_rates
- [x] Generated Prisma Client for production schema
- [x] Validated schema configuration

**Database Details:**
- Provider: Supabase
- Host: aws-1-sa-east-1.pooler.supabase.com
- Database: postgres
- Schema: finance_app (isolated from other projects in public schema)
- Connection: SSL enabled with pgBouncer pooling support

### 1.4 API Routes Verification
- [ ] Test all API endpoints locally
- [ ] Ensure no file system dependencies (logs, uploads, etc.)
- [ ] Update file upload handling for serverless (if needed)

---

## Phase 2: Prepare Frontend for Deployment

### 2.1 Environment Configuration
- [ ] Create `.env.production` file or update `.env`
- [ ] Set `VITE_API_URL` to backend URL (TBD - will be set after backend deployment to Vercel)
  - Example: `https://your-backend.vercel.app/api/v1` or custom domain
- [ ] Update all API calls to use environment variable (already configured)

### 2.2 Build Optimization
- [ ] Run production build locally: `npm run build`
- [ ] Check build output size (optimize if > 50MB)
- [ ] Test production build locally: `npm run preview`
- [ ] Fix any build warnings or errors

### 2.3 Frontend Configuration
- [ ] Create `vercel.json` for SPA routing (if needed)
- [ ] Verify all routes work with client-side routing
- [ ] Check that all assets are properly bundled

---

## Phase 3: Deploy Backend to Vercel

### 3.1 Create Backend Project
- [ ] Login to Vercel dashboard
- [ ] Click "Add New Project"
- [ ] Import your GitHub repository (select backend folder or create separate repo)
- [ ] Configure as "Other" framework (Express API)

### 3.2 Configure Backend Settings
- [ ] Set Root Directory to `backend` (if monorepo)
- [ ] Set Build Command: `npm run build` (if you have one) or leave empty
- [ ] Set Output Directory: leave empty (Express doesn't need it)
- [ ] Set Install Command: `npm install`

### 3.3 Set Environment Variables
- [ ] Open `import.env` file in project root (contains all values ready to copy)
- [ ] Add all environment variables in Vercel dashboard:
  - `DATABASE_URL` → Use `POSTGRES_PRISMA_URL` from Supabase (with pgBouncer for serverless connection pooling)
    - Value: `postgres://postgres.tgxcgwzdtjnwmcedzhgv:bwzohKnh6ZLYpxvP@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
  - `JWT_SECRET` → Use Supabase JWT secret or generate new secure secret (32+ chars)
    - Value: `rTtiaXdpyE/bb+CXjGddhLUJg4Ukfa5DfZQXdoBn4BC+sFiIoVLIot07y0j0TE8egMUXcxY+BinKE+bhHvRWiQ==`
  - `JWT_EXPIRES_IN` → `7d`
  - `NODE_ENV` → `production`
  - `CORS_ORIGIN` → `https://finance.fbersachia.com.ar,http://localhost:5173` (supports both production and local dev)
  - `LOG_LEVEL` → `info`
  - `SUPABASE_URL` → `https://tgxcgwzdtjnwmcedzhgv.supabase.co`
  - `SUPABASE_ANON_KEY` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRneGNnd3pkdGpud21jZWR6aGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MzA1MzksImV4cCI6MjA3NjQwNjUzOX0.RvEfoqRx45dcuQBYTDBKQfB8wclfODlSDUgsD7QSsUk`

**Important Notes:**
- The `finance_app` schema is configured in `prisma/schema.prisma` - Prisma will automatically use it
- Use `POSTGRES_PRISMA_URL` (port 6543 with pgBouncer) for serverless deployments on Vercel
- For local development or migrations, use `POSTGRES_URL_NON_POOLING` (port 5432 without pgBouncer)

### 3.4 Deploy Backend
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Note the deployment URL (e.g., `your-backend.vercel.app`)
- [ ] Test health check endpoint: `https://your-backend.vercel.app/health`

### 3.5 Run Database Migrations
- [x] Connected to production database (Supabase)
- [x] Database schema already created in Phase 1.3 using `npx prisma db push`
- [x] Verified all tables are created in `finance_app` schema
- [ ] (Optional) Seed initial data if needed

**Note:** Migrations were already applied in Phase 1.3. No additional migration steps needed unless schema changes are made.

---

## Phase 4: Deploy Frontend to Vercel

### 4.1 Create Frontend Project
- [ ] In Vercel dashboard, click "Add New Project"
- [ ] Import your GitHub repository (select frontend folder)
- [ ] Select "Vite" as framework preset

### 4.2 Configure Frontend Settings
- [ ] Set Root Directory to `frontend` (if monorepo)
- [ ] Build Command: `npm run build` (should auto-detect)
- [ ] Output Directory: `dist` (should auto-detect)
- [ ] Install Command: `npm install` (should auto-detect)

### 4.3 Set Environment Variables
- [ ] Open `import.env` file in project root (contains all values)
- [ ] Add environment variable:
  - `VITE_API_URL` → Backend URL (from Phase 3.4)
    - Will be the backend Vercel URL or custom domain if configured
    - Format: `https://your-backend.vercel.app/api/v1`

**Frontend Domain:** `finance.fbersachia.com.ar`

### 4.4 Deploy Frontend
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Note the deployment URL (e.g., `your-app.vercel.app`)
- [ ] Configure custom domain: `finance.fbersachia.com.ar` in Vercel dashboard

---

## Phase 5: Update CORS Configuration

### 5.1 Update Backend CORS
- [ ] Go to backend Vercel project
- [ ] Update `CORS_ORIGIN` environment variable to frontend URL
- [ ] Redeploy backend (or wait for auto-redeploy)

---

## Phase 6: Testing & Verification

### 6.1 Basic Functionality Tests
- [ ] Open frontend URL in browser
- [ ] Test user registration
- [ ] Test user login
- [ ] Verify JWT token is stored correctly
- [ ] Test authenticated routes

### 6.2 CRUD Operations Tests
- [ ] Test Payment Methods CRUD
- [ ] Test Categories CRUD
- [ ] Test Transactions CRUD
- [ ] Test Recurring Series CRUD
- [ ] Test Installments page

### 6.3 Import Features Tests
- [ ] Test CSV import
- [ ] Test PDF import (all bank types)
- [ ] Verify file uploads work in serverless environment

### 6.4 Dashboard & Analytics Tests
- [ ] Test dashboard loads correctly
- [ ] Verify summary calculations
- [ ] Check charts and widgets
- [ ] Test date filtering

### 6.5 Performance Tests
- [ ] Check page load times
- [ ] Test with large datasets
- [ ] Monitor API response times
- [ ] Check for any console errors

---

## Phase 7: Domain & SSL

### 7.1 Custom Domain Setup - Frontend
- [x] Domain already available: fbersachia.com.ar
- [ ] Add custom subdomain in Vercel: `finance.fbersachia.com.ar`
- [ ] Update DNS records:
  - Type: CNAME
  - Name: finance
  - Value: cname.vercel-dns.com
- [ ] Wait for DNS propagation (can take up to 48 hours)
- [ ] Verify SSL certificate is active (Vercel auto-provisions)

### 7.2 Custom Domain Setup - Backend (Optional)
- [ ] Decide on backend custom domain (e.g., `api.fbersachia.com.ar`)
- [ ] Add custom domain in Vercel backend project
- [ ] Update DNS records for backend subdomain
- [ ] Wait for SSL certificate activation

### 7.3 Update URLs After Custom Domains
- [x] Backend `CORS_ORIGIN` already configured with `https://finance.fbersachia.com.ar`
- [ ] Update frontend `VITE_API_URL` with final backend URL (Vercel URL or custom domain)
- [ ] Redeploy both projects if environment variables changed

---

## Phase 8: Monitoring & Optimization

### 8.1 Set Up Monitoring
- [ ] Enable Vercel Analytics
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up database monitoring

### 8.2 Performance Optimization
- [ ] Enable Vercel Edge Caching where appropriate
- [ ] Optimize images (if any)
- [ ] Enable compression
- [ ] Review and optimize bundle size

### 8.3 Security Hardening
- [ ] Review and rotate JWT secret
- [ ] Enable security headers
- [ ] Set up rate limiting
- [ ] Review CORS configuration
- [ ] Ensure no secrets in client-side code

---

## Phase 9: Continuous Deployment

### 9.1 GitHub Integration
- [ ] Verify auto-deploy on push to main branch
- [ ] Set up preview deployments for PRs
- [ ] Configure branch protection rules

### 9.2 Deployment Workflow
- [ ] Document deployment process
- [ ] Create deployment checklist
- [ ] Set up staging environment (optional)

---

## Phase 10: Post-Deployment

### 10.1 Documentation
- [ ] Update README with production URLs
- [ ] Document environment variables
- [ ] Create deployment troubleshooting guide
- [ ] Update prd.md with deployment status

### 10.2 Backup Strategy
- [ ] Set up automated database backups
- [ ] Document restore procedure
- [ ] Test backup and restore process

### 10.3 User Communication
- [ ] Announce production launch
- [ ] Share production URL
- [ ] Provide user guide (if needed)

---

## Common Issues & Solutions

### Backend Issues
- **"The `functions` property cannot be used in conjunction with the `builds` property"**: Remove the `builds` property from `vercel.json`. Modern Vercel uses only `functions` and `rewrites`. ✅ Fixed
- **"Module not found" errors**: Ensure all dependencies are in `package.json`, not `devDependencies`
- **Database connection fails**: Check `DATABASE_URL` format and SSL requirements
- **CORS errors**: Verify `CORS_ORIGIN` matches frontend URL exactly (no trailing slash)
- **API routes not found**: Check `vercel.json` configuration for rewrites
- **Express app not working on Vercel**: Ensure you have an `api/` folder with an entry point that exports the Express app

### Frontend Issues
- **API calls fail**: Verify `VITE_API_URL` is set correctly and includes `/api/v1`
- **Blank page after deploy**: Check browser console for errors, verify build succeeded
- **404 on refresh**: Ensure SPA routing is configured in `vercel.json`
- **Environment variables not working**: Ensure they start with `VITE_` prefix

### Database Issues
- **Migration fails**: Run `npx prisma generate` before `prisma migrate deploy`
- **Connection pool exhausted**: Increase connection pool size in `DATABASE_URL`
- **Slow queries**: Add database indexes, enable query logging

---

## Rollback Plan

### If Deployment Fails
- [ ] Revert to previous Vercel deployment (use Vercel dashboard)
- [ ] Check logs for errors
- [ ] Fix issues locally
- [ ] Test thoroughly before redeploying

### Database Rollback
- [ ] Have database backup ready before migrations
- [ ] Document rollback SQL scripts
- [ ] Test rollback procedure in staging

---

## Estimated Time
- **Phase 1-2 (Preparation)**: 2-4 hours
- **Phase 3-4 (Deployment)**: 1-2 hours
- **Phase 5-6 (Testing)**: 2-3 hours
- **Phase 7-8 (Optimization)**: 1-2 hours
- **Phase 9-10 (Post-deployment)**: 1-2 hours

**Total**: 7-13 hours (depending on issues encountered)

---

## Notes
- This assumes you're using Vercel for both frontend and backend
- For backend, Vercel will run it as a serverless function
- Make sure your Express app is compatible with serverless (stateless, no file system writes)
- Consider using Vercel Postgres for the database for easiest integration
- Test everything in a staging environment before production deployment
