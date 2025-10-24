# Common Errors and Troubleshooting

This document contains common errors encountered during development and their solutions.

---

## Database Errors

### Error: `Can't reach database server`

**Description:** Backend cannot connect to PostgreSQL database.

**Causes:**
- PostgreSQL is not running
- Wrong database credentials
- Wrong host/port

**Solutions:**
1. Check if PostgreSQL is running
2. Verify DATABASE_URL in `backend/.env`
3. Test connection with: `psql -U postgres -h localhost`

---

### Error: `P1000: Authentication failed`

**Description:** Database credentials are incorrect.

**Solution:**
Update `backend/.env` with correct credentials:
```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/financedb
```

---

### Error: `P2002: Unique constraint failed`

**Description:** Duplicate record (e.g., duplicate email, category name).

**Solution:** This is expected behavior - API returns 409 Conflict.

---

### Error: `P2003: Foreign key constraint failed`

**Description:** Cannot delete record with dependent records.

**Solution:** Delete or reassign dependent records first.

---

## JWT/Authentication Errors

### Error: `JWT_SECRET must be at least 32 characters`

**Solution:**
Update `backend/.env`:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
```

---

### Error: `401 Unauthorized`

**Description:** Invalid or expired JWT token.

**Solutions:**
1. Login again to get new token
2. Check JWT_SECRET matches on backend
3. Clear localStorage and login again

---

## Frontend Errors

### Error: `CORS policy error`

**Solution:**
Check CORS_ORIGIN in `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

---

### Error: `Network Error` or `ERR_CONNECTION_REFUSED`

**Solutions:**
1. Ensure backend is running on port 3000
2. Check VITE_API_URL in `frontend/.env`

---

## Prisma Errors

### Error: `Prisma Client not initialized`

**Solution:**
```bash
cd backend
npx prisma generate
```

---

## Build Errors

### Error: `Port 3000 already in use`

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Or change PORT in `backend/.env`**

---

**Last Updated:** 2025-10-24
