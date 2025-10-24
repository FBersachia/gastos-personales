# Task List - Personal Finance Manager MVP

## ✅ Completed Tasks

### Initial Setup
- [x] Project structure created (backend + frontend)
- [x] Database schema designed and implemented (Prisma)
- [x] Backend core setup (Express + TypeScript)
- [x] Frontend core setup (React + TypeScript + Vite)
- [x] Authentication system (register, login, logout)
- [x] JWT token management
- [x] Database seeding with demo data
- [x] Development environment running locally

### Sprint 1: Core Entities (Completed 2025-10-24)
- [x] Backend: Payment methods CRUD endpoints
  - [x] GET /api/v1/payment-methods (list all)
  - [x] POST /api/v1/payment-methods (create)
  - [x] PUT /api/v1/payment-methods/:id (update)
  - [x] DELETE /api/v1/payment-methods/:id (delete with validation)
- [x] Frontend: Payment methods management page
  - [x] List payment methods
  - [x] Create payment method form
  - [x] Edit payment method
  - [x] Delete with confirmation
  - [x] Validation (duplicate names)
- [x] Backend: Categories CRUD endpoints
  - [x] GET /api/v1/categories (list with macro category)
  - [x] POST /api/v1/categories (create)
  - [x] PUT /api/v1/categories/:id (update)
  - [x] DELETE /api/v1/categories/:id (delete with validation)
- [x] Backend: Macro categories CRUD endpoints
  - [x] GET /api/v1/macro-categories (list all)
  - [x] POST /api/v1/macro-categories (create)
  - [x] PUT /api/v1/macro-categories/:id (update)
  - [x] DELETE /api/v1/macro-categories/:id (delete)
- [x] Frontend: Categories management page
  - [x] List categories with macro category
  - [x] Create category form with macro category dropdown
  - [x] Create macro category (modal/inline)
  - [x] Edit category
  - [x] Delete with confirmation
  - [x] Filter by macro category

---

## 🚧 In Progress

Currently no tasks in progress.

---

## 📋 Completed Tasks - Sprint 2: Transactions (2025-10-24)

### Transactions Module - Backend
- [x] GET /api/v1/transactions (list with pagination and filters)
  - [x] Pagination support (page, limit)
  - [x] Filter by date range
  - [x] Filter by category IDs
  - [x] Filter by payment method IDs
  - [x] Filter by type (INCOME/EXPENSE)
  - [x] Include related data (category, payment method, series)
  - [x] Calculate totals (income, expense, balance)
- [x] GET /api/v1/transactions/:id (get single transaction)
- [x] POST /api/v1/transactions (create transaction)
  - [x] Validate date (not future beyond today)
  - [x] Validate amount > 0
  - [x] Validate installments format (n1/n2)
  - [x] Validate category exists
  - [x] Validate payment method exists
- [x] PUT /api/v1/transactions/:id (update transaction)
- [x] DELETE /api/v1/transactions/:id (delete transaction)

### Transactions Module - Frontend
- [x] Transactions list page
  - [x] Display transactions table with pagination
  - [x] Show: date, type, description, category, payment method, amount, installments
  - [x] Implement pagination controls
  - [x] Show total income, expense, and balance
- [x] Transaction filters
  - [x] Date range filter (from/to date pickers)
  - [x] Type filter (Income/Expense/All)
  - [x] Show/hide filters toggle
  - [x] Clear filters button
- [x] Create transaction form
  - [x] Type dropdown (Income/Expense)
  - [x] Date picker (default: today)
  - [x] Description input
  - [x] Amount input (positive numbers only)
  - [x] Category dropdown
  - [x] Payment method dropdown
  - [x] Installments input (optional, format: n1/n2)
  - [x] Form validation with error messages
- [x] Edit transaction
  - [x] Pre-populate form with existing data
  - [x] Update transaction
- [x] Delete transaction
  - [x] Confirmation modal
  - [x] Delete action

