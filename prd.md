## This file contains context for this product development

## Relevant Files
- `especificacion_funcional.md` - Detailed functional specification with use cases
- `especificacion_tecnica.md` - Technical specification with architecture and API docs
- `tasklist.md` - **Task list and project roadmap** (sprint-based organization)
- `README.md` - Project overview and setup instructions
- `SETUP.md` - Step-by-step setup guide
- `errors.md` - Common errors and troubleshooting

## Current Status (2025-10-27)
✅ **Phase 0: Foundation - COMPLETED**
- Backend infrastructure (Express + TypeScript + Prisma)
- Frontend infrastructure (React + TypeScript + Vite + TailwindCSS)
- Authentication system (JWT)
- Database schema and migrations
- Local development environment running
- **Dependencies Updated:** Prisma 6.18.0, React 18.3.1, Vite 5.4.21, Latest stable versions

✅ **Sprint 1: Core Entities - COMPLETED & TESTED (2025-10-24)**
- Payment Methods CRUD (Backend + Frontend)
- Categories & Macro Categories CRUD (Backend + Frontend)
- Full CRUD operations with validation
- Navigation integrated in header
- **Backend API Testing:** 19/19 tests passed ✅
- **Manual UI Testing Guide:** Created ✅

✅ **Sprint 2: Transactions - COMPLETED (2025-10-24)**
- Transactions CRUD endpoints (Backend + Frontend)
- Pagination support (default 25, max 100 per page)
- Advanced filtering (date range, category, payment method, type)
- Transaction summary (income, expense, balance)
- Full-featured form with validation
- Installments support (format n1/n2)
- Navigation integrated

✅ **Sprint 3: Recurring Series - COMPLETED (2025-10-24)**
- Recurring series CRUD (Backend + Frontend)
- Link transactions to series (dropdown in transaction form)
- Series statistics (count, average, total, last payment)
- Transaction timeline view (all transactions in series)
- Full CRUD operations with validation
- Navigation integrated

✅ **Sprint 4: Installments - COMPLETED (2025-10-24)**
- Pending installments endpoint (Backend)
- Parse installments format (n1/n2) and calculate pending amounts
- Installments tracking page (Frontend)
- Sort by pending count, amount, or date
- Progress bars and completion percentage
- Color-coded rows based on completion (green: 80%+, yellow: 50-79%)
- Total pending amount summary
- Estimated end date calculation
- Navigation integrated

✅ **Sprint 5: CSV Import - COMPLETED & ENHANCED (2025-10-25)**
- CSV file upload with drag & drop (Frontend)
- CSV parser service with PapaParse (Backend)
- **Smart matching system:**
  - Payment method auto-detection + 5-level fuzzy matching
  - Category auto-detection + 5-level fuzzy matching
  - Income auto-detection (keywords: sueldo, salario, ingreso, etc.)
  - Hardcoded ID mappings for 6 payment methods
- **Batch operations for performance:**
  - Optimized from 2,500+ queries → 3 queries for 619 transactions
  - Import time: ~2 seconds (was timing out before)
- Installments detection (n1/n2 format)
- Date range + payment method filtering
- Preview table with visual indicators (✓ matched, ⚠ unmatched)
- Import confirmation and summary
- Error handling and detailed logging
- Navigation link integrated

✅ **Sprint 6: PDF Import - COMPLETED (2025-10-25)**
- PDF file upload with drag & drop (Frontend)
- PDF parser service with pdf-parse (Backend)
- **Bank detection:** Santander, Galicia, Amex
- **PDF parsers per bank:**
  - Santander: Date/description/amount extraction
  - Galicia: Date/description/amount extraction
  - Amex: Date/description/amount extraction with DD/MM format support
- Transaction extraction from PDF statements
- Installments detection from descriptions
- Payment method selection (applies to all transactions)
- Category mapping interface with auto-suggestions
- Preview table with editable categories
- Import confirmation and summary
- Navigation link integrated

✅ **Sprint 7: Dashboard & Analytics - COMPLETED (2025-10-25)**
- Dashboard summary endpoint with current & previous month data (Backend)
- Summary cards: income, expenses, balance with % changes (Frontend)
- Top spending categories widget with progress bars (Frontend)
- Recent transactions widget (Frontend)
- Pending installments summary widget (Frontend)
- Quick action buttons: New Transaction, Import CSV, Import PDF (Frontend)
- Monthly comparison (percentage changes vs previous month)

✅ **Sprint 8: UI/UX Improvements - COMPLETED (2025-10-26)**
- **Loading states:** Skeleton loaders for all pages (Dashboard, Transactions, etc.)
- **Loading spinners:** Button spinners for auth, CSV/PDF import actions
- **Error boundaries:** Global error boundary component with fallback UI
- **Toast notifications:** Custom toast system with success/error/warning/info types
- **Confirmation modals:** Reusable ConfirmDialog component for destructive actions
- **Empty states:** EmptyState component for lists (already implemented in pages)
- **Form validation:** Field-level validation in auth pages (react-hook-form + zod)

🚧 **Next Phase: Sprint 9 - Additional Features**
- Search functionality, mobile navigation, keyboard shortcuts
- See `tasklist.md` for detailed task breakdown

## RULES
- Don't ever say "production-ready" unless you checked it first with me.
- Update `tasklist.md` everytime you complete a task.
- Keep this file updated with current project status.
- When I say "update everything", update these files and push to GitHub remote repository.
- This file should not exceed 100 lines.
- All detailed tasks are tracked in `tasklist.md`
- Add recurring errors to `errors.md` and how to fix them
- Major milestones are documented here.