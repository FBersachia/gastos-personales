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

### Issue: CSV import shows incorrect amounts (amounts divided by 1000)

**Description:** After importing CSV files, transaction amounts are incorrect. For example, a transaction with amount `-7000` in the CSV file appears as `7` in the database.

**Root Cause:**
- The `parseAmount()` function in `csv-parser.service.ts` incorrectly treats dots as decimal separators
- Example: `-7.000` (7 thousand with European/Argentinian format using dot as thousands separator)
- Old logic: Treated the dot as decimal separator → parsed as `-7.0` → stored as `7`
- Affected all amounts with dots as thousands separators (e.g., `1.234`, `10.000`, `25.500`)

**Symptoms:**
- Transaction amounts are 1000x smaller than expected
- Example: `-7000` becomes `7`, `-25000` becomes `25`
- Only affects CSV imports with amounts using dot (.) as thousands separator
- Manual entries and PDF imports not affected

**Solution:**
Enhanced `parseAmount()` function to detect thousands separators:

**Before (incorrect parsing):**
```typescript
private parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/[^\d.,-]/g, '');
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  let normalized = cleaned;
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // ❌ Always treats dot as decimal separator
    normalized = cleaned.replace(/,/g, '');
  }
  return parseFloat(normalized);
}
```

**After (correct parsing):**
```typescript
private parseAmount(amountStr: string): number {
  // ... same initial cleaning ...

  // Count occurrences to detect thousands separators
  const dotCount = (cleaned.match(/\./g) || []).length;
  const commaCount = (cleaned.match(/,/g) || []).length;

  if (lastComma > lastDot) {
    // Comma is decimal: 1.234,56 → 1234.56
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    const afterDot = cleaned.substring(lastDot + 1);

    // ✅ Detect thousands separator: single dot + exactly 3 digits
    if (dotCount === 1 && commaCount === 0 && afterDot.length === 3) {
      // 7.000 → 7000 (thousands separator)
      normalized = cleaned.replace(/\./g, '');
    } else {
      // 7.50 → 7.50 (decimal separator)
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (dotCount > 1) {
    // Multiple dots: 1.234.567 → 1234567
    normalized = cleaned.replace(/\./g, '');
  } else if (commaCount > 1) {
    // Multiple commas: 1,234,567 → 1234567
    normalized = cleaned.replace(/,/g, '');
  }

  return parseFloat(normalized);
}
```

**Detection Rules (applied in order):**
1. **Comma after dot** → Comma is decimal: `1.234,56` → `1234.56`
2. **Single dot with exactly 3 digits after** → Dot is thousands separator: `7.000` → `7000`
3. **Single dot with other digits** → Dot is decimal: `7.50` → `7.50`
4. **Multiple dots** → Thousands separators: `1.234.567` → `1234567`
5. **Multiple commas** → Thousands separators: `1,234,567` → `1234567`

**Examples:**
| CSV Value | Old Result | New Result | Explanation |
|-----------|------------|------------|-------------|
| `-7.000`  | `7.0`      | `7000`     | Thousands separator detected |
| `-25.500` | `25.5`     | `25500`    | Thousands separator detected |
| `1.234,56`| `1234.56`  | `1234.56`  | Comma is decimal (unchanged) |
| `7.50`    | `7.50`     | `7.50`     | Decimal separator (unchanged) |
| `1.234.567`| `1.234567` | `1234567`  | Multiple thousands separators |

**How to Fix Existing Data:**
If you already imported CSV files with incorrect amounts:

1. **Delete all transactions** (keeps categories and payment methods):
   ```bash
   cd backend
   npx tsx scripts/delete-transactions.ts
   ```

2. **Re-import CSV files** with the fixed parser
   - The new parser will correctly handle thousands separators
   - Verify amounts are correct before final import

**Files Changed:**
- `backend/src/modules/import/csv-parser.service.ts:154-200` - Enhanced `parseAmount()` function
- `backend/scripts/delete-transactions.ts` - Script to delete all transactions

**How to Prevent:**
- Test CSV parser with various amount formats before production use
- Validate imported amounts against source CSV file
- Add unit tests for `parseAmount()` with different formats
- Document expected CSV format for users

**Related Issues:**
- Regional number formatting differences (European vs American)
- Decimal precision in Prisma schema (`Decimal(12, 2)`)

**Fixed:** 2025-10-28

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

## PDF Import Errors

### Error: `PDF parsing error: (0 , import_pdf_parse.default) is not a function`

**Description:** PDF import fails with various import-related errors when trying to use the pdf-parse library.

**Error Evolution:**
- **Iteration 1:** `import pdf from 'pdf-parse'` → Error: "(0 , import_pdf_parse.default) is not a function"
- **Iteration 2:** `import pdfParse from 'pdf-parse/lib/pdf-parse.js'` → Error: "ERR_PACKAGE_PATH_NOT_EXPORTED: Package subpath './lib/pdf-parse.js' is not defined"
- **Iteration 3:** `const pdfParse = require('pdf-parse')` → Error: "pdfParse is not a function"
- **Iteration 4:** `const pdfParseModule = require('pdf-parse'); const pdfParse = pdfParseModule.default || pdfParseModule` → Error: "pdfParse is not a function"
- **Iteration 5:** `const pdfParseModule: any = await import('pdf-parse')` → Error: "Cannot find module '.../pdf-parse/dist/pdf-parse/esm/index.js'"