---

## 📋 Pending Tasks - Sprint 3: Recurring Series

### Recurring Series Module - Backend
- [ ] GET /api/v1/recurring-series (list all series)
  - [ ] Include transaction count
  - [ ] Include last transaction info
  - [ ] Calculate averages
- [ ] POST /api/v1/recurring-series (create series)
- [ ] GET /api/v1/recurring-series/:id/transactions (get series transactions)
- [ ] PUT /api/v1/recurring-series/:id (update series)
- [ ] DELETE /api/v1/recurring-series/:id (delete series)

### Recurring Series Module - Frontend
- [ ] Recurring series list page
  - [ ] Display all series with stats
  - [ ] Show: name, frequency, count, last payment, average
- [ ] Create recurring series
  - [ ] Name input
  - [ ] Frequency dropdown (Monthly/Annual)
- [ ] Link transaction to series
  - [ ] Dropdown in transaction form
  - [ ] Show existing series
- [ ] View series details
  - [ ] Show all transactions in series
  - [ ] Display statistics (total, average, count)
  - [ ] Timeline visualization

---

## 📋 Pending Tasks - Sprint 4: Installments

### Installments Module - Backend
- [ ] GET /api/v1/installments/pending
  - [ ] Parse installments field (n1/n2)
  - [ ] Calculate pending installments (n2 - n1)
  - [ ] Calculate amount per installment
  - [ ] Calculate total pending
  - [ ] Estimate end date
  - [ ] Sort options (pending count, amount, date)

### Installments Module - Frontend
- [ ] Pending installments page
  - [ ] Display installments table
  - [ ] Show: description, payment method, current/total, pending, amount per installment, total pending
  - [ ] Sort controls
  - [ ] Total pending summary
  - [ ] Color coding for near completion

---

## 📋 Pending Tasks - Sprint 5: CSV Import

### CSV Import - Backend
- [ ] POST /api/v1/import/csv (upload and preview)
  - [ ] Multer file upload middleware
  - [ ] CSV parser service (PapaParse)
  - [ ] Validate CSV format and columns
  - [ ] Detect payment methods from memorandum
  - [ ] Detect installments from memorandum
  - [ ] Apply filters (date range, payment methods)
  - [ ] Return preview data
- [ ] POST /api/v1/import/csv/confirm (execute import)
  - [ ] Create missing categories option
  - [ ] Bulk insert transactions
  - [ ] Return import summary (success, failed, warnings)
- [ ] CSV Parser Service
  - [ ] Parse CSV with correct encoding (UTF-8 BOM)
  - [ ] Validate required columns
  - [ ] Payment method detection patterns
  - [ ] Installments detection regex
  - [ ] Category auto-creation

### CSV Import - Frontend
- [ ] CSV import page
  - [ ] File upload area (drag & drop)
  - [ ] File validation
  - [ ] Preview all parsed records
  - [ ] Filter controls (date range, payment methods)
  - [ ] Show filtered count vs total
  - [ ] Preview table
  - [ ] Import confirmation
  - [ ] Import summary display
  - [ ] Error handling and warnings

---

## 📋 Pending Tasks - Sprint 6: PDF Import

### PDF Import - Backend
- [ ] POST /api/v1/import/pdf (upload and preview)
  - [ ] Multer file upload middleware
  - [ ] PDF parser service (pdf-parse)
  - [ ] Bank detection logic
  - [ ] PDF parsers per bank (Santander, Galicia, Amex)
  - [ ] Extract transactions from PDF text
  - [ ] Detect installments in descriptions
  - [ ] Return preview data
- [ ] POST /api/v1/import/pdf/confirm (execute import)
  - [ ] Category mapping
  - [ ] Associate payment method
  - [ ] Bulk insert transactions
  - [ ] Return import summary
