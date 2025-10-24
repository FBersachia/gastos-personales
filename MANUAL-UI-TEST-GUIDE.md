# Manual UI Testing Guide - Sprint 1

This guide will walk you through testing the frontend UI manually.

**Frontend URL:** http://localhost:5173
**Test User:** test@example.com
**Password:** password123

---

## Pre-Testing Setup

1. ✅ Ensure backend is running on http://localhost:3000
2. ✅ Ensure frontend is running on http://localhost:5173
3. Open browser to http://localhost:5173
4. Open browser DevTools (F12) - keep Console and Network tabs visible

---

## Test Session 1: Authentication & Navigation

### Login Flow
- [ ] Navigate to http://localhost:5173
- [ ] Should redirect to /login if not authenticated
- [ ] Enter email: test@example.com
- [ ] Enter password: password123
- [ ] Click "Login" button
- [ ] Should redirect to dashboard (/)
- [ ] Check: No errors in console
- [ ] Check: Network tab shows successful login request

### Navigation
- [ ] Click "Payment Methods" in header
- [ ] URL should change to /payment-methods
- [ ] "Payment Methods" link should be highlighted in blue
- [ ] Click "Categories" in header
- [ ] URL should change to /categories
- [ ] "Categories" link should be highlighted
- [ ] Click "Dashboard"
- [ ] URL should change to /
- [ ] All navigation should work without page reload (SPA behavior)

---

## Test Session 2: Payment Methods Page

### Initial State
- [ ] Navigate to /payment-methods
- [ ] Should see "Visa Santander" in the table (from backend tests)
- [ ] Table should have columns: Name, Created, Actions
- [ ] "Add Payment Method" button visible at top right
- [ ] Check: No console errors

### Create Payment Method
- [ ] Click "Add Payment Method" button
- [ ] Modal should open with title "New Payment Method"
- [ ] Name input should be auto-focused
- [ ] Leave name empty, click "Create"
- [ ] Should show error: "Name is required"
- [ ] Enter name: "Efectivo"
- [ ] Click "Create"
- [ ] Modal should close
- [ ] "Efectivo" should appear in table
- [ ] Should be sorted alphabetically
- [ ] Check Network tab: POST request was successful

### Duplicate Name Validation
- [ ] Click "Add Payment Method"
- [ ] Enter name: "Efectivo" (duplicate)
- [ ] Click "Create"
- [ ] Should show error: "Payment method with this name already exists"
- [ ] Modal should stay open
- [ ] Click "Cancel"
- [ ] Modal should close

### Edit Payment Method
- [ ] Click "Edit" on "Efectivo" row
- [ ] Modal should open with title "Edit Payment Method"
- [ ] Name field should show "Efectivo"
- [ ] Change name to "Cash"
- [ ] Click "Update"
- [ ] Modal should close
- [ ] Table should show "Cash" instead of "Efectivo"
- [ ] Name should be updated in the list

### Delete Payment Method
- [ ] Click "Delete" on "Cash" row
- [ ] Confirmation modal should open
- [ ] Modal should have red styling
- [ ] Text should warn about permanent deletion
- [ ] Click "Cancel"
- [ ] Modal should close, "Cash" still in table
- [ ] Click "Delete" again
- [ ] Click "Delete" in confirmation modal
- [ ] "Cash" should be removed from table
- [ ] Only "Visa Santander" should remain

### Empty State (if needed)
- [ ] If you deleted all payment methods:
  - Should see "No payment methods yet" message
  - Should see "Add Your First Payment Method" button
  - Clicking it should open create modal

---

## Test Session 3: Categories Page

### Initial State
- [ ] Navigate to /categories
- [ ] Should see "Transportation" in Macro Categories section (from tests)
- [ ] Should see "Groceries" and "Other" in categories table
- [ ] Macro category chip should show count: Transportation (0)
- [ ] Filter dropdown should show "All Categories" selected
- [ ] Two buttons at top: "Add Macro Category" (green), "Add Category" (blue)

### Create Macro Category
- [ ] Click "Add Macro Category" button
- [ ] Green modal should open
- [ ] Title: "New Macro Category"
- [ ] Enter name: "Housing"
- [ ] Click "Create"
- [ ] Modal should close
- [ ] "Housing" should appear in macro categories chips
- [ ] Should show "Housing (0)"
- [ ] Filter dropdown should now include "Housing"

### Create Category with Macro Link
- [ ] Click "Add Category"
- [ ] Enter name: "Rent"
- [ ] Select "Housing" from macro category dropdown
- [ ] Click "Create"
- [ ] "Rent" should appear in table
- [ ] Macro Category column should show "Housing" badge
- [ ] "Housing" chip should now show "Housing (1)"

### Create Category without Macro
- [ ] Click "Add Category"
- [ ] Enter name: "Miscellaneous"
- [ ] Leave macro category as "None"
- [ ] Click "Create"
- [ ] "Miscellaneous" should appear with "-" in macro column

### Filter by Macro Category
- [ ] Select "Housing" from filter dropdown
- [ ] Table should show only "Rent"
- [ ] Other categories should be hidden
- [ ] Select "All Categories"
- [ ] All categories should be visible again

### Edit Category
- [ ] Click "Edit" on "Miscellaneous"
- [ ] Change name to "Misc"
- [ ] Select "Housing" from macro dropdown
- [ ] Click "Update"
- [ ] Name should update to "Misc"
- [ ] Macro column should show "Housing" badge
- [ ] "Housing" chip should now show "(2)"