**Root Cause:**
- Initially had wrong version of pdf-parse installed (v2.4.5 which has different module structure)
- pdf-parse@1.1.1 is a CommonJS module that exports a function directly: `module.exports = Pdf;`
- Dynamic import (`await import()`) doesn't work correctly with this CommonJS module in tsx environment
- The module structure shows it exports a function directly, not an object with a default property

**Symptoms:**
- PDF upload fails with 400 Bad Request
- Backend logs show various "PDF parsing error" messages
- Module inspection shows no `default` export property
- Different error messages depending on import method used

**Debug Steps Taken:**
1. Added console logging to inspect module structure:
   ```typescript
   const pdfParseModule: any = await import('pdf-parse');
   console.log('Module keys:', Object.keys(pdfParseModule));
   console.log('Module.default:', pdfParseModule.default);
   // Output showed no 'default' property
   ```

2. Checked installed package version:
   ```bash
   # Found wrong version (2.4.5) installed initially
   npm uninstall pdf-parse
   npm install pdf-parse@1.1.1
   ```

3. Inspected actual package structure:
   ```bash
   # Checked node_modules/pdf-parse/package.json
   # "main": "index.js"

   # Checked node_modules/pdf-parse/index.js
   # module.exports = Pdf;
   ```

**Solution:**
Use `require()` directly instead of dynamic import:

**Before (all attempts failed):**
```typescript
// ❌ Attempt 1: ESM import
import pdf from 'pdf-parse';
const pdfData = await pdf(fileBuffer);

// ❌ Attempt 2: Dynamic import
const pdfParseModule: any = await import('pdf-parse');
const pdfParse = pdfParseModule.default || pdfParseModule;
const pdfData = await pdfParse(fileBuffer);
```

**After (working):**
```typescript
// ✅ CommonJS require (tsx supports this)
const pdfParse = require('pdf-parse');
const pdfData = await pdfParse(fileBuffer);
```

**Why This Works:**
- pdf-parse@1.1.1 is a pure CommonJS module
- tsx (TypeScript executor) fully supports `require()` for CommonJS modules
- `require()` correctly loads the exported function directly
- No need for dynamic import or default property access

**Files Changed:**
- `backend/src/modules/import/pdf-parser.service.ts:27-33` - Changed from dynamic import to require
- `backend/package.json:42` - Ensure pdf-parse@1.1.1 is installed (not 2.4.5)

**How to Prevent:**
- Check if npm package is CommonJS or ESM before using
- For CommonJS modules in TypeScript, prefer `require()` over dynamic `import()`
- Test imports immediately after installation
- Check package.json "main" field to see module type
- Inspect node_modules structure when imports fail

**Related Issues:**
- ESM vs CommonJS module compatibility
- tsx module resolution
- Dynamic import limitations

**Package Version:**
- **Working:** pdf-parse@1.1.1 (CommonJS)
- **Broken:** pdf-parse@2.4.5 (has different module structure)

**Fixed:** 2025-10-28

---

### Error: Amex Galicia PDF only extracts 9 transactions instead of 43

**Description:** When importing an Amex Galicia PDF statement (e.g., `202503-amex-galicia.pdf`), the parser only extracts 9 transactions when the PDF contains 43 transactions between "DETALLE DEL CONSUMO" and "TARJETA 1857 Total Consumos de FRANCISCO BERSACHIA".

**Root Cause:**
- The PDF was being detected as "GALICIA" bank (correct), but was using the Visa Galicia parser instead of a dedicated Amex Galicia parser
- Visa Galicia format is different from Amex Galicia format
- After pdf-parse extracts text, Amex Galicia transactions appear in three different formats:
  1. **Multi-line format** (3 lines per transaction): date+description / comprobante / amount
  2. **Single-line concatenated**: date+description+comprobante+amount (no spaces)
  3. **Single-line with spaces**: date+marker+description+comprobante+amount (with spaces, for USD transactions)
- The original parser couldn't handle these mixed formats
- Argentine number format (dots for thousands, comma for decimals) was being parsed incorrectly in concatenated lines

**Symptoms:**
- PDF upload succeeds but only shows 9 transactions in preview
- Missing 34 transactions from pages 1-2 of the PDF
- Backend logs show successful parsing but with low transaction count
- Affects only Amex Galicia PDFs (Visa Galicia and Santander work fine)
- Transactions from second page not being extracted

