# Vercel Deployment Tasklist

## Progress Overview
- ✅ Phase 1.1: Environment Configuration (Completed)
- ⏳ Phase 1.2-10: In Progress
- 📊 Overall Progress: ~5% (1/20 major tasks)

**Last Updated:** 2025-11-02

---

## Prerequisites
- [ ] Vercel account created
- [x] GitHub repository set up with latest code (https://github.com/FBersachia/gastos-personales.git)
- [ ] PostgreSQL database provider chosen (Vercel Postgres, Supabase, or Railway)

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

### 1.2 Update Backend Configuration
- [ ] Update CORS configuration to accept Vercel frontend domain
- [ ] Ensure all hardcoded localhost URLs are replaced with environment variables
- [ ] Add Vercel-specific configuration in `vercel.json` for backend

### 1.3 Database Migration Strategy
- [ ] Decide on database provider (Vercel Postgres recommended)
- [ ] Set up production database
- [ ] Test Prisma migrations on production database
- [ ] Create migration script for initial deployment

### 1.4 API Routes Verification
- [ ] Test all API endpoints locally
- [ ] Ensure no file system dependencies (logs, uploads, etc.)
- [ ] Update file upload handling for serverless (if needed)

---

## Phase 2: Prepare Frontend for Deployment

### 2.1 Environment Configuration
- [ ] Create `.env.production` file
- [ ] Set `VITE_API_URL` to backend Vercel URL
- [ ] Update all API calls to use environment variable

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
- [ ] Add all environment variables in Vercel dashboard:
  - `DATABASE_URL` → Production database connection string
  - `JWT_SECRET` → Generate secure secret (32+ chars)
  - `JWT_EXPIRES_IN` → `7d`
  - `NODE_ENV` → `production`
  - `CORS_ORIGIN` → Your frontend Vercel URL
  - `LOG_LEVEL` → `info`

### 3.4 Deploy Backend
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Note the deployment URL (e.g., `your-backend.vercel.app`)
- [ ] Test health check endpoint: `https://your-backend.vercel.app/health`

### 3.5 Run Database Migrations
- [ ] Connect to production database
- [ ] Run: `npx prisma migrate deploy` (or use Vercel CLI)
- [ ] Verify tables are created
- [ ] (Optional) Seed initial data if needed

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
- [ ] Add environment variable:
  - `VITE_API_URL` → Backend Vercel URL (from Phase 3.4)

### 4.4 Deploy Frontend
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Note the deployment URL (e.g., `your-app.vercel.app`)

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

## Phase 7: Domain & SSL (Optional)

### 7.1 Custom Domain Setup
- [ ] Purchase domain (if needed)
- [ ] Add custom domain in Vercel
- [ ] Update DNS records
- [ ] Wait for DNS propagation
- [ ] Verify SSL certificate is active

### 7.2 Update URLs
- [ ] Update backend `CORS_ORIGIN` to custom domain
- [ ] Update frontend `VITE_API_URL` if backend has custom domain
- [ ] Redeploy both projects

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
- **"Module not found" errors**: Ensure all dependencies are in `package.json`, not `devDependencies`
- **Database connection fails**: Check `DATABASE_URL` format and SSL requirements
- **CORS errors**: Verify `CORS_ORIGIN` matches frontend URL exactly (no trailing slash)
- **API routes not found**: Check `vercel.json` configuration for rewrites

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
