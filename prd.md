## This file contains context for this product development

## Relevant Files
- `especificacion_funcional.md` - Detailed functional specification with use cases
- `especificacion_tecnica.md` - Technical specification with architecture and API docs
- `tasklist.md` - **Task list and project roadmap** (sprint-based organization)
- `README.md` - Project overview and setup instructions
- `SETUP.md` - Step-by-step setup guide
- `errors.md` - Common errors and troubleshooting

## Current Status (2025-10-24)
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

🚧 **Next Phase: Sprint 3 - Recurring Series**
- Recurring series CRUD
- Link transactions to series
- Series statistics and timeline
- See `tasklist.md` for detailed task breakdown

## RULES
- Keep this file updated with current project status.
- When I say "update everything", update these files and push to GitHub remote repository.
- This file should not exceed 100 lines.
- All detailed tasks are tracked in `tasklist.md`
- Add recurring errors to `errors.md` and how to fix them
- Major milestones are documented here.