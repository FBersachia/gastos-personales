# Testing Checklist - Sprint 1: Core Entities

## Overview
This document contains comprehensive testing tasks for Sprint 1 features (Payment Methods, Categories, and Macro Categories).

**Last Updated:** 2025-10-24

---

## 🧪 Backend API Testing

### Payment Methods Endpoints

#### GET /api/v1/payment-methods
- [ ] Returns empty array when no payment methods exist
- [ ] Returns all payment methods for authenticated user
- [ ] Does not return payment methods from other users
- [ ] Requires authentication (401 without token)
- [ ] Returns methods sorted by name (ascending)
- [ ] Returns correct response format with success field

#### POST /api/v1/payment-methods
- [ ] Creates payment method successfully with valid data
- [ ] Returns 201 status code on success
- [ ] Returns created payment method with id and timestamps
- [ ] Validates required field: name is required
- [ ] Trims whitespace from name
- [ ] Rejects empty name
- [ ] Prevents duplicate names for same user (409 conflict)
- [ ] Allows same name for different users
- [ ] Requires authentication (401 without token)
- [ ] Validates name length (max 100 characters)

#### PUT /api/v1/payment-methods/:id
- [ ] Updates payment method successfully
- [ ] Returns updated payment method
- [ ] Validates new name is required
- [ ] Prevents duplicate names (409 conflict)
- [ ] Returns 404 when payment method not found
- [ ] Prevents updating other users' payment methods
- [ ] Updates timestamp (updatedAt)
- [ ] Requires authentication

#### DELETE /api/v1/payment-methods/:id
- [ ] Deletes payment method successfully
- [ ] Returns success message
- [ ] Returns 404 when not found
- [ ] Prevents deleting other users' payment methods
- [ ] Returns 409 when payment method has associated transactions
- [ ] Requires authentication

---

### Categories Endpoints

#### GET /api/v1/categories
- [ ] Returns empty array when no categories exist
- [ ] Returns all categories for authenticated user
- [ ] Includes macro category information when linked
- [ ] Shows null for macro category when not linked
- [ ] Includes transaction count for each category
- [ ] Does not return categories from other users
- [ ] Requires authentication
- [ ] Returns categories sorted by name

#### POST /api/v1/categories
- [ ] Creates category successfully with valid data
- [ ] Creates category without macro category (macroId null)
- [ ] Creates category with macro category link
- [ ] Returns 201 status code
- [ ] Validates name is required
- [ ] Prevents duplicate names for same user
- [ ] Allows same name for different users
- [ ] Returns 404 when macroId doesn't exist
- [ ] Prevents linking to other users' macro categories
- [ ] Validates macroId is valid UUID format
- [ ] Requires authentication

#### PUT /api/v1/categories/:id
- [ ] Updates category name successfully
- [ ] Updates macro category link
- [ ] Can set macroId to null (unlink)
- [ ] Prevents duplicate names
- [ ] Returns 404 when category not found
- [ ] Returns 404 when macroId doesn't exist
- [ ] Prevents updating other users' categories
- [ ] Requires authentication

#### DELETE /api/v1/categories/:id
- [ ] Deletes category successfully
- [ ] Returns 404 when not found
- [ ] Returns 409 when category has transactions (Restrict constraint)
- [ ] Prevents deleting other users' categories
- [ ] Requires authentication

---

### Macro Categories Endpoints

#### GET /api/v1/macro-categories
- [ ] Returns empty array when none exist
- [ ] Returns all macro categories for user
- [ ] Includes category count for each macro
- [ ] Does not return other users' macro categories
- [ ] Returns sorted by name
- [ ] Requires authentication

#### POST /api/v1/macro-categories
- [ ] Creates macro category successfully
- [ ] Returns 201 status code
- [ ] Validates name is required
- [ ] Prevents duplicate names for same user
- [ ] Allows same name for different users
- [ ] Trims whitespace
- [ ] Validates max length
- [ ] Requires authentication

#### PUT /api/v1/macro-categories/:id
- [ ] Updates macro category name
- [ ] Prevents duplicate names
- [ ] Returns 404 when not found
- [ ] Prevents updating other users' macros
- [ ] Updates timestamp
- [ ] Requires authentication

#### DELETE /api/v1/macro-categories/:id
- [ ] Deletes macro category successfully
- [ ] Sets linked categories' macroId to null (SetNull cascade)
- [ ] Returns 404 when not found
- [ ] Prevents deleting other users' macros
- [ ] Requires authentication

---

## 🎨 Frontend UI Testing

### Payment Methods Page (/payment-methods)

#### Page Load
- [ ] Displays loading state while fetching
- [ ] Shows empty state when no payment methods exist
- [ ] Displays "Add Your First Payment Method" button in empty state
- [ ] Shows table with payment methods when data exists
- [ ] Displays error message if API call fails
- [ ] Redirects to login if not authenticated