- [ ] PDF Parser Service
  - [ ] Bank detection patterns
  - [ ] Santander PDF parser
  - [ ] Date extraction and parsing
  - [ ] Amount parsing
  - [ ] Installments detection

### PDF Import - Frontend
- [ ] PDF import page
  - [ ] File upload area
  - [ ] Bank detection display
  - [ ] Preview extracted transactions
  - [ ] Payment method selection
  - [ ] Category mapping interface
  - [ ] Edit transactions before import
  - [ ] Import confirmation
  - [ ] Import summary display

---

## 📋 Pending Tasks - Sprint 7: Dashboard & Analytics

### Dashboard - Backend
- [ ] GET /api/v1/dashboard/summary
  - [ ] Total income (current month)
  - [ ] Total expenses (current month)
  - [ ] Balance
  - [ ] Top categories by spending
  - [ ] Recent transactions
  - [ ] Pending installments summary

### Dashboard - Frontend
- [ ] Enhance dashboard page
  - [ ] Summary cards (income, expenses, balance)
  - [ ] Top spending categories
  - [ ] Recent transactions list
  - [ ] Quick actions (add transaction, import)
  - [ ] Pending installments widget
  - [ ] Monthly comparison

---

## 📋 Pending Tasks - Sprint 8: UI/UX Improvements

### General UI Enhancements
- [ ] Add loading states to all pages
- [ ] Add error boundaries
- [ ] Implement toast notifications
- [ ] Add confirmation modals for destructive actions
- [ ] Improve form validation feedback
- [ ] Add empty states for lists
- [ ] Implement skeleton loaders
- [ ] Add search functionality to lists
- [ ] Improve mobile navigation
- [ ] Add keyboard shortcuts

### Navigation
- [ ] Create sidebar navigation
- [ ] Add breadcrumbs
- [ ] Highlight active route
- [ ] Mobile hamburger menu
- [ ] Quick add transaction button (floating)

---

## 📋 Future Enhancements (Post-MVP)

### Phase 2
- [ ] Statistics and charts (Chart.js or Recharts)
- [ ] Monthly budgets by category
- [ ] Export data (CSV, PDF, Excel)
- [ ] Alerts and notifications
- [ ] Advanced card management (limits, due dates)
- [ ] Multi-currency support
- [ ] Full-text search in transactions
- [ ] Tags for transactions
- [ ] Notes/comments on transactions
- [ ] Recurring transaction auto-generation

### Phase 3
- [ ] Mobile apps (React Native)
- [ ] Automatic bank integrations
- [ ] OCR for receipts
- [ ] ML for auto-categorization
- [ ] Shared expenses with other users
- [ ] Custom reports
- [ ] Public API
- [ ] Webhooks
- [ ] Email notifications
- [ ] Dark mode

---

## 🐛 Known Issues / Tech Debt

- [ ] Update Prisma to v6 (currently v5.22)
- [ ] Address npm audit vulnerabilities
- [ ] Update ESLint to v9
- [ ] Add comprehensive error logging
- [ ] Add API rate limiting per user
- [ ] Implement token refresh mechanism
- [ ] Add database indexes optimization
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Add unit tests coverage (>80%)
- [ ] Add integration tests for all endpoints
- [ ] Set up CI/CD pipeline
- [ ] Add database backup strategy
- [ ] Add monitoring and alerting
- [ ] Performance optimization (lazy loading, code splitting)

---

## 📝 Notes

- All tasks are based on `especificacion_funcional.md` and `especificacion_tecnica.md`
- Sprints are organized by feature modules
- Each task should be moved to "In Progress" when started
- Mark as completed with date when finished
- Add new tasks as they are discovered
- Review and update this file weekly

---

**Last Updated:** 2025-10-24

## Recent Changes
- **2025-10-24**: ✅ Sprint 2 completed - Transactions module fully implemented with pagination, filters, and summary
- **2025-10-24**: ✅ Sprint 1 completed - Payment Methods and Categories modules fully implemented (backend + frontend)