**Debug Process:**
1. Used pdf-parse to examine raw text structure after PDF parsing
2. Discovered transactions appear in different formats on same PDF:
   - Multi-line: `"16-09-24*DEVENTAS SA 07/18"` / `"582305"` / `"28.096,82"`
   - Concatenated: `"02-03-25*MERPAGO*THEBEST 8113001.900,00"`
   - With spaces: `"05-03-25*AUBASA DAC          0032516812 1960716.119,18"`
3. Identified need for specialized parser to handle all three formats

**Solution:**
Created dedicated `parseAmexGalicia()` method that handles all three formats:

```typescript
/**
 * Parse Amex Galicia PDF statement
 * After pdf-parse, the format can be:
 * 1. Multi-line (3 lines):
 *    "16-09-24*DEVENTAS SA 07/18"
 *    "582305"
 *    "28.096,82"
 * 2. Single-line concatenated:
 *    "02-03-25*MERPAGO*THEBEST 8113001.900,00"
 * 3. Single-line with spaces (USD transactions):
 *    "28-02-25EDIGITALOCEAN.COM    NT_RRTUSD       29,18 91130129,18"
 */
private parseAmexGalicia(text: string, lines: string[]): ParsedPdfTransaction[] {
  // Pattern 1: Multi-line format (date + asterisk + description)
  const multiLinePattern = /^(\d{2}-\d{2}-\d{2})\s*([*EKQ])(.+)$/;

  // Check if next two lines are comprobante (6 digits) and amount
  if (nextLine1.match(/^\d{6}$/) && nextLine2.match(/^[\d.,]+$/)) {
    // Extract date, description, amount
    // Skip 3 lines
  }

  // Pattern 2 & 3: Single-line formats
  // Amount uses Argentine format: dots for thousands, comma for decimals
  const singleLinePattern = /^(\d{2}-\d{2}-\d{2})\s*([*EKQ]?)(.+?)\s*(\d{6})([\d.]+,\d+)(?:\s+([\d.]+,\d+))?\s*$/;

  // Use USD amount if marker is 'E' and USD amount exists
  const amount = (marker === 'E' && amountUsd)
    ? this.parseAmount(amountUsd)
    : this.parseAmount(amountPesos);
}
```

**Enhanced `parseGalicia()` to detect Amex format:**
```typescript
private parseGalicia(text: string): ParsedPdfTransaction[] {
  const transactions: ParsedPdfTransaction[] = [];
  const lines = text.split('\n');

  // Check if this is Amex Galicia format
  const isAmexGalicia = text.includes('DETALLE DEL CONSUMO') ||
                        text.includes('AMERICAN EXPRESS');

  if (isAmexGalicia) {
    return this.parseAmexGalicia(text, lines);
  }

  // Parse Visa Galicia format (existing logic)
  // ...
}
```

**Key Features:**
- Handles multi-line transactions (3 lines: date/description, comprobante, amount)
- Handles single-line concatenated format with regex: `(\d{6})([\d.]+,\d+)`
- Correctly parses Argentine number format (e.g., "4.200,00" = 4200.00)
- Detects installments from description (e.g., "07/18", "03/06")
- Removes installment notation from description after detection
- Handles USD transactions (marker 'E' with two amounts)
- Stops parsing at "Total Consumos de" or "TARJETA" line
- **Installment date logic:** Uses statement period date instead of original purchase date
  - Example: Transaction dated "22-12-24" with installment "04/06" in March 2025 statement
  - Original purchase date: December 22, 2024 (when the item was first bought)
  - Transaction date recorded: March 2025 (when the money actually left the account)
  - This ensures accurate accounting by tracking cash flow, not purchase history

**Amount Parsing:**
The regex `([\d.]+,\d+)` correctly captures Argentine format:
- `4.200,00` → 4200.00 (dot = thousands separator)
- `867,22` → 867.22 (comma = decimal separator)
- `1.234.567,89` → 1234567.89 (multiple thousands separators)

**Files Changed:**
- `backend/src/modules/import/pdf-parser.service.ts:256-360` - Enhanced `parseGalicia()` to detect Amex format
- `backend/src/modules/import/pdf-parser.service.ts:362-485` - Added new `parseAmexGalicia()` method

**Verification:**
```bash
# Test with actual PDF file
cd backend
npx tsx test-amex-parser.ts

# Expected output:
# ✅ Bank detected: GALICIA
# ✅ Payment method: Amex Galicia
# ✅ Total transactions: 43
# ✅ All amounts correct (e.g., AUBASA DAC: $6119.18, PROVINCIA SEGUROS: $109573.32)
```

**Transaction Examples:**
| Type | Example Line | Extracted Amount | Installments |
|------|-------------|------------------|--------------|
| Multi-line | `16-09-24*DEVENTAS SA 07/18` | $28096.82 | 07/18 |
| Concatenated | `02-03-25*MERPAGO*THEBEST 8113001.900,00` | $1900.00 | N/A |
| With spaces | `05-03-25*AUBASA DAC 0032516812 1960716.119,18` | $6119.18 | N/A |
| USD | `28-02-25EDIGITALOCEAN.COM NT_RRTUSD 29,18 91130129,18` | $29.18 | N/A |