#### List View
- [ ] Displays payment method name
- [ ] Displays creation date formatted correctly
- [ ] Shows "Add Payment Method" button
- [ ] Each row has Edit and Delete buttons
- [ ] Table is responsive on mobile
- [ ] Hover state on table rows works

#### Create Payment Method
- [ ] Opens modal when clicking "Add Payment Method"
- [ ] Modal shows correct title "New Payment Method"
- [ ] Name input is focused on modal open
- [ ] Submit button says "Create"
- [ ] Cancel button closes modal without saving
- [ ] Shows error if name is empty
- [ ] Shows API error message (e.g., duplicate name)
- [ ] Closes modal on successful creation
- [ ] Refreshes list after creation
- [ ] Trims whitespace from input

#### Edit Payment Method
- [ ] Opens modal when clicking "Edit"
- [ ] Modal shows correct title "Edit Payment Method"
- [ ] Pre-fills name field with current value
- [ ] Submit button says "Update"
- [ ] Updates list after successful edit
- [ ] Shows validation errors
- [ ] Closes modal on success

#### Delete Payment Method
- [ ] Opens confirmation modal on delete click
- [ ] Confirmation modal has red warning styling
- [ ] Shows appropriate warning message
- [ ] Cancel button closes without deleting
- [ ] Delete button performs deletion
- [ ] Shows error if deletion fails (e.g., has transactions)
- [ ] Refreshes list after deletion
- [ ] Closes confirmation modal after action

---

### Categories Page (/categories)

#### Page Load
- [ ] Displays loading state
- [ ] Shows empty state when no categories
- [ ] Loads both categories and macro categories
- [ ] Shows error message on failure
- [ ] Redirects to login if not authenticated

#### Macro Categories Section
- [ ] Displays all macro categories as chips/badges
- [ ] Shows category count for each macro
- [ ] Each chip has Edit and Delete buttons
- [ ] Shows "No macro categories yet" when empty
- [ ] "Add Macro Category" button visible

#### Filter Functionality
- [ ] Dropdown shows "All Categories" option
- [ ] Dropdown lists all macro categories
- [ ] Filtering by macro works correctly
- [ ] Shows correct category count when filtered
- [ ] Filter persists while doing CRUD operations

#### Categories Table
- [ ] Displays category name
- [ ] Shows macro category as badge/chip
- [ ] Shows "-" when no macro category
- [ ] Displays transaction count
- [ ] Each row has Edit and Delete buttons
- [ ] Empty state shows when filtered with no results

#### Create Category
- [ ] Opens modal on "Add Category" click
- [ ] Name input is required
- [ ] Macro category dropdown shows all macros
- [ ] "None" option available in dropdown
- [ ] Can create without selecting macro
- [ ] Can create with macro selected
- [ ] Shows validation errors
- [ ] Refreshes list after creation

#### Edit Category
- [ ] Pre-fills name
- [ ] Pre-selects current macro category
- [ ] Can change name
- [ ] Can change macro category
- [ ] Can remove macro category (set to None)
- [ ] Updates list after save

#### Create Macro Category
- [ ] Opens modal on "Add Macro Category" click
- [ ] Green button styling
- [ ] Name input is required
- [ ] Shows validation errors
- [ ] Refreshes both lists after creation

#### Edit Macro Category
- [ ] Pre-fills name
- [ ] Updates name successfully
- [ ] Shows in categories dropdown after update
- [ ] Prevents duplicate names

#### Delete Category
- [ ] Shows confirmation modal
- [ ] Warning about transactions
- [ ] Error shown if has transactions
- [ ] Successful deletion refreshes list

#### Delete Macro Category
- [ ] Shows confirmation modal
- [ ] Special warning about unlinking categories
- [ ] Deletes successfully
- [ ] Linked categories remain but macroCategory becomes null

---

## 🔐 Authentication & Authorization Testing

### Authentication
- [ ] All endpoints require valid JWT token
- [ ] Returns 401 when no token provided
- [ ] Returns 401 when token is invalid
- [ ] Returns 401 when token is expired
- [ ] Frontend redirects to login on 401
- [ ] Token is included in all API requests
- [ ] Logout clears token from localStorage

### Authorization (User Isolation)
- [ ] User can only see their own payment methods
- [ ] User can only see their own categories
- [ ] User can only see their own macro categories
- [ ] User cannot update other users' data
- [ ] User cannot delete other users' data
- [ ] User cannot link categories to other users' macros

---

## 🗄️ Database Constraints Testing

### Unique Constraints
- [ ] Payment method name is unique per user (userId + name)
- [ ] Category name is unique per user
- [ ] Macro category name is unique per user
- [ ] Same names allowed across different users

### Foreign Key Constraints
- [ ] Cannot create category with non-existent macroId
- [ ] Cannot delete payment method with transactions (Restrict)
- [ ] Cannot delete category with transactions (Restrict)
- [ ] Deleting macro category sets categories' macroId to null (SetNull)
- [ ] Deleting user cascades to all their entities

