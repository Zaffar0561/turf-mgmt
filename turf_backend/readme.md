# Turf Task API

## Overview

This repository is a Turf Management API built with Express, MongoDB, and role-based authorization.
The API supports:

- User registration, email verification, login, refresh token and password reset flows
- Role-based access control for `customer`, `turf_owner`, and `admin`
- Turf listing creation, updates, deletion, and owner-specific turf management
- File upload support for turf images and generic uploads

## Step-by-step Role-Based API Testing

This guide covers the complete flow from server setup to testing customer, turf owner, and admin APIs.

### 1. Install dependencies and start the server

```bash
npm install
npm start
```

Server default URL: `http://localhost:3000`

### 2. Create the admin user

The admin account is created by running the script once. If your project uses environment variables, set them first.

```bash
ADMIN_NAME="Admin User" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="AdminPassword123" node scripts/create-admin.js
```

If the admin already exists, skip this step and log in directly.

### 3. Login as admin and save token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "email": "admin@example.com",
  "password": "AdminPassword123"
}
EOF
```

Response includes an `accessToken`. Save it as `ADMIN_ACCESS_TOKEN`.

### 4. Create customer and turf owner users using admin

Create one customer:

```bash
curl -X POST http://localhost:3000/api/v1/roles/admin/customers \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "name": "Test Customer",
  "email": "customer@example.com",
  "password": "Customer123",
  "phone": "1234567890"
}
EOF
```

Create one turf owner:

```bash
curl -X POST http://localhost:3000/api/v1/roles/admin/turf-owners \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "name": "Test Turf Owner",
  "email": "turfowner@example.com",
  "password": "TurfOwner123",
  "phone": "0987654321"
}
EOF
```

### 5. Login as customer and turf owner

Customer login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "email": "customer@example.com",
  "password": "Customer123"
}
EOF
```

Turf owner login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "email": "turfowner@example.com",
  "password": "TurfOwner123"
}
EOF
```

Save the returned tokens as `CUSTOMER_ACCESS_TOKEN` and `TURF_OWNER_ACCESS_TOKEN`.

### 6. Customer role testing

Search available turfs:

```bash
curl -X GET "http://localhost:3000/api/v1/roles/customer/turfs?city=bangalore&size=large&minPrice=100&maxPrice=500" \
  -H "Authorization: Bearer CUSTOMER_ACCESS_TOKEN"
```

Get details of a single turf:

```bash
curl -X GET "http://localhost:3000/api/v1/roles/customer/turfs/TURF_ID" \
  -H "Authorization: Bearer CUSTOMER_ACCESS_TOKEN"
```

> Replace `TURF_ID` with the value returned by the turf list response.

### 7. Turf owner role testing

Create a new turf listing:

```bash
curl -X POST http://localhost:3000/api/v1/roles/turf-owner/turfs \
  -H "Authorization: Bearer TURF_OWNER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "name": "Test Turf",
  "city": "bangalore",
  "size": "large",
  "price": 250,
  "description": "Sample turf",
  "address": "123 Turf Street"
}
EOF
```

List all turfs owned by the turf owner:

```bash
curl -X GET http://localhost:3000/api/v1/roles/turf-owner/my-turfs \
  -H "Authorization: Bearer TURF_OWNER_ACCESS_TOKEN"
```

Update a turf:

```bash
curl -X PUT http://localhost:3000/api/v1/roles/turf-owner/turfs/TURF_ID \
  -H "Authorization: Bearer TURF_OWNER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "price": 300,
  "description": "Updated description"
}
EOF
```

Delete a turf:

```bash
curl -X DELETE http://localhost:3000/api/v1/roles/turf-owner/turfs/TURF_ID \
  -H "Authorization: Bearer TURF_OWNER_ACCESS_TOKEN"
```

Upload images for a turf:

```bash
curl -X POST "http://localhost:3000/api/v1/roles/turf-owner/turfs/TURF_ID/images" \
  -H "Authorization: Bearer TURF_OWNER_ACCESS_TOKEN" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

### 8. Admin role testing

List all users:

```bash
curl -X GET http://localhost:3000/api/v1/roles/admin/users \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

List all customers:

```bash
curl -X GET http://localhost:3000/api/v1/roles/admin/customers \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

List all turf owners:

```bash
curl -X GET http://localhost:3000/api/v1/roles/admin/turf-owners \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

Get a specific user by ID:

```bash
curl -X GET http://localhost:3000/api/v1/roles/admin/users/USER_ID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

Update a user:

```bash
curl -X PUT http://localhost:3000/api/v1/roles/admin/users/USER_ID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "name": "Updated Name",
  "phone": "1112223333"
}
EOF
```

Delete a user:

```bash
curl -X DELETE http://localhost:3000/api/v1/roles/admin/users/USER_ID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```