**How to Prevent:**
- Test PDF parsers with actual PDF files from each bank
- Handle multiple text extraction formats from pdf-parse
- Account for regional number formats (Argentine: dot=thousands, comma=decimal)
- Use regex patterns that handle concatenated numbers (comprobante+amount)
- Parse all pages of multi-page PDFs (check for repeated headers)
- Stop parsing at transaction totals to avoid duplicate/summary lines

**Related Issues:**
- pdf-parse text extraction format variations
- Regional number format parsing
- Multi-page PDF handling
- Mixed transaction format detection

**Fixed:** 2025-10-29

---

## Frontend Toast Notifications

### Issue: No success message when editing/creating/deleting transactions

**Description:** When editing, creating, or deleting a transaction, the frontend does not show any success feedback to the user, making it unclear whether the operation completed successfully.

**Root Cause:**
- The Transactions page was not using the existing custom toast notification system
- Initially tried to use react-hot-toast library, but the project already had a custom `ToastContext` implementation
- The Toaster component from react-hot-toast was missing from App.tsx, preventing notifications from appearing

**Symptoms:**
- No visual feedback after editing a transaction
- No visual feedback after creating a transaction
- No visual feedback after deleting a transaction
- User console showed "Transaction updated, showing toast..." but no toast appeared

**Solution:**
Used the existing custom toast system instead of react-hot-toast:

**Before (no notifications):**
```typescript
// No toast notifications implemented
try {
  if (editingTransaction) {
    await updateTransaction(editingTransaction.id, formData);
  } else {
    await createTransaction(formData);
  }
  await fetchTransactions();
  handleCloseModal();
} catch (err: any) {
  setFormError(err.response?.data?.error?.message || 'Failed to save transaction');
}
```

**After (with notifications):**
```typescript
import { useToast } from '@/contexts/ToastContext';

export default function Transactions() {
  const toast = useToast();

  // ...

  try {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, formData);
      toast.success('Transaction updated successfully');
    } else {
      await createTransaction(formData);
      toast.success('Transaction created successfully');
    }
    await fetchTransactions();
    handleCloseModal();
  } catch (err: any) {
    setFormError(err.response?.data?.error?.message || 'Failed to save transaction');
  }
}
```

**Files Changed:**
- `frontend/src/pages/Transactions.tsx` - Added `useToast()` hook and success notifications for create, update, and delete operations
- `frontend/src/contexts/ToastContext.tsx` - Reduced default toast duration from 5000ms to 3000ms
- `frontend/src/components/ui/Toast.tsx` - Reduced default toast duration from 5000ms to 3000ms

**Toast Duration Issue:**
- **Problem:** Default toast duration was 5 seconds, which felt too long for simple success messages
- **Solution:** Reduced default duration to 3 seconds (3000ms) for better UX

**How to Prevent:**
- Always use the existing custom toast system (`useToast` hook) instead of installing new toast libraries
- Add success/error feedback for all user actions (create, update, delete)
- Test toast notifications after implementation to verify they appear and have appropriate duration
- Keep toast durations short for success messages (2-3 seconds)

**Related Issues:**
- UX feedback patterns
- Custom context vs third-party libraries
- Toast notification best practices

**Toast Messages Added:**
- "Transaction created successfully" (3 seconds)
- "Transaction updated successfully" (3 seconds)
- "Transaction deleted successfully" (3 seconds)

**Fixed:** 2025-10-28

---

## Backend Validation Errors

### Error: `400 Bad Request - ZodError: Invalid input on installments field`

**Description:** When updating a transaction that has no installments (empty installments field), the backend returns a 400 Bad Request error with a Zod validation error.

**Error Message:**
```
ZodError: [
  {
    "code": "custom",
    "path": ["installments"],
    "message": "Invalid input"
  }
]
```

**Root Cause:**
- Frontend sends an empty string `""` when a transaction has no installments
- Zod validation schema applies regex validation `/^\d+\/\d+$/` before checking for null/optional
- Empty strings fail the regex validation, triggering the error
- The validation chain was: `z.string().regex(...).nullable().optional()` which validates before checking null

**Symptoms:**
- 400 Bad Request when updating transactions without installments
- Backend logs show: `Error occurred: [{"code": "custom", "path": ["installments"], "message": "Invalid input"}]`
- Frontend error: "Failed to save transaction"
- Only affects transactions where installments field is empty (not transactions with valid installments like "1/3")

**Solution:**
Add `.preprocess()` to convert empty strings to null before validation runs:

**Before (causes validation error):**
```typescript
// createTransactionSchema and updateTransactionSchema
installments: z
  .string()
  .regex(installmentsRegex, 'Installments must be in format n1/n2')
  .refine((val) => {
    const [current, total] = val.split('/').map(Number);
    return current <= total && current > 0 && total > 0;
  }, 'Invalid installments: current must be <= total and both must be positive')
  .nullable()
  .optional(),
```

