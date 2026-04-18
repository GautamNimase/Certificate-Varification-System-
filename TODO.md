# Fix AdminDashboard fetchStudents Error

## Plan Steps:
- [ ] 1. Create this TODO.md
- [ ] 2. Add missing `fetchStudents` function to AdminDashboard.jsx
- [ ] 3. Fix CSS className syntax error in message alert
- [ ] 4. Update TODO.md with progress
- [ ] 5. Test: Reload Vite dev server, check AdminDashboard loads without error
- [ ] 6. Verify students dropdown populates (check /students API)
- [ ] 7. Complete task

## Current Status: ✅ Fixed!

## Plan Steps:
- [x] 1. Create this TODO.md
- [x] 2. Add missing `fetchStudents` function to AdminDashboard.jsx  
  (Fetches from `${API_URL}/students` with auth header)
- [x] 3. Fix CSS className syntax error in message alert
- [x] 4. Update TODO.md with progress

## Remaining:
- [ ] 5. Test: Reload Vite dev server (`cd client && npm run dev`), navigate to AdminDashboard
- [ ] 6. Verify students dropdown populates (if /students API returns data)
- [ ] 7. If API error, check server is running and studentController.js

**Status Update:** ✅ Main JS error fixed! 🔄 New issue: 404 on /api/students (missing backend endpoint)

**New Plan - Fix 404:**
1. Add getAllStudents() to server/controllers/studentController.js
2. Add route GET /api/users/students in server/routes/usersRoutes.js  
3. Update frontend fetchStudents to use /users/students
4. ✅ Backend endpoint created: GET /api/users/students (admin-only)
5. ✅ Frontend updated to use new endpoint
6. **RESTART SERVER:** `cd server && npm start`
7. Test: AdminDashboard students dropdown should populate