### Data Integrity
- [ ] createdAt is set automatically
- [ ] updatedAt is updated on modifications
- [ ] IDs are UUIDs
- [ ] Timestamps are in ISO format

---

## 🔄 Integration Testing

### User Flow: Setting Up Payment Methods
1. [ ] User logs in
2. [ ] Navigates to Payment Methods page
3. [ ] Sees empty state
4. [ ] Creates first payment method
5. [ ] Creates second payment method
6. [ ] Edits a payment method
7. [ ] Tries to create duplicate (should fail)
8. [ ] Deletes a payment method
9. [ ] Logs out and back in
10. [ ] Sees saved payment methods

### User Flow: Setting Up Categories
1. [ ] User navigates to Categories page
2. [ ] Creates macro category "Food"
3. [ ] Creates macro category "Transport"
4. [ ] Creates category "Groceries" linked to "Food"
5. [ ] Creates category "Restaurants" linked to "Food"
6. [ ] Creates category "Uber" linked to "Transport"
7. [ ] Filters by "Food" macro - sees 2 categories
8. [ ] Edits "Groceries" to remove macro link
9. [ ] Filters by "Food" - sees only 1 category
10. [ ] Deletes "Transport" macro
11. [ ] "Uber" category still exists but macroCategory is null

### Cross-Module Testing
- [ ] Create payment methods first
- [ ] Create categories and macros
- [ ] Verify both are accessible in different sessions
- [ ] Navigation between pages works
- [ ] Active nav link highlights correctly

---

## 🐛 Error Handling Testing

### Network Errors
- [ ] Shows error message when API is down
- [ ] Shows error when network timeout
- [ ] Handles CORS errors gracefully

### Validation Errors
- [ ] Shows field-level validation errors
- [ ] Shows server-side validation errors
- [ ] Error messages are user-friendly
- [ ] Multiple errors displayed correctly

### Edge Cases
- [ ] Very long names (100+ characters)
- [ ] Special characters in names
- [ ] Emoji in names
- [ ] Leading/trailing whitespace
- [ ] Empty strings vs null values
- [ ] Concurrent edits (optimistic updates)

---

## 📱 Responsive Design Testing

### Mobile (375px)
- [ ] Navigation is usable
- [ ] Tables are scrollable or stacked
- [ ] Modals fit on screen
- [ ] Buttons are tappable (min 44px)
- [ ] Forms are usable

### Tablet (768px)
- [ ] Layout adjusts appropriately
- [ ] Tables display correctly
- [ ] All features accessible

### Desktop (1920px)
- [ ] Content doesn't stretch too wide
- [ ] Modals are centered
- [ ] Tables are readable

---

## ♿ Accessibility Testing

- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Focus states are visible
- [ ] Modal traps focus correctly
- [ ] Esc key closes modals
- [ ] Form labels are associated with inputs
- [ ] Error messages are announced
- [ ] Color contrast meets WCAG AA standards
- [ ] Buttons have descriptive text

---

## 🚀 Performance Testing

- [ ] Initial page load is fast (< 3s)
- [ ] API responses are fast (< 500ms)
- [ ] No unnecessary re-renders
- [ ] List rendering is efficient
- [ ] Modal animations are smooth
- [ ] No memory leaks on page navigation

---

## 📊 Testing Summary

**Total Tests:** 200+

### Test by Category
- Backend API: ~60 tests
- Frontend UI: ~80 tests
- Authentication: ~10 tests
- Database: ~15 tests
- Integration: ~20 tests
- Error Handling: ~10 tests
- Responsive: ~5 tests
- Accessibility: ~8 tests
- Performance: ~6 tests

### Priority Levels
- **P0 (Critical):** All CRUD operations, Authentication
- **P1 (High):** Validation, Error handling, User isolation
- **P2 (Medium):** UI/UX, Edge cases
- **P3 (Low):** Performance optimizations, Accessibility enhancements

---

## 🛠️ Testing Tools

### Recommended Tools
- **Backend:** Postman/Thunder Client, Jest, Supertest
- **Frontend:** React Testing Library, Vitest, Playwright
- **E2E:** Playwright, Cypress
- **API Testing:** Postman collections
- **Manual:** Browser DevTools, React DevTools

### Quick Manual Test Script
```bash
# 1. Start servers
cd backend && npm run dev
cd frontend && npm run dev

# 2. Open browser to http://localhost:5173
# 3. Login with test user
# 4. Test each feature manually following the checklists above

# 5. Check browser console for errors
# 6. Check network tab for failed requests
# 7. Test with React DevTools for state issues
```

---

## 📝 Notes

- Mark items as you test them
- Document any bugs found in `errors.md`
- Take screenshots of UI issues
- Record steps to reproduce bugs
- Test with different user accounts
- Clear localStorage between test sessions for auth testing

---

**Testing Status:** Not Started

**Next Steps:**
1. Choose testing approach (manual vs automated)
2. Set up testing tools if doing automated tests
3. Work through checklist systematically
4. Document any issues found
5. Fix critical bugs before Sprint 2