**After (working):**
```typescript
// createTransactionSchema and updateTransactionSchema
installments: z
  .preprocess(
    (val) => (val === '' ? null : val), // Convert empty string to null
    z
      .string()
      .regex(installmentsRegex, 'Installments must be in format n1/n2')
      .refine((val) => {
        const [current, total] = val.split('/').map(Number);
        return current <= total && current > 0 && total > 0;
      }, 'Invalid installments: current must be <= total and both must be positive')
      .nullable()
      .optional()
  ),
```

**Why This Works:**
- `.preprocess()` runs BEFORE validation, transforming the input value
- Empty strings are converted to `null` before hitting the regex validation
- Since the field is marked as `.nullable().optional()`, `null` values pass validation
- Preserves validation for actual installment values (e.g., "1/3", "2/12")
- Applied to both `createTransactionSchema` and `updateTransactionSchema` for consistency

**Validation Flow:**
1. **Input:** `installments: ""`
2. **Preprocess:** `"" → null`
3. **Validation:** `null` is valid (because of `.nullable().optional()`)
4. **Result:** ✅ Validation passes

**Files Changed:**
- `backend/src/modules/transactions/transaction.schema.ts:31-43` - Added preprocess to createTransactionSchema
- `backend/src/modules/transactions/transaction.schema.ts:59-71` - Added preprocess to updateTransactionSchema

**How to Prevent:**
- Use `.preprocess()` to normalize input data before validation when dealing with optional fields
- Handle empty strings explicitly when fields can be null/undefined
- Test validation schemas with edge cases (empty strings, null, undefined)
- Apply fixes to all related schemas (create and update) for consistency
- Consider using `.transform()` or `.default()` for common data transformations

**Related Zod Patterns:**
```typescript
// Pattern 1: Preprocess empty strings to null
z.preprocess((val) => (val === '' ? null : val), z.string().nullable())

// Pattern 2: Preprocess empty strings to undefined
z.preprocess((val) => (val === '' ? undefined : val), z.string().optional())

// Pattern 3: Transform and validate
z.string().transform((val) => val === '' ? null : val).nullable()
```

**Testing:**
```typescript
// Valid cases
{ installments: "1/3" }     // ✅ Valid format
{ installments: "12/12" }   // ✅ Valid format
{ installments: "" }        // ✅ Converted to null
{ installments: null }      // ✅ Already null

// Invalid cases
{ installments: "1/0" }     // ❌ Total must be > 0
{ installments: "5/3" }     // ❌ Current > total
{ installments: "abc" }     // ❌ Invalid format
{ installments: "1-3" }     // ❌ Wrong separator
```

**Related Issues:**
- Zod validation order (preprocess → validate → transform)
- Empty string vs null/undefined handling
- Frontend-backend data contract alignment

**Fixed:** 2025-10-28

---

## Frontend Display Issues

### Issue: Transaction amounts display incorrectly (shows as units instead of thousands)

**Description:** When viewing transactions in the frontend, amounts in the thousands (e.g., 7000, 25000) may display as single-digit units (e.g., 7, 25) instead of properly formatted currency values.

**Root Cause:**
- This issue has two potential causes:
  1. **Data corruption from CSV import bug:** If transactions were imported before the CSV parser fix (lines 285-402), the database contains incorrect values (divided by 1000). For example, a transaction that should be 7000 is stored as 7.
  2. **Prisma Decimal serialization:** Prisma's automatic Decimal-to-JSON serialization might not always preserve full precision, especially with older versions or specific database configurations.

**Symptoms:**
- Transaction amounts show as "$7.00" instead of "$7,000.00"
- Summary cards show incorrect totals
- Only affects amounts that were in thousands (1000+)
- Affects data imported before 2025-10-28

**Solution 1: Fix the backend serialization (Implemented)**

Added explicit Decimal-to-string conversion in the transaction service to ensure proper serialization:

```typescript
// transaction.service.ts
/**
 * Serialize a transaction object, ensuring Decimal fields are properly converted to strings
 */
private serializeTransaction(transaction: any) {
  return {
    ...transaction,
    amount: transaction.amount.toString(),
  };
}

/**
 * Serialize multiple transactions
 */
private serializeTransactions(transactions: any[]) {
  return transactions.map(t => this.serializeTransaction(t));
}
```

Applied to all service methods:
- `findAll()` - Returns serialized transaction list
- `findById()` - Returns serialized single transaction
- `create()` - Returns serialized created transaction
- `update()` - Returns serialized updated transaction
- `getMatchHistory()` - Returns serialized match transactions

**Solution 2: Fix corrupted data in database**

If you have transactions that were imported before the CSV parser fix, you need to fix the corrupted data:

**Option A: Delete and re-import**
```bash
cd backend
npx tsx scripts/delete-transactions.ts
# Then re-import your CSV/PDF files with the fixed parser
```

