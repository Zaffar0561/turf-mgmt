# Turf Management App Setup Guide

This guide explains how the frontend and backend were connected, how the CORS issue was fixed, and how to run the app locally.

## 1. Project Structure

- Frontend: turf_frontend
- Backend: turf_backend

## 2. Backend Setup

### Step 1: Install dependencies

Go to the backend folder:

```bash
cd turf_backend
npm install
```

### Step 2: Create environment variables

Create a `.env` file inside `turf_backend` with values similar to:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

### Step 3: Start the backend

```bash
npm run dev
```

The backend should run at:

```text
http://localhost:3000
```

## 3. Frontend Setup

### Step 1: Install dependencies

Go to the frontend folder:

```bash
cd turf_frontend
npm install
```

### Step 2: Start the frontend

```bash
npm run dev
```

The frontend should run at:

```text
http://localhost:5173
```

## 4. Frontend and Backend Integration Steps

The integration was implemented in simple steps:

### Step 1: Create the frontend auth connection

The login logic is written in [turf_frontend/src/context/AuthContext.jsx](turf_frontend/src/context/AuthContext.jsx).

This file:

- sends the login request to the backend
- receives the access token
- stores the token in localStorage
- stores the user role
- redirects the user based on role

### Step 2: Connect dashboard pages to backend APIs

The dashboard pages call backend endpoints to display real data:

- [turf_frontend/src/pages/customer/Customer_Dashboard.jsx](turf_frontend/src/pages/customer/Customer_Dashboard.jsx) fetches all available turfs
- [turf_frontend/src/pages/owner/Owner_Dashboard.jsx](turf_frontend/src/pages/owner/Owner_Dashboard.jsx) fetches turfs belonging to the logged-in owner
- [turf_frontend/src/pages/admin/Admin_Dashboard.jsx](turf_frontend/src/pages/admin/Admin_Dashboard.jsx) fetches admin statistics

### Step 3: Expose backend routes for frontend use

The backend routes that the frontend uses are defined in:

- [turf_backend/src/routes/auth.routes.js](turf_backend/src/routes/auth.routes.js)
- [turf_backend/src/routes/turf.routes.js](turf_backend/src/routes/turf.routes.js)
- [turf_backend/src/routes/role_based.routes.js](turf_backend/src/routes/role_based.routes.js)

### Step 4: Fix CORS so browser requests work

The CORS configuration was added in [turf_backend/app.js](turf_backend/app.js) so the frontend running on `http://localhost:5173` can access the backend running on `http://localhost:3000`.

### Step 5: Send the token for protected APIs

For protected requests, the frontend adds the token in the `Authorization` header:

```js
headers: {
  Authorization: `Bearer ${token}`;
}
```

This is required for routes such as:

- admin user list
- owner turf list
- protected turf actions

## 5. How Frontend and Backend Were Connected

The frontend communicates with the backend using fetch requests.

### Example login flow

The frontend sends a POST request to:

```text
http://localhost:3000/api/v1/auth/login
```

The backend returns:

```json
{
  "success": true,
  "data": {
    "user": {
      "role": "customer"
    },
    "tokens": {
      "accessToken": "..."
    }
  },
  "message": "Login successful"
}
```

The frontend stores the access token in localStorage and uses it for protected requests.

## 5. CORS Fix

The browser blocked requests from the Vite frontend because the backend was not allowing requests from `http://localhost:5173`.

### Fix applied

In the backend file `turf_backend/app.js`, CORS was enabled with:

```js
import cors from "cors";

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
```

This allows the frontend to call the backend successfully.

## 6. API Integration Examples

### Login

Frontend calls:

```text
POST /api/v1/auth/login
```

### Get all turfs

Frontend calls:

```text
GET /api/v1/turfs/search/all
```

### Admin stats

Frontend calls:

```text
GET /api/v1/roles/admin/users
GET /api/v1/roles/admin/customers
GET /api/v1/roles/admin/turf-owners
```

### Owner turfs

Frontend calls:

```text
GET /api/v1/roles/turf-owner/my-turfs
```

## 7. Important Notes

- The frontend must send the token in the `Authorization` header for protected APIs.
- Example:

```js
headers: {
  Authorization: `Bearer ${token}`;
}
```

- The backend uses role-based access control, so users must log in with the correct role:
  - admin
  - turf_owner
  - customer

## 8. Common Issues

### Issue: CORS error

Solution:

- Make sure the backend has CORS enabled for `http://localhost:5173`.

### Issue: No data shown

Solution:

- Make sure MongoDB has real data.
- Make sure the user role matches the dashboard being opened.

### Issue: Login fails

Solution:

- Make sure the email is verified.
- Make sure the backend is running.
- Make sure the request body format matches the backend validator.

## 9. Quick Start

Run both apps:

```bash
cd turf_backend
npm run dev
```

```bash
cd turf_frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```