### Edit Macro Category
- [ ] Click "Edit" on "Housing" chip
- [ ] Change name to "Home & Living"
- [ ] Click "Update"
- [ ] Chip should show "Home & Living (2)"
- [ ] Categories table should show updated macro name

### Delete Category
- [ ] Click "Delete" on "Misc" row
- [ ] Confirmation modal should open
- [ ] Warning about transactions should be shown
- [ ] Click "Delete"
- [ ] "Misc" should be removed
- [ ] "Home & Living" count should show "(1)"

### Delete Macro Category (Cascade Test)
- [ ] Note which categories are linked to "Home & Living"
- [ ] Click "Delete" on "Home & Living" chip
- [ ] Special warning about unlinking categories
- [ ] Click "Delete"
- [ ] "Home & Living" macro should be removed
- [ ] Categories that were linked should still exist
- [ ] Their macro column should show "-"
- [ ] Filter dropdown should no longer show "Home & Living"

---

## Test Session 4: Error Handling

### Network Error Simulation
1. **Stop the backend server:**
   - In terminal running backend, press Ctrl+C

2. **Test Payment Methods:**
   - [ ] Refresh /payment-methods page
   - [ ] Should show error message
   - [ ] Error should be user-friendly (not technical)

3. **Test Create Operation:**
   - [ ] Try to create a payment method
   - [ ] Should show error message

4. **Restart backend:**
   - Run `cd backend && npm run dev`
   - Wait for "Server running" message

5. **Verify Recovery:**
   - [ ] Refresh page
   - [ ] Data should load successfully

### Session Expiration (Optional)
- [ ] Wait 7 days for token to expire, OR
- [ ] Clear localStorage in DevTools
- [ ] Try to access /payment-methods
- [ ] Should redirect to /login
- [ ] Login again
- [ ] Should work normally

---

## Test Session 5: Responsive Design

### Mobile View (375px)
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select "iPhone SE" or set width to 375px

**Test Navigation:**
- [ ] Header should be responsive
- [ ] Navigation links should be readable
- [ ] User email and logout button visible

**Test Payment Methods:**
- [ ] Table should be scrollable or stacked
- [ ] Buttons should be tappable (not too small)
- [ ] Modals should fit on screen
- [ ] All features should be usable

**Test Categories:**
- [ ] Macro category chips should wrap
- [ ] Filter dropdown should work
- [ ] Table should be usable
- [ ] Modals should fit

### Tablet View (768px)
- [ ] Set width to 768px
- [ ] Test same features
- [ ] Layout should adjust appropriately

### Desktop View (1920px)
- [ ] Set width to 1920px
- [ ] Content should not stretch too wide
- [ ] Modals should be centered
- [ ] Everything should be readable

---

## Test Session 6: Accessibility

### Keyboard Navigation
- [ ] Tab through Payment Methods page
- [ ] All interactive elements should be reachable
- [ ] Focus indicator should be visible
- [ ] Enter key should activate buttons
- [ ] Esc key should close modals

### Form Accessibility
- [ ] Click on "Name *" label
- [ ] Input should be focused
- [ ] Error messages should be associated with fields

---

## Test Session 7: Data Persistence

### Create Test Data
1. Create 3 payment methods
2. Create 2 macro categories
3. Create 5 categories (some with macros, some without)

### Test Persistence
- [ ] Refresh page - data should remain
- [ ] Navigate to Dashboard and back - data should remain
- [ ] Logout and login again - data should remain
- [ ] Close browser and reopen - after login, data should remain

---

## 🐛 Bug Report Template

If you find any issues, document them as follows:

```
**Bug:** [Short description]
**Page:** [Payment Methods / Categories]
**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected:** [What should happen]
**Actual:** [What actually happened]
**Console Errors:** [Any errors from browser console]
**Screenshot:** [Optional]
**Priority:** [High/Medium/Low]
```

---

## ✅ Testing Checklist Summary

### Payment Methods Page
- [ ] Page loads correctly
- [ ] Empty state displays
- [ ] Create payment method works
- [ ] Duplicate name validation works
- [ ] Edit payment method works
- [ ] Delete payment method works
- [ ] Confirmation modal works
- [ ] Error handling works

### Categories Page
- [ ] Page loads with both sections
- [ ] Create macro category works
- [ ] Create category with macro works
- [ ] Create category without macro works
- [ ] Filter by macro works
- [ ] Edit category works
- [ ] Edit macro category works
- [ ] Delete category works
- [ ] Delete macro cascade works
- [ ] Counts update correctly

### General
- [ ] Authentication works
- [ ] Navigation works
- [ ] Logout works
- [ ] Mobile responsive
- [ ] Tablet responsive
- [ ] Desktop responsive
- [ ] Keyboard navigation works
- [ ] Data persists across sessions
- [ ] Error messages are clear
- [ ] No console errors during normal use

---

## 📊 Expected Results

After completing all tests:
- ✅ 50+ manual UI tests completed
- ✅ All critical features working
- ✅ No blocking bugs found
- ✅ Ready for Sprint 2 development

---

**Testing Time Estimate:** 45-60 minutes for complete testing
**Recommended:** Test in Chrome, Firefox, and Safari if possible

**Happy Testing!** 🚀