**Option B: Manual correction via SQL**
```sql
-- Check for suspiciously small amounts (< 100) that should be thousands
SELECT id, description, amount, date
FROM transactions
WHERE amount < 100 AND type = 'EXPENSE'
ORDER BY date DESC;

-- If you identify patterns, you can multiply specific amounts:
-- WARNING: Only do this if you're certain these are corrupted values
UPDATE transactions
SET amount = amount * 1000
WHERE amount < 100
  AND type = 'EXPENSE'
  AND source = 'csv'
  AND date >= '2025-01-01'::date;
```

**How to Verify the Fix:**
1. Check backend API response in browser DevTools Network tab
2. Look for transaction objects with `amount` as a string (e.g., `"amount": "7000.00"`)
3. Verify frontend displays amounts correctly with thousands separators
4. Check Argentina format: "$7.000,00" (dot for thousands, comma for decimals)

**Frontend Display Format:**
The frontend uses `Intl.NumberFormat('es-AR')` which formats numbers according to Argentina locale:
- Thousands separator: `.` (dot)
- Decimal separator: `,` (comma)
- Example: 7000 → "$7.000,00"

**Files Changed:**
- `backend/src/modules/transactions/transaction.service.ts:8-23, 125, 170, 243, 329, 436` - Added explicit Decimal serialization

**How to Prevent:**
- Always use the latest CSV parser (fixed 2025-10-28)
- Test imports with sample data before bulk imports
- Validate amount ranges after import (check for suspiciously small values)
- Review transaction summaries to catch data issues early
- Consider adding backend validation to warn about unusual amount patterns

**Related Issues:**
- CSV import amount parsing (lines 285-402)
- Prisma Decimal serialization
- Intl.NumberFormat locale formatting

**Resolution (2025-10-29):**
After investigation, the root cause was determined to be a **responsive design issue**, not a data corruption issue:
- ✅ Database values are correct (verified)
- ✅ API serialization is correct (verified)
- ✅ Frontend formatting is correct (verified)
- ❌ The issue was that narrow browser windows or mobile views cut off the amount text

The amount `$ 10.000,00` was being rendered correctly in the HTML, but narrow columns with `whitespace-nowrap` were cutting off the display to show only `$ 1`.

**Actual Fix:**
1. **Backend:** Added explicit Decimal serialization with `.toFixed(2)` for consistent formatting
2. **Frontend:** Added minimum width (`min-w-[130px]`) to Amount column to prevent text truncation
3. **Table:** Already has horizontal scroll (`overflow-x-auto`) for mobile devices

**Files Changed:**
- `frontend/src/pages/Transactions.tsx:376,407` - Added `min-w-[130px]` to Amount column header and cell

**Fixed:** 2025-10-29

---

## Prisma Client Generation Issues

### Error: `EPERM: operation not permitted` when running `npx prisma generate`

**Description:** When trying to generate the Prisma client while the backend server is running, you get a file permission error on Windows.

**Error Message:**
```
EPERM: operation not permitted, rename 'D:\...\backend\node_modules\.prisma\client\query_engine-windows.dll.node.tmp...' -> 'D:\...\backend\node_modules\.prisma\client\query_engine-windows.dll.node'
```

**Root Cause:**
- The backend dev server (running with `npm run dev`) has a file lock on the Prisma query engine DLL
- Windows doesn't allow renaming/replacing DLL files while they're in use by a running process
- This happens during `npx prisma generate` which tries to update the query engine binary

**Symptoms:**
- `npx prisma generate` fails with EPERM error
- `npx prisma db push` succeeds but generation step fails
- Backend server is running in the background
- Only affects Windows (Linux/Mac handle file locks differently)

**Solution:**

**Option 1: Stop backend server first (Recommended)**
```bash
# Stop the background backend server
# In Claude Code: use KillShell tool with the backend shell ID
# Or manually: Ctrl+C in the terminal running the backend

# Then generate Prisma client
cd backend
npx prisma generate

# Restart backend server
npm run dev
```

**Option 2: Use db push instead of migrate dev**
```bash
cd backend
# This will automatically generate after pushing schema
npx prisma db push
# If generation fails due to file lock, restart backend manually
```

**Option 3: Force kill Node processes (Windows)**
```bash
# Find Node.js processes
tasklist | findstr node.exe

# Kill specific process by PID
tasklist /PID <PID> /F

# Or kill all Node processes (WARNING: kills ALL Node processes)
taskkill //F //IM node.exe
```

**How to Prevent:**
- Stop dev servers before running Prisma commands that regenerate the client
- Use `npx prisma db push` for development (handles generation automatically)
- Automate server restart after Prisma changes in your workflow
- Consider using `--skip-generate` flag if you only need to apply schema changes

**Files Affected:**
- `backend/node_modules/.prisma/client/query_engine-windows.dll.node` (locked by backend server)

**Related Issues:**
- Windows file locking behavior
- Prisma client generation process
- Dev server file watchers

**Workaround for CI/CD:**
This issue doesn't affect CI/CD pipelines since servers aren't running during builds.

---

## Express Router Errors

### Error: `TypeError: argument handler is required` when using `router.use(authenticate)`

**Description:** When creating a new Express router module with authentication middleware, you get "argument handler is required" error at the line where `router.use(authenticate)` is called.

