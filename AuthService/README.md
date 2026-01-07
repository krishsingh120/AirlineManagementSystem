# AuthService – Airline Management System

A secure, scalable authentication and authorization microservice for an Airline Management / Booking System. AuthService provides centralized identity and access management using JWT-based authentication and Role-Based Access Control (RBAC).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Technical Stack](#technical-stack)
4. [Database Design](#database-design)
5. [Authentication Flow](#authentication-flow)
6. [Authorization & RBAC](#authorization--rbac)
7. [Folder Structure](#folder-structure)
8. [Security Practices](#security-practices)
9. [API Endpoints](#api-endpoints)
10. [Setup & Installation](#setup--installation)
11. [Use Cases in Airline Management System](#use-cases-in-airline-management-system)
12. [Running the Service](#running-the-service)

---

## Project Overview

**AuthService** is a core backend microservice responsible for:

- **User Registration & Authentication** – Securely register users and authenticate them using credentials
- **JWT Token Management** – Issue and validate JSON Web Tokens (JWT) for stateless authentication
- **Role Management** – Manage user roles (ADMIN, CUSTOMER, etc.) in the system
- **Authorization & Access Control** – Enforce role-based permissions across the Airline Management ecosystem

The service operates behind an API Gateway and serves as the single source of truth for identity and access management, enabling other microservices (Search Service, Booking Service, Reminder Service) to trust and validate user requests.

---

## High-Level Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Client (Web/Mobile App)                   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│  (Request Routing, Rate Limiting, Token Validation)          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    AuthService                               │
│  - User Registration                                         │
│  - Login & JWT Token Generation                              │
│  - Token Validation & Verification                           │
│  - Role & Permission Management                              │
└────────────┬───────────────────────────────┬────────────────┘
             │                               │
             ▼                               ▼
    ┌─────────────────┐         ┌─────────────────────┐
    │ MySQL Database  │         │ Other Microservices │
    │  - Users        │         │  - Search Service   │
    │  - Roles        │         │  - Booking Service  │
    │  - User_Roles   │         │  - Reminder Service │
    └─────────────────┘         └─────────────────────┘
```

### Why AuthService is Isolated as a Separate Microservice

1. **Single Responsibility Principle** – Focuses exclusively on authentication and authorization
2. **Horizontal Scalability** – Can scale independently based on authentication demand
3. **Security Isolation** – Sensitive credential handling is centralized and hardened
4. **Reusability** – Multiple services can rely on a single trusted identity provider
5. **Loose Coupling** – Other services remain independent and don't duplicate authentication logic
6. **Technology Flexibility** – Can be updated or replaced without affecting dependent services

### JWT-Based Authentication Across Microservices

```
1. Client authenticates with AuthService → receives JWT
2. Client includes JWT in Authorization header for all requests
3. API Gateway validates JWT signature and expiration
4. Backend services receive validated request → apply role-based authorization
5. Services extract user context from JWT payload → enforce permissions
```

**Benefits:**

- **Stateless** – No session storage required
- **Scalable** – Works seamlessly in load-balanced environments
- **Secure** – Cryptographically signed; tamper-evident
- **Standard** – Industry-standard approach (OAuth 2.0 compatible)

### Role-Based Authorization (RBAC)

Authorization is enforced at the middleware level using role information embedded in the JWT token:

```javascript
// Example: Middleware checks user role before allowing access
const requireAdmin = async (req, res, next) => {
  const user = req.user; // Extracted from JWT
  if (!user.roles.includes("ADMIN")) {
    return res.status(403).json({
      message: "Access denied. Admin role required.",
    });
  }
  next();
};
```

---

## Technical Stack

| Component                 | Technology                             |
| ------------------------- | -------------------------------------- |
| **Runtime**               | Node.js                                |
| **Web Framework**         | Express.js (v5.1.0)                    |
| **Database**              | MySQL                                  |
| **ORM**                   | Sequelize v6.37.7 (with sequelize-cli) |
| **Authentication**        | JSON Web Tokens (JWT v9.0.2)           |
| **Password Hashing**      | bcrypt v6.0.0                          |
| **Environment Variables** | dotenv v17.2.1                         |
| **HTTP Status Codes**     | http-status-codes v2.3.0               |
| **Development**           | Nodemon v3.1.10                        |

---

## Database Design

### Schema Overview

The database uses a three-table structure to implement flexible role-based access control:

#### 1. **Users Table**

Stores user account information with encrypted passwords.

| Column      | Type         | Constraints                 |
| ----------- | ------------ | --------------------------- |
| `id`        | INT          | PRIMARY KEY, AUTO_INCREMENT |
| `email`     | VARCHAR(255) | UNIQUE, NOT NULL            |
| `password`  | VARCHAR(255) | NOT NULL (bcrypt hashed)    |
| `createdAt` | TIMESTAMP    | Default: CURRENT_TIMESTAMP  |
| `updatedAt` | TIMESTAMP    | Default: CURRENT_TIMESTAMP  |

**Key Features:**

- Email is unique to prevent duplicate accounts
- Passwords are hashed using bcrypt before storage (never plain text)
- Timestamps track account creation and modifications

#### 2. **Roles Table**

Defines available roles in the system.

| Column      | Type         | Constraints                 |
| ----------- | ------------ | --------------------------- |
| `id`        | INT          | PRIMARY KEY, AUTO_INCREMENT |
| `name`      | VARCHAR(255) | NOT NULL                    |
| `createdAt` | TIMESTAMP    | Default: CURRENT_TIMESTAMP  |
| `updatedAt` | TIMESTAMP    | Default: CURRENT_TIMESTAMP  |

**Standard Roles:**

- `ADMIN` – Full system access; manage flights, airports, users
- `CUSTOMER` – Browse flights, make bookings, view orders
- `AIRLINE` – Manage airline operations and schedules
- `SUPPORT` – Handle customer support tickets

#### 3. **User_Roles Junction Table** (Many-to-Many Mapping)

Links users to their assigned roles, enabling flexible permission assignment.

| Column      | Type      | Constraints                 |
| ----------- | --------- | --------------------------- |
| `id`        | INT       | PRIMARY KEY, AUTO_INCREMENT |
| `userId`    | INT       | FOREIGN KEY → Users(id)     |
| `roleId`    | INT       | FOREIGN KEY → Roles(id)     |
| `createdAt` | TIMESTAMP | Default: CURRENT_TIMESTAMP  |
| `updatedAt` | TIMESTAMP | Default: CURRENT_TIMESTAMP  |

**Why Many-to-Many Mapping?**

- **Flexibility** – A user can have multiple roles (e.g., user is both CUSTOMER and SUPPORT)
- **Scalability** – Easy to add new roles without schema changes
- **Maintainability** – Changes to role permissions don't affect user records
- **Business Realism** – Reflects real-world scenarios where users wear multiple hats

**Example:**

```
User: john@airline.com
  ├─ Role: CUSTOMER (can search flights, book tickets)
  └─ Role: SUPPORT (can view and respond to support tickets)
```

---

## Authentication Flow

### Step-by-Step Authentication Process

#### **Phase 1: User Registration**

```
Client Request:
POST /api/v1/signup
Content-Type: application/json

{
  "email": "customer@airline.com",
  "password": "securePassword123"
}
```

**AuthService Process:**

1. Validates email format and password strength (≥5 characters)
2. Hashes password using bcrypt with salt rounds = 10
3. Creates user record in database
4. Returns user object (without password)

```
Server Response (201 Created):
{
  "data": {
    "id": 1,
    "email": "customer@airline.com",
    "createdAt": "2025-01-07T10:30:00Z",
    "updatedAt": "2025-01-07T10:30:00Z"
  },
  "success": true,
  "message": "Successfully created a new user",
  "err": {}
}
```

**Security Note:** Password is hashed using `bcrypt.hash()` before storage. Original password is never logged or stored.

---

#### **Phase 2: User Login**

```
Client Request:
POST /api/v1/signin
Content-Type: application/json

{
  "email": "customer@airline.com",
  "password": "securePassword123"
}
```

**AuthService Process:**

1. Looks up user by email
2. Verifies password using `bcrypt.compare()`
3. Queries user roles from User_Roles junction table
4. Generates JWT access token with user and role data
5. Returns token to client

```javascript
// JWT Token Structure
{
  "id": 1,
  "email": "customer@airline.com",
  "roles": ["CUSTOMER"],
  "iat": 1704974400,        // Issued At
  "exp": 1704978000         // Expires In 1 hour
}
```

```
Server Response (201 Created):
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "success": true,
  "message": "Successfully signin a user",
  "err": {}
}
```

---

#### **Phase 3: Token Validation**

```
Client includes token in Authorization header:

GET /api/search-flights
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Validation Process:**

1. Extract token from `x-access-token` header or `Authorization: Bearer` header
2. Verify JWT signature using secret key
3. Check token expiration
4. Extract user and role information from payload
5. Attach user context to request object
6. Allow request to proceed or reject with 401 Unauthorized

```javascript
// Validation Endpoint
GET /api/v1/isAuthenticated
Headers:
  x-access-token: <JWT_TOKEN>

Response (200 OK):
{
  "data": {
    "id": 1,
    "email": "customer@airline.com",
    "roles": ["CUSTOMER"]
  },
  "success": true,
  "message": "User Authenticated and token is valid",
  "err": {}
}

Response (401 Unauthorized):
{
  "data": {},
  "success": false,
  "message": "Authentication failed",
  "err": {}
}
```

---

#### **Phase 4: Role-Based Authorization**

After authentication, authorization middleware checks if the user has required roles:

```javascript
// Example: Only ADMIN users can delete users
DELETE /api/v1/delete/:id

Middleware Check:
  User has role: CUSTOMER
  Required role: ADMIN
  Result: 403 Forbidden – Access Denied
```

---

## Authorization & RBAC

### Role-Based Access Control Model

The RBAC model in AuthService uses a three-entity relationship:

```
┌──────────┐         ┌─────────────┐         ┌───────┐
│   User   │◄───────►│ User_Roles  │◄───────►│ Role  │
│          │  N to N │  (Junction) │  N to N │       │
└──────────┘         └─────────────┘         └───────┘
```

### Role Examples

| Role         | Permissions                                                            | Use Case                                |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| **ADMIN**    | Create/edit/delete flights, airports, airlines; manage users and roles | System administrators, airline managers |
| **CUSTOMER** | Search flights, book tickets, view bookings, manage profile            | Passengers                              |
| **AIRLINE**  | Manage own airline's flights, pricing, schedules                       | Airline representatives                 |
| **SUPPORT**  | View customer support tickets, respond to inquiries                    | Customer support team                   |

### Authorization Flow

```
1. User logs in → receives JWT with roles payload
   {
     "id": 1,
     "roles": ["CUSTOMER"]
   }

2. Client includes JWT in request to protected endpoint
   GET /api/admin/users
   Authorization: Bearer <JWT>

3. Backend middleware validates JWT and extracts roles
   roles = ["CUSTOMER"]

4. Middleware checks required roles
   Required: ["ADMIN"]
   User has: ["CUSTOMER"]
   Match? NO

5. Request rejected with 403 Forbidden
   {
     "message": "Access denied. Admin role required."
   }
```

### Flexible Permission Assignment

Users can have multiple roles:

```javascript
// User John has multiple roles
User: john@airline.com
  ├─ CUSTOMER (can book flights)
  ├─ SUPPORT (can handle support tickets)
  └─ ADMIN (can manage users)

// Token payload
{
  "id": 5,
  "email": "john@airline.com",
  "roles": ["CUSTOMER", "SUPPORT", "ADMIN"]
}

// Authorization checks
✓ Can book flights (has CUSTOMER)
✓ Can view support tickets (has SUPPORT)
✓ Can manage users (has ADMIN)
✗ Cannot manage airlines (no AIRLINE role)
```

---

## Folder Structure

```
src/
├── config/                    # Configuration files
│   ├── config.json           # Database configuration
│   └── server.config.js      # Server-level config (PORT, JWT_KEY, etc.)
│
├── controller/               # Request handlers (Controller layer)
│   └── user.controller.js    # User-related endpoints (signup, signin, delete)
│
├── middleware/               # Express middleware
│   ├── authRequestValidator.js  # Request validation (email, password format)
│   └── index.js              # Middleware exports
│
├── migrations/               # Sequelize migrations
│   ├── 20250805070301-create-user.js
│   └── 20250808111032-create-role.js
│
├── models/                   # Sequelize ORM models
│   ├── user.js               # User model with bcrypt hashing
│   ├── role.js               # Role model
│   └── index.js              # Model initialization and associations
│
├── repository/               # Data access layer (Repository pattern)
│   ├── user.repository.js    # Database queries for users
│   └── index.js              # Repository exports
│
├── routes/                   # API route definitions
│   ├── index.js              # Main router
│   └── v1/
│       └── index.js          # V1 API routes (signup, signin, etc.)
│
├── seeders/                  # Database seeders
│   └── 20250808113549-add-roles.js  # Seed default roles (ADMIN, CUSTOMER)
│
├── services/                 # Business logic layer (Service layer)
│   ├── user.service.js       # User authentication logic, JWT generation
│   └── index.js              # Service exports
│
├── utils/                    # Utility & helper functions
│   ├── error.handler.js      # Custom error handler class
│   ├── error.code.js         # Error code definitions
│   ├── client.error.js       # Client-side error utilities
│   └── validation.error.js   # Validation error handling
│
└── index.js                  # Express app setup & server start
```

### Folder Responsibility Overview

| Folder         | Responsibility                                                                    | Pattern                  |
| -------------- | --------------------------------------------------------------------------------- | ------------------------ |
| **config**     | Centralized configuration; database connection strings, JWT secrets, port         | Configuration Management |
| **controller** | HTTP request/response handling; input validation delegation; status codes         | MVC Controller           |
| **middleware** | Request preprocessing; validation; authentication checks; error catching          | Express Middleware       |
| **migrations** | Schema version control; create/alter tables; maintain database history            | Sequelize Migrations     |
| **models**     | Data structure definitions; ORM model setup; associations (User ↔ Role)           | Sequelize Models         |
| **repository** | Database CRUD operations; encapsulates Sequelize queries; data layer abstraction  | Repository Pattern       |
| **routes**     | HTTP endpoint definitions; route → controller mapping; versioning (v1, v2)        | Express Routes           |
| **seeders**    | Database initialization; default data insertion (roles, admin user)               | Database Seeders         |
| **services**   | Business logic; authentication rules; JWT token generation/validation; encryption | Service Layer            |
| **utils**      | Reusable helpers; custom error classes; validation logic; formatting              | Utility Functions        |

### Layered Architecture Pattern

```
HTTP Request
    │
    ▼
routes (HTTP routing)
    │
    ▼
middleware (validation, auth checks)
    │
    ▼
controller (request/response handling)
    │
    ▼
services (business logic, JWT, bcrypt)
    │
    ▼
repository (database access)
    │
    ▼
models (Sequelize ORM)
    │
    ▼
MySQL Database
```

This layered approach provides:

- **Separation of Concerns** – Each layer has a single responsibility
- **Testability** – Each layer can be tested independently
- **Maintainability** – Changes in one layer don't cascade
- **Reusability** – Services and repositories are reusable across controllers

---

## Security Practices

### 1. Password Hashing with Bcrypt

**Never store plain-text passwords. Always hash them.**

```javascript
// In User model (src/models/user.js)
User.beforeCreate(async (user, options) => {
  const encryptedPassword = await bcrypt.hashSync(user.password, SALT);
  user.password = encryptedPassword;
});

// During login, compare provided password with stored hash
const isPasswordValid = await bcrypt.compare(plainTextPassword, storedHash);
```

**Why Bcrypt?**

- **Slow Hashing** – Intentionally slow to prevent brute-force attacks
- **Salt** – Automatically generates and includes salt, preventing rainbow table attacks
- **Adaptive** – Cost factor can be increased as computing power improves

---

### 2. JWT Token Security

**JWT tokens are digitally signed and contain user identity information.**

```javascript
// Token generation (signing with secret key)
const token = jwt.sign(
  { id: user.id, email: user.email, roles: user.roles },
  JWT_KEY,
  { expiresIn: "1h" } // Token valid for 1 hour
);

// Token validation (verify signature and expiration)
const decoded = jwt.verify(token, JWT_KEY); // Throws error if invalid or expired
```

**Security Measures:**

- **Signature Verification** – Token cannot be tampered with (signature mismatch detected)
- **Expiration** – Tokens expire after 1 hour; short-lived = reduced damage if leaked
- **Secret Key** – Stored in environment variables, never hardcoded
- **Algorithm** – Uses HS256 (HMAC with SHA-256) for strong cryptography

---

### 3. Environment Variables

**Sensitive data must never be hardcoded in source code.**

```bash
# .env file (NEVER commit to git)
DB_USER=root
DB_PASSWORD=secret123
DB_NAME=airline_db
JWT_KEY=your-super-secret-jwt-key
PORT=3000
SALT=10
```

```javascript
// Access via dotenv
require("dotenv").config();
const JWT_KEY = process.env.JWT_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;
```

**Best Practices:**

- Store `.env` in `.gitignore`
- Commit `.env.example` without actual values
- Rotate secrets periodically
- Use different keys for dev, staging, and production

---

### 4. Request Validation Middleware

**Validate all incoming requests before processing.**

```javascript
// src/middleware/authRequestValidator.js
const validateUserAuth = async (req, res, next) => {
  if (!req.body?.email || !req.body?.password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }
  next(); // Proceed to controller
};
```

**Applied to Routes:**

```javascript
router.post(
  "/signup",
  AuthRequestValidator.validateUserAuth, // Validate first
  UserController.create // Then handle
);
```

---

### 5. Error Handling Without Information Leakage

**Never expose sensitive information in error messages.**

```javascript
// ✗ WRONG - Exposes database details
res.status(500).json({
  error: "Column 'password' does not exist in table 'users'",
});

// ✓ CORRECT - Generic, user-friendly message
res.status(500).json({
  error: "An error occurred. Please try again later.",
});
```

---

### 6. HTTPS in Production

**Always use HTTPS (TLS/SSL) in production to encrypt data in transit.**

```
HTTP → data transmitted in plain text (VULNERABLE)
HTTPS → data encrypted with SSL/TLS (SECURE)
```

The API Gateway should enforce HTTPS and terminate SSL connections before forwarding to AuthService.

---

### 7. Token Validation on Every Protected Request

**All endpoints accessing user data must validate JWT tokens.**

```javascript
// Protected endpoint
app.get("/api/v1/isAuthenticated", (req, res) => {
  const token = req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_KEY);
    res.status(200).json({
      data: decoded,
      message: "Token is valid",
    });
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
});
```

---

## API Endpoints

### User Authentication Endpoints

#### **1. User Signup (Registration)**

```http
POST /api/v1/signup
Content-Type: application/json

{
  "email": "customer@airline.com",
  "password": "SecurePass123"
}
```

**Request Validation:**

- Email must be valid format
- Password must be 5-100 characters
- Email must be unique

**Success Response (201 Created):**

```json
{
  "data": {
    "id": 1,
    "email": "customer@airline.com",
    "createdAt": "2025-01-07T10:30:00Z",
    "updatedAt": "2025-01-07T10:30:00Z"
  },
  "success": true,
  "message": "Successfully created a new user",
  "err": {}
}
```

**Error Response (400 Bad Request):**

```json
{
  "data": {},
  "success": false,
  "message": "Email or Password are missing in the request",
  "err": {}
}
```

---

#### **2. User Signin (Login)**

```http
POST /api/v1/signin
Content-Type: application/json

{
  "email": "customer@airline.com",
  "password": "SecurePass123"
}
```

**Success Response (201 Created):**

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwi...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "email": "customer@airline.com",
      "roles": ["CUSTOMER"]
    }
  },
  "success": true,
  "message": "Successfully signin a user",
  "err": {}
}
```

**Error Response (401 Unauthorized):**

```json
{
  "data": {},
  "success": false,
  "message": "Invalid email or password",
  "err": {}
}
```

---

#### **3. Token Validation**

```http
GET /api/v1/isAuthenticated
Headers:
  x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "email": "customer@airline.com",
    "roles": ["CUSTOMER"],
    "iat": 1704974400,
    "exp": 1704978000
  },
  "success": true,
  "message": "User Authenticated and token is valid",
  "err": {}
}
```

**Error Response (401 Unauthorized):**

```json
{
  "data": {},
  "success": false,
  "message": "No token provided",
  "err": {}
}
```

---

#### **4. Admin Check Endpoint**

```http
GET /api/v1/isAdmin
Content-Type: application/json
x-access-token: <JWT_TOKEN>

{
  "id": 1
}
```

**Success Response (200 OK):**

```json
{
  "data": {
    "isAdmin": true
  },
  "success": true,
  "message": "User is an admin",
  "err": {}
}
```

**Error Response (403 Forbidden):**

```json
{
  "data": {
    "isAdmin": false
  },
  "success": false,
  "message": "User is not an admin",
  "err": {}
}
```

---

#### **5. Delete User**

```http
DELETE /api/v1/delete/:id
Headers:
  x-access-token: <JWT_TOKEN>
```

**Success Response (201 Created):**

```json
{
  "data": {},
  "success": true,
  "message": "Successfully deleted a user",
  "err": {}
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "data": {},
  "success": false,
  "message": "Not able to delete user",
  "err": "User not found"
}
```

---

### Example: Role-Protected Route (Custom Implementation)

In other microservices consuming AuthService, routes can enforce role requirements:

```javascript
// In Search Service (example)
const requireCustomer = async (req, res, next) => {
    const token = req.headers['x-access-token'];
    const decoded = jwt.verify(token, JWT_KEY);

    if (!decoded.roles.includes('CUSTOMER')) {
        return res.status(403).json({
            message: "Customer role required to search flights"
        });
    }
    next();
};

router.get('/flights', requireCustomer, (req, res) => {
    // Only CUSTOMER role can access
    res.json({ flights: [...] });
});
```

---

## Setup & Installation

### Prerequisites

Before setting up AuthService, ensure you have:

- **Node.js** (v14.x or higher) – [Download](https://nodejs.org/)
- **MySQL** (v5.7 or higher) – [Download](https://dev.mysql.com/downloads/mysql/)
- **Git** – [Download](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/authservice.git
cd authservice
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all packages defined in `package.json`:

- `express` – Web framework
- `sequelize` & `mysql2` – Database ORM
- `jsonwebtoken` – JWT handling
- `bcrypt` – Password hashing
- `dotenv` – Environment variable management

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=airline_auth_db
DB_SYNC=true

# JWT Configuration
JWT_KEY=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=1h

# Bcrypt Configuration
SALT=10
```

**Important:**

- `DB_USER` and `DB_PASSWORD` must match your MySQL credentials
- `JWT_KEY` should be a long, random string (use a password generator)
- Use different keys for development, staging, and production
- Never commit `.env` to version control

### Step 4: Create MySQL Database

```bash
# Open MySQL command line
mysql -u root -p

# Create database
CREATE DATABASE airline_auth_db;

# Verify creation
SHOW DATABASES;
```

Or use MySQL Workbench GUI to create the database.

### Step 5: Run Sequelize Migrations

Migrations create the database schema (Users, Roles, User_Roles tables):

```bash
# Generate migration files (if needed)
npx sequelize-cli migration:generate --name create-tables

# Run all pending migrations
npx sequelize-cli db:migrate
```

**Output:**

```
Sequelize CLI [Node: 18.14.0, CLI: 6.6.3, ORM: 6.37.7]

Migrating 20250805070301-create-user.js
Migrating 20250808111032-create-role.js

Successfully completed.
```

### Step 6: Run Sequelize Seeders

Seeders populate initial data (default roles):

```bash
# Run all seeders
npx sequelize-cli db:seed:all
```

**Output:**

```
Seeders:
  20250808113549-add-roles.js

Successfully seeded.
```

This creates default roles:

- ADMIN
- CUSTOMER
- AIRLINE
- SUPPORT

### Step 7: Start the Server

```bash
npm start
```

**Output:**

```
Server is listening on port http://localhost:3000
```

The server is now running and ready to accept requests!

### Verify Installation

Test the API using curl or Postman:

```bash
# Test server health
curl http://localhost:3000/
# Expected response: "hello"

# Test signup
curl -X POST http://localhost:3000/api/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@airline.com","password":"Test1234"}'

# Expected response:
# {
#   "data": { "id": 1, "email": "test@airline.com", ... },
#   "success": true,
#   "message": "Successfully created a new user"
# }
```

---

## Running the Service

### Development Mode (with auto-reload)

```bash
npm start
```

Uses `nodemon` to automatically reload the server when files change.

### Production Mode

```bash
# Remove nodemon dependency and run directly
node ./src/index.js
```

### Using Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
COPY .env .

EXPOSE 3000

CMD ["node", "./src/index.js"]
```

Build and run:

```bash
docker build -t authservice:1.0 .
docker run -p 3000:3000 --env-file .env authservice:1.0
```

---

## Use Cases in Airline Management System

### 1. **Flight Search Service Protection**

A customer wants to search available flights:

```
1. Client sends search request to API Gateway
2. API Gateway calls AuthService to validate JWT
3. AuthService confirms token is valid, user has CUSTOMER role
4. Search Service receives request with user context
5. Search Service executes flight search on behalf of customer
6. Results returned to client
```

**Without AuthService:** Anyone could search flights, even unauthorized users.

---

### 2. **Booking Creation (Authorization)**

A customer attempts to book a flight:

```
1. Client sends booking request with JWT
2. API Gateway validates JWT, extracts user roles
3. Booking Service checks: user has CUSTOMER role? → YES
4. Booking created for customer
5. Notification Service sends confirmation email
```

**Example:** A user with only AIRLINE role cannot book flights (missing CUSTOMER role).

---

### 3. **Admin-Only Operations**

An admin wants to add a new airline:

```
1. Admin sends request: POST /airlines with JWT token
2. API Gateway validates token, extracts user roles
3. Check: user has ADMIN role? → YES
4. Admin Service creates new airline
5. Operation logged in audit trail
```

**Example:** A regular customer cannot perform this operation (missing ADMIN role).

---

### 4. **Role-Based Feature Access**

Different user types have different features:

| User Type | Can Search Flights | Can Book Flights | Can Manage Flights | Can Manage Users |
| --------- | ------------------ | ---------------- | ------------------ | ---------------- |
| CUSTOMER  | ✓                  | ✓                | ✗                  | ✗                |
| AIRLINE   | ✗                  | ✗                | ✓                  | ✗                |
| ADMIN     | ✓                  | ✓                | ✓                  | ✓                |
| SUPPORT   | ✓                  | ✓                | ✗                  | ✗                |

AuthService ensures each role gets appropriate access.

---

### 5. **Multi-Tenant Support (Future)**

For an airline booking system with multiple tenants:

```
AuthService can be extended to support:
- Tenant-aware JWT claims
- Role definitions per tenant
- Tenant isolation at the database level

Example JWT:
{
  "id": 1,
  "email": "user@airline.com",
  "roles": ["CUSTOMER"],
  "tenant_id": "airline_123"
}
```

---

### 6. **Audit Trail & Compliance**

Log all authentication and authorization events:

```javascript
// Log successful login
user.signIn() → Log: "User 1 logged in at 2025-01-07 10:30:00"

// Log failed login attempt
user.signIn() → Log: "Login failed for user@airline.com at 2025-01-07 10:31:00"

// Log admin actions
admin.createAirline() → Log: "Admin 2 created airline 'Air India'"
```

**Compliance Benefits:**

- Detect suspicious login patterns
- Audit admin actions
- Meet regulatory requirements (SOC 2, GDPR)

---

## Common Development Tasks

### Adding a New Role

```bash
# Create migration
npx sequelize-cli migration:generate --name add-pilot-role

# In migration file:
# INSERT INTO Roles (name) VALUES ('PILOT');

# Run migration
npx sequelize-cli db:migrate
```

### Resetting Database (Development Only)

```bash
# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Drop database
mysql -u root -p -e "DROP DATABASE airline_auth_db;"

# Recreate database
mysql -u root -p -e "CREATE DATABASE airline_auth_db;"

# Re-run migrations
npx sequelize-cli db:migrate
```

---

## Contributing

We welcome contributions! Follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

---

## Support & Contact

For questions, issues, or feature requests:

- **GitHub Issues:** [AuthService Issues](https://github.com/krishsingh120/AuthService.git)
- **Email:** krishsin2254@gmail.com
- **Documentation:** [Full API Docs](https://docs.airline.com/authservice)

---

## Summary

**AuthService** is a production-ready, secure authentication and authorization microservice that:

✓ Centralizes identity and access management  
✓ Uses industry-standard JWT for stateless authentication  
✓ Implements Role-Based Access Control (RBAC)  
✓ Hashes passwords with bcrypt for security  
✓ Scales independently in a microservices architecture  
✓ Provides a clean, layered codebase for maintainability

By isolating authentication logic into AuthService, the Airline Management System achieves better security, scalability, and separation of concerns across all domain services.

---

**Last Updated:** January 7, 2025  
**Version:** 1.0.0