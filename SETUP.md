# Setup Instructions - Personal Finance Manager

Quick setup guide to get the application running.

## 📚 Documentation

Before starting, familiarize yourself with:
- [`README.md`](./README.md) - Project overview
- [`tasklist.md`](./tasklist.md) - Development roadmap and pending tasks
- [`especificacion_funcional.md`](./especificacion_funcional.md) - Functional specification
- [`especificacion_tecnica.md`](./especificacion_tecnica.md) - Technical specification
- [`errors.md`](./errors.md) - Common errors and solutions

## Option 1: Docker (Recommended)

The easiest way to run the entire application with all dependencies.

### Prerequisites
- Docker
- Docker Compose

### Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd Gastos-personales
```

2. Create environment files:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

3. Start all services:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Backend API on port 3000
- Frontend on port 5173

4. Run database migrations:
```bash
docker-compose exec backend npx prisma migrate deploy
```

5. (Optional) Seed the database:
```bash
docker-compose exec backend npm run prisma:seed
```

Demo credentials:
- Email: `demo@example.com`
- Password: `password123`

6. Open your browser:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Open Prisma Studio
docker-compose exec backend npx prisma studio
```

## Option 2: Local Development (No Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Step 1: Database Setup

1. Install and start PostgreSQL

2. Create database:
```sql
CREATE DATABASE financedb;
CREATE USER finance_user WITH PASSWORD 'finance_pass';
GRANT ALL PRIVILEGES ON DATABASE financedb TO finance_user;
```

### Step 2: Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://finance_user:finance_pass@localhost:5432/financedb
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run migrations:
```bash
npm run prisma:migrate
```

6. (Optional) Seed database:
```bash
npm run prisma:seed
```

7. Start development server:
```bash
npm run dev
```

Backend should be running on http://localhost:3000

### Step 3: Frontend Setup

1. Open a new terminal and navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

4. Start development server:
```bash
npm run dev
```

Frontend should be running on http://localhost:5173

## Verification

1. Check backend health:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  ...
}
```

2. Open frontend in browser:
- Navigate to http://localhost:5173
- You should see the login page

3. Test with demo credentials (if you ran the seed):
- Email: `demo@example.com`
- Password: `password123`

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

Solution:
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database credentials

### Port Already in Use

**Error:** `Port 3000 is already in use`

Solution:
- Change PORT in `backend/.env`
- Or stop the process using port 3000:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

### JWT Secret Too Short

**Error:** `JWT_SECRET must be at least 32 characters`

Solution:
- Update JWT_SECRET in `backend/.env` with a longer string:
```env
JWT_SECRET=your-super-secret-jwt-key-that-is-at-least-32-characters-long
```

### Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

Solution:
```bash
cd backend
npm run prisma:generate
```

### CORS Issues

**Error:** CORS policy errors in browser console

Solution:
- Ensure CORS_ORIGIN in `backend/.env` matches your frontend URL
- Default: `http://localhost:5173`

## Next Steps

Once everything is running:

1. Register a new account or use demo credentials
2. Explore the dashboard
3. Read the documentation:
   - `prd.md` - Product requirements
   - `especificacion_funcional.md` - Functional specification
   - `especificacion_tecnica.md` - Technical specification

## Development Workflow

### Backend Changes
- Code is in `backend/src/`
- Auto-reloads on file changes (tsx watch)
- Add new routes in `backend/src/modules/`

### Frontend Changes
- Code is in `frontend/src/`
- Auto-reloads on file changes (Vite HMR)
- Add new pages in `frontend/src/pages/`

### Database Changes
1. Modify `backend/prisma/schema.prisma`
2. Create migration:
```bash
cd backend
npx prisma migrate dev --name migration_name
```

## Additional Resources

- Prisma Studio (Database GUI):
```bash
cd backend
npm run prisma:studio
```

- View API logs:
```bash
# Docker
docker-compose logs -f backend

# Local
# Logs appear in terminal where npm run dev is running
```

## Support

If you encounter issues:
1. Check this document
2. Review error messages carefully
3. Check the logs
4. Ensure all prerequisites are installed