**Error Message:**
```
TypeError: argument handler is required
    at Function.use (D:\...\backend\node_modules\router\index.js:385:11)
    at import_exchange_rate (D:\...\backend\src\modules\exchange-rates\exchange-rate.routes.ts:8:8)
```

**Root Cause:**
- The `authenticate` middleware is undefined when the routes file tries to use it
- This can happen due to:
  1. **Circular dependency:** The routes file imports controller → controller imports service → service imports prisma → prisma imports something that eventually imports routes
  2. **Controller import error:** The controller file has a syntax error or import issue that prevents it from loading, causing the routes file import chain to fail
  3. **Export mismatch:** Using `export default` vs named exports inconsistently

**Symptoms:**
- Backend server fails to start with router error
- Error points to the line with `router.use(authenticate)`
- The middleware function appears to be undefined even though the import statement looks correct
- Error mentions line numbers that don't match the actual file (due to tsx transformation)

**Solution:**

**Option 1: Check for circular dependencies**
```bash
# Look for circular imports in your module
cd backend
npx madge --circular src/modules/your-module/
```

**Option 2: Use consistent export patterns**

Make sure all route files use the same export pattern as other working modules:

```typescript
// ✅ Good - Named export (matches other modules)
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { myController } from './my.controller';

const router = Router();
router.use(authenticate);

// ... routes ...

export { router as myRouter };
```

```typescript
// ❌ Bad - Default export (inconsistent)
export default router;
```

**Option 3: Ensure controller is properly exported**

Controller file should export an instance:

```typescript
// my.controller.ts
import { prisma } from '../../config/database';
import { MyService } from './my.service';

const myService = new MyService(prisma);

export class MyController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    // ... uses myService directly (not this.myService)
  }
}

export const myController = new MyController();
```

**Option 4: Check for TypeScript/import errors in controller**

Temporarily comment out the controller import to see if the routes file loads:

```typescript
// import { myController } from './my.controller'; // Comment out temporarily

// If this makes the error go away, the issue is in the controller file
```

**How to Prevent:**
- Follow the same structure as existing working modules (e.g., transactions, payment-methods)
- Use named exports consistently across all route files
- Avoid circular dependencies between modules
- Don't instantiate PrismaClient in multiple places (use singleton from config/database)
- Test new modules incrementally (routes → controller → service → schema)

**Files to Check:**
- Route file: Check imports and exports match other modules
- Controller file: Check for syntax errors, import issues
- Service file: Ensure it doesn't create circular dependencies
- App.ts: Verify the import statement matches the export pattern

**Debugging Steps:**
1. Comment out the route registration in `app.ts`
2. Check if backend starts successfully
3. Uncomment and add console.log to debug imports:
   ```typescript
   console.log('authenticate:', typeof authenticate);
   console.log('controller:', typeof myController);
   ```
4. If console.logs don't appear, the issue is in the import chain before that line

**Related Issues:**
- Module resolution in TypeScript
- Circular dependency detection
- Express Router middleware registration

**Resolution for Exchange Rate Routes (2025-10-30):**

After extensive debugging, the issue was resolved by **deleting and recreating the routes file**. The problem was likely caused by:
- Hidden/invisible characters in the file (possibly from copy-paste operations)
- File encoding issues (BOM markers, line endings)
- Corrupted file state in tsx's watch cache

**What worked:**
```bash
cd backend/src/modules/exchange-rates
rm exchange-rate.routes.ts
# Then recreate the file with Write tool (fresh file creation)
```

After recreating the file with identical content, the server started successfully with no errors.

**Key Debugging Steps That Led to Solution:**
1. Console.log showed `authenticate` WAS defined and WAS a function
2. Error said "argument handler is required" but the handler was valid
3. Commenting out controller import still showed the same error on `router.use(authenticate)`
4. Other routes files with identical structure worked fine
5. Deleting and recreating the file resolved the issue immediately

**Lesson Learned:**
- When TypeScript/tsx shows confusing errors where the code looks correct, try deleting and recreating the file
- Hidden characters or encoding issues don't show up in code reviews but break module loading
- tsx's watch mode might cache corrupted file states

---

---

### Error: Visa Galicia PDF parser reading wrong amounts ($724,833 instead of $24,833)

**Description:** When importing Visa Galicia PDF statements, transaction amounts were being parsed incorrectly, showing values 10-30x higher than the actual amounts. For example, the NIKEARGENTINA transaction showed as $724,833.00 when it should have been $24,833.00.

**Transaction Example:**
```
Line from PDF: 18-03-25*MERPAGO*NIKEARGENTINA 01/0606198724.833,00
Expected: Amount = $24,833.00, Installments = "01/06", Comprobante = "061987"
Actual (before fix): Amount = $724,833.00
```

**Root Cause:**
The Visa Galicia PDF was being incorrectly detected as "Amex Galicia" format, causing it to be processed by the wrong parser:

