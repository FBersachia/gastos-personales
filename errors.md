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

## CSV Import Issues

### Issue: Payment method not being auto-detected

**Description:** CSV import shows "Select..." instead of auto-suggesting payment method.

**Common Cases & Solutions:**

1. **"Efectivo Carla amex" detected as "Efectivo" instead of "Amex Galicia"**
   - **Cause:** Word "efectivo" appears before "amex" in description
   - **Solution:** Detection now prioritizes card keywords (visa, amex) before other patterns
   - **Fixed in:** `csv-parser.service.ts:183-242` (2025-10-24)

2. **"Sueldo SCES" not detected as Income**
   - **Cause:** Income keywords not being detected from description
   - **Solution:** Added auto-detection for income keywords: sueldo, salario, ingreso, honorarios, etc.
   - **Fixed in:** `csv-parser.service.ts:89-116` (2025-10-24)

**Payment Method Detection Rules (in priority order):**

1. **Hardcoded ID Mappings** (checked first):
   - "ingreso" → `c398157b-1cf2-4b05-b574-ae6f5f550fd6` (Income payment method)
   - "Amex Galicia" → `cb91b600-4c13-477a-88ba-15aeea7d2095`
   - "Amex Santander" → `ed5141fa-863c-4ae4-aaa8-a84256d0c432`
   - "Efectivo" → `9fa37e03-b502-4b2a-91df-a1f82f039004`
   - "Visa Galicia" → `c5c71f96-7643-4b4b-a9e6-7be867a0227a`
   - "Visa Santander" → `e03810f7-9d46-4b71-abf8-8cb0a6104aed`

   Income detection keywords: sueldo, salario, ingreso, pago de sueldo, honorarios, paga, remuneracion, nomina

2. **CSV Detection Patterns** (applied during parsing):
   - **Specific card patterns:**
     - "visa s" → Visa Santander
     - "visa g" → Visa Galicia
     - "amex g" → Amex Galicia
     - "amex s" → Amex Santander
     - "master c" → Mastercard Carrefour

   - **Card keywords (checked before other patterns):**
     - Contains "visa" → Visa Galicia
     - Contains "amex" → Amex Galicia

   - **Generic patterns:**
     - efectivo, transferencia, debito, santander, galicia, bbva, mercado pago, brubank, uala

   - **Default fallback:** → Efectivo

3. **Dynamic Matching** (fallback if no hardcoded mapping exists):
   - 5-level matching algorithm: exact, normalized, partial, all-words, significant-words
   - Only used for payment methods not in the hardcoded list

**How it works:**
1. CSV parser detects payment method name from transaction description
2. System checks hardcoded ID mapping first (case-insensitive)
3. If hardcoded match found: uses that specific ID
4. If no hardcoded match: uses 5-level dynamic matching algorithm
5. Payment method filter works case-insensitively

**How to fix detection issues:**
1. Add new payment methods to the hardcoded mapping in `import.service.ts` if needed
2. Ensure payment methods exist in database with correct IDs
3. Re-upload CSV after backend changes
4. Check warnings for records defaulted to "Efectivo"
5. Verify filter selections are case-insensitive

**Related Files:**
- `backend/src/modules/import/csv-parser.service.ts` - Detection logic (lines 183-242)
- `backend/src/modules/import/import.service.ts` - Hardcoded mappings (lines 34-41) and matching logic (lines 217-310)
- `frontend/src/pages/CsvImport.tsx` - UI with filters and visual indicators
- `frontend/src/pages/PaymentMethods.tsx` - Payment methods management (shows full IDs)

**Key Features:**
- ✅ Case-insensitive matching for all payment methods
- ✅ Income transactions automatically assigned to `c398157b-1cf2-4b05-b574-ae6f5f550fd6`
- ✅ Hardcoded ID mappings for 6 payment methods
- ✅ Visual indicators (green ✓ for auto-matched, orange ⚠ for unmatched)
- ✅ Payment method filter with A-Z/Z-A sorting
- ✅ Console logging for debugging matches

---

### Issue: Import button stays on "Importing..." and never completes

**Description:** When clicking the "Import" button with a large CSV file (e.g., 619 transactions), the page shows "Importing..." indefinitely. The browser Network tab shows the request as "pending" and never completes.

**Root Cause:**
- The backend was processing transactions **one at a time** in a loop (lines 141-214 in old `import.service.ts`)
- For 619 transactions, this resulted in ~2,500+ individual database queries:
  - 619 × validate payment method (1 query each)
  - 619 × validate category (1 query each)
  - 619 × create transaction (1 query each)
  - Additional queries for installment validation
- PostgreSQL connection timed out after processing many queries
- Error in logs: `prisma:error Error in PostgreSQL connection: connection closed by upstream database`
- Request stayed "pending" because backend never sent a response

**Symptoms:**
- Frontend console shows: `[API] Upload progress: 100%` but no response
- Browser Network tab: Request status = "pending" (never completes)
- Backend logs: `[IMPORT CONFIRM] Request received` but no completion message
- Backend logs show: `prisma:error connection closed by upstream database`
- No errors in frontend console (request never completes or fails)

