# Admin Panel Troubleshooting Script

Use this checklist to diagnose and fix common issues when accessing new admin features (e.g., Customer Insights dashboard) in your MERN stack project.

---

## 1. Check Frontend and Backend Ports
- [ ] Is your frontend running on a different port (e.g., 5173 for Vite)?
- [ ] Is your backend running on port 5000?

## 2. CORS Settings
- [ ] Does your backend CORS config allow requests from `http://localhost:5173`?
  - In `server/config/env.js` or your CORS middleware, ensure:
    ```js
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
    ```

## 3. Backend Accessibility
- [ ] Can you access your backend from the browser?
  - Open [http://localhost:5000/api/users/profile](http://localhost:5000/api/users/profile) in your browser (while logged in).
  - If you see an error, check backend logs for details.

## 4. Login Status
- [ ] Are you logged in as an admin?
  - If not, `/api/users/profile` may fail due to missing/expired token.
  - Try logging in again from the admin login page.

## 5. Frontend API Config
- [ ] Is your frontend configured to use the correct backend URL?
  - Check `client/src/api/config.js` for the base URL:
    ```js
    export default axios.create({
      baseURL: 'http://localhost:5000/api',
      // ...
    });
    ```

## 6. Route and Sidebar Integration
- [ ] Did you add the new route in your admin router?
  - Example:
    ```jsx
    <Route path="/admin/customer-insights" element={<CustomerInsights />} />
    ```
- [ ] Did you add a sidebar link?
  - Example:
    ```jsx
    <NavLink to="/admin/customer-insights">Customer Insights</NavLink>
    ```

## 7. Restart Servers
- [ ] After making changes, restart both backend and frontend servers.

---

## If You Still See 404 or Network Errors
- Double-check the above steps.
- Check browser console and backend logs for error messages.
- If using a proxy or Docker, ensure ports are mapped correctly.
- Ask for help with specific error messages and screenshots.

---

**This checklist will help you systematically resolve most admin panel access issues!** 