1. **Incorrect format detection:** Both Visa Galicia and Amex Galicia PDFs contain the text "DETALLE DEL CONSUMO"
2. **Overly broad Amex detection:**
   ```javascript
   // Before (incorrect)
   const isAmexGalicia = text.includes('DETALLE DEL CONSUMO') || text.includes('AMERICAN EXPRESS');
   ```
   This caused ALL PDFs with "DETALLE DEL CONSUMO" to be routed to the Amex parser, including Visa PDFs.

3. **Wrong parser used:** The Amex parser doesn't have the specialized logic for Visa's concatenated transaction format with installment borrowing
4. **Amount parsing failure:** Without the proper concatenated format parser, the amount regex was matching incorrectly, capturing extra digits from the comprobante field

**Debug Process:**
1. Added logging to see which parser was being used:
   ```
   [PARSE GALICIA] Is Amex format? true  ← Should have been false!
   ```

2. Extracted actual line from PDF using `test-pdf-extract.js`:
   ```
   Raw line: "18-03-25*MERPAGO*NIKEARGENTINA 01/0606198724.833,00"
   Format: Concatenated (no spaces between fields)
   ```

3. Discovered the line was concatenated format requiring special parsing:
   - Description: "MERPAGO*NIKEARGENTINA"
   - Partial installment: "01/0" (needs to borrow "6" to complete "01/06")
   - Merged digits: "06061987" (installment completion digit + comprobante)
   - Amount: "24.833,00"

**Solution:**
Made Amex detection more specific by requiring BOTH "DETALLE DEL CONSUMO" AND Amex-specific markers:

```javascript
// After (correct)
const hasAmexMarkers = text.includes('AMERICAN EXPRESS') || text.includes('30-64140793-9');
const isAmexGalicia = text.includes('DETALLE DEL CONSUMO') && hasAmexMarkers;
```

**Amex-specific markers:**
- `"AMERICAN EXPRESS"` - Brand name appearing in Amex PDFs
- `"30-64140793-9"` - Amex Argentina's CUIT number

**How the Visa Parser Works:**
The Visa Galicia concatenated format parser (which was already correctly implemented but wasn't being used):

1. **Combined digits+amount pattern:** Matches 6-8 digits + amount together to prevent greedy regex from capturing wrong digits
   ```javascript
   const tentativeMatch78 = afterDateMarker.match(/(\d{7,8})(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/);
   ```

2. **Installment borrowing logic:** Detects partial installments (e.g., "01/0") and borrows missing digits from the comprobante
   ```
   Input: "01/0606198724.833,00"
   Partial: "01/0" (needs 1 digit)
   Borrows: "6" from "06061987"
   Result: Installments = "01/06", Comprobante = "061987"
   ```

3. **Amount extraction:** After borrowing, correctly identifies the amount
   ```
   Digits: "06061987" → Borrow "6", Keep "061987"
   Amount: "24.833,00" → 24,833.00
   ```

**Symptoms:**
- Amounts displayed 10-30x higher than expected
- Example: $24,833 shown as $724,833
- Only affected Visa Galicia PDF imports
- Amex Galicia and Santander PDFs worked correctly
- Standalone tests passed but real imports failed

**Verification:**
After the fix, the same PDF import now shows:
```
[PARSE GALICIA] Is Amex format? false (hasAmexMarkers: false)
Amount: $24,833.00 ✓
Installments: "01/06" ✓
Comprobante: "061987" ✓
```

**Files Changed:**
- `backend/src/modules/import/pdf-parser.service.ts:426-431` - Made Amex detection require both "DETALLE DEL CONSUMO" AND Amex-specific markers

**Test Cases:**
The existing Visa Galicia concatenated parser already correctly handled:
```javascript
// Test 1: NIKEARGENTINA - Partial installment borrowing
'18-03-25*MERPAGO*NIKEARGENTINA 01/0606198724.833,00'
→ Amount: 24,833 ✓

// Test 2: EMOVA SUBTE - No installments
'19-03-25*EMOVA SUBTE 004243832,00'
→ Amount: 832 ✓

// Test 3: UBER - Complete installments
'05-03-25*UBER *HELP.UBER.COM 02/1212304015.899,00'
→ Amount: 15,899 ✓

// Test 4: FRAVEGA - Partial installment borrowing
'06-09-25*FRAVEGA 01/06630489133.333,35'
→ Amount: 133,333.35 ✓
```

**How to Prevent:**
- Use specific, mutually exclusive format detection markers
- Test format detection with actual PDF samples from each bank
- Add debug logging to show which parser is being selected
- Verify parser selection before implementing parsing logic
- Document shared text patterns between different bank formats

**Related Issues:**
- PDF format detection logic
- Regex greedy matching in amount parsing
- Multi-bank PDF parser architecture

**Key Lesson:**
When multiple PDF formats share common text patterns, detection logic must use format-specific markers to avoid routing to the wrong parser. A single shared string like "DETALLE DEL CONSUMO" is not sufficient for reliable format detection.

**Fixed:** 2025-10-30

---

**Last Updated:** 2025-10-30
