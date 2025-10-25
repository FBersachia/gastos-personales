## This file contains context for this product development

## Relevant Files
- `especificacion_funcional.md` - Detailed functional specification with use cases
- `especificacion_tecnica.md` - Technical specification with architecture and API docs
- `tasklist.md` - **Task list and project roadmap** (sprint-based organization)
- `README.md` - Project overview and setup instructions
- `SETUP.md` - Step-by-step setup guide
- `errors.md` - Common errors and troubleshooting

## Current Status (2025-10-25)
✅ **Phase 0: Foundation - COMPLETED**
- Backend infrastructure (Express + TypeScript + Prisma)
- Frontend infrastructure (React + TypeScript + Vite + TailwindCSS)
- Authentication system (JWT)
- Database schema and migrations
- Local development environment running

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

🚧 **Next Phase: Sprint 6 - PDF Import**
- PDF file upload and parsing
- Bank detection (Santander, Galicia, Amex)
- Transaction extraction from PDFs
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