**Solution:**
Replaced individual database operations with **batch operations** using Prisma's `createMany`:

**Before (slow - causes timeout):**
```typescript
for (let i = 0; i < data.transactions.length; i++) {
  const paymentMethod = await prisma.paymentMethod.findFirst({ ... }); // 619 queries
  const category = await prisma.category.findUnique({ ... }); // 619 queries
  await prisma.transaction.create({ ... }); // 619 queries
}
// Total: ~2,500+ database queries → timeout
```

**After (fast - completes in seconds):**
```typescript
// 1. Batch validate all payment methods (1 query)
const validPaymentMethods = await prisma.paymentMethod.findMany({
  where: { id: { in: paymentMethodIds }, userId }
});

// 2. Batch validate all categories (1 query)
const validCategories = await prisma.category.findMany({
  where: { id: { in: categoryIds } }
});

// 3. Batch insert all transactions (1 query)
const result = await prisma.transaction.createMany({
  data: validTransactions,
  skipDuplicates: false
});
// Total: 3 database queries → completes in ~2 seconds
```

**Additional Fixes:**
- Fixed field name mapping: `paymentMethodId` → `paymentId`, `recurringSeriesId` → `seriesId` (to match Prisma schema)
- Added detailed console logging for debugging
- Added fallback to individual inserts if batch insert fails

**Performance Improvement:**
- **Before:** 619 transactions = ~2,500+ queries = timeout (never completes)
- **After:** 619 transactions = 3 queries = ~2 seconds

**Files Changed:**
- `backend/src/modules/import/import.service.ts:122-236` - Replaced loop with batch operations
- `backend/src/modules/import/import.controller.ts:64-97` - Added detailed logging
- `frontend/src/api/import.api.ts:84-118` - Added timeout (5 min) and error logging
- `frontend/src/api/client.ts:14-64` - Added request/response interceptor logging

**How to Prevent:**
- Always use batch operations (`createMany`, `findMany` with `in` operator) for bulk inserts
- Avoid loops with individual database queries when processing large datasets
- Monitor database query count during development
- Set reasonable timeouts for large operations

**Related Issues:**
- Database connection pooling limits
- Prisma query performance
- Request timeout configuration

---

## Dashboard Errors

### Error: `500 Internal Server Error` on `/api/v1/dashboard/summary`

**Description:** Dashboard page shows "Error al cargar el resumen" and browser console shows 500 error. Backend logs show `PrismaClientValidationError` at line 78 in `dashboard.service.ts`.

**Root Cause:**
- Invalid Prisma query syntax for filtering null values in `categoryId` field
- Attempted syntax `categoryId: { not: null }` is not valid in Prisma
- Also tried `NOT: { categoryId: null }` which is also invalid syntax

**Error Message:**
```
PrismaClientValidationError:
D:\...\backend\src\modules\dashboard\dashboard.service.ts:78:60
```

**Symptoms:**
- Dashboard loads but shows error state
- Browser console: `Failed to load resource: the server responded with a status of 500`
- Backend logs: Empty error message (just the location)
- Frontend shows: "Error al cargar el resumen"

**Solution:**
Remove the null filter from Prisma query and filter in JavaScript instead:

**Before (causes error):**
```typescript
const topCategoriesRaw = await this.prisma.transaction.findMany({
  where: {
    ...currentMonthWhere,
    type: 'EXPENSE',
    categoryId: { not: null }, // ❌ Invalid Prisma syntax
  },
  select: { categoryId: true, amount: true },
});
```

**After (working):**
```typescript
// Fetch all expense transactions (no null filter in query)
const topCategoriesRaw = await this.prisma.transaction.findMany({
  where: {
    userId,
    date: { gte: currentMonthStart, lte: currentMonthEnd },
    type: 'EXPENSE',
  },
  select: { categoryId: true, amount: true },
});

// Filter out nulls in JavaScript
const topCategoriesFiltered = topCategoriesRaw.filter(t => t.categoryId !== null);
```

**Why This Works:**
- Prisma's null filtering syntax is inconsistent across different field types
- JavaScript `.filter()` is simpler, more reliable, and easier to debug
- Performance impact is negligible (filtering happens in-memory after fetch)
- Works with all Prisma versions and field types

**Files Changed:**
- `backend/src/modules/dashboard/dashboard.service.ts:76-107` - Fixed top categories query

**How to Prevent:**
- Use JavaScript filtering for complex null checks instead of Prisma `NOT` operator
- Test Prisma queries with actual data before deployment
- Check Prisma documentation for correct null filtering syntax (varies by version)
- Add comprehensive error logging to identify validation errors quickly

**Related Issues:**
- Prisma Decimal field aggregation (solved by manual aggregation)
- Prisma `groupBy` limitations on Decimal fields

**Fixed:** 2025-10-26

---

**Last Updated:** 2025-10-26
