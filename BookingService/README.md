# Booking Service – Airline Management System

A production-grade backend microservice responsible for managing flight bookings, seat reservations, and booking lifecycle events in a distributed Airline Management System.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture & System Design](#architecture--system-design)
- [Core Responsibilities](#core-responsibilities)
- [Booking Flow](#booking-flow)
- [Database Design](#database-design)
- [Folder Structure](#folder-structure)
- [Message Queue (RabbitMQ)](#message-queue-rabbitmq)
- [API Endpoints](#api-endpoints)
- [Setup & Installation](#setup--installation)
- [Use Cases](#use-cases)
- [Technologies](#technologies)

---

## Project Overview

**Booking Service** is a core microservice in an Airline Management System, responsible for:

- **Creating and managing flight bookings** – Handle booking creation, updates, and deletions
- **Seat reservation and allocation** – Manage seat inventory and booking state transitions
- **Coordinating with external services** – Validate flight data and authenticate users through dedicated microservices
- **Asynchronous event publishing** – Publish booking events to message queues for downstream service consumption
- **Maintaining booking lifecycle** – Transition bookings through states: CREATED → CONFIRMED → CANCELLED

The service is designed as a **loosely coupled microservice** within a larger distributed system, communicating through both **synchronous REST APIs** (for critical operations) and **asynchronous messaging** (for event-driven workflows).

---

## Architecture & System Design

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Web/Mobile)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Load Balancer                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       API Gateway                                │
│              (Request routing & rate limiting)                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
┌───────────▼──────────────┐    ┌──────────▼──────────────┐
│   Booking Service        │    │   Other Services       │
│   (This Service)         │    │   - Auth Service       │
│                          │    │   - FlightAndSearch    │
│  - Create Bookings       │    │   - Reminder Service   │
│  - Validate Flights      │    │   - Payment Service    │
│  - Manage Reservations   │    │   - Notification Svc   │
└────────┬─────────────────┘    └────────────────────────┘
         │
         │ (HTTP REST)
         │ Synchronous
         ├─────────────────┬─────────────────┐
         │                 │                 │
    ┌────▼──────┐  ┌──────▼─────┐  ┌───────▼────┐
    │   Auth    │  │  Flight &  │  │   MySQL    │
    │  Service  │  │   Search   │  │  Database  │
    └───────────┘  │  Service   │  └────────────┘
                   └────────────┘
         │
         │ (RabbitMQ - Asynchronous Messaging)
         │ Event-Driven Communication
         │
    ┌────▼──────────────────────────────────┐
    │     Message Queue (RabbitMQ)           │
    │  Events: booking_created, booking_    │
    │  confirmed, booking_cancelled, etc.   │
    └────┬───────────────────────────────────┘
         │
         ├─────────────────┬────────────────┬──────────────┐
         │                 │                │              │
    ┌────▼─────┐  ┌────────▼────┐  ┌──────▼──┐  ┌────────▼──┐
    │ Reminder  │  │ Notification│  │ Payment │  │  Analytics│
    │ Service   │  │   Service   │  │ Service │  │  Service  │
    └───────────┘  └─────────────┘  └─────────┘  └───────────┘
```

### Why Booking Service is a Separate Microservice

1. **Separation of Concerns** – Isolates booking logic from flight search, user authentication, and notifications
2. **Independent Scalability** – Can be scaled independently based on booking volume without affecting other services
3. **Technology Flexibility** – Allows specialized tech stack decisions for high-throughput booking operations
4. **Fault Isolation** – Failures in Booking Service don't cascade to critical services like Auth or Flight Search
5. **Deployment Independence** – Release booking features independently without coordinating other services
6. **Team Autonomy** – Different teams can work on their respective microservices without tight coupling

### Synchronous vs. Asynchronous Communication

#### Synchronous Communication (REST APIs)

Used for **critical, immediate-response operations**:

```
Client Request
    ↓
Booking Service
    ↓ (HTTP REST)
Auth Service → Validate JWT Token → Return User Details
    ↓
FlightAndSearch Service → Check Flight Availability → Return Flight Data
    ↓
Process Booking
    ↓
Return Response to Client
```

**Why synchronous?** – User needs immediate confirmation of booking success/failure before proceeding.

#### Asynchronous Messaging (RabbitMQ)

Used for **event-driven, non-critical operations**:

```
Booking Service
    ↓ (Publish Event to RabbitMQ)
Message Queue (RabbitMQ)
    ├─→ Reminder Service (subscribes) → Send booking reminder email
    ├─→ Notification Service (subscribes) → Send SMS notification
    ├─→ Analytics Service (subscribes) → Log booking metrics
    └─→ Payment Service (subscribes) → Process payment if needed
```

**Why asynchronous?** – These operations don't block the user. If Reminder Service is down, the booking still succeeds.

---

## Core Responsibilities

### 1. **Creating Flight Bookings**

The Booking Service handles the complete booking creation workflow:

- **Validate user authentication** via Auth Service (JWT verification)
- **Verify flight availability** via FlightAndSearch Service
- **Check seat availability** in the local MySQL database
- **Create booking record** with initial state (CREATED)
- **Associate passenger details** with the booking
- **Store transaction data** for audit and reconciliation
- **Publish booking_created event** to RabbitMQ for downstream processing

### 2. **Validating Flight Data**

Before confirming a booking:

- Query FlightAndSearch Service for real-time flight availability
- Verify flight routes, departure/arrival times, and capacity
- Validate seat inventory against the Flight Service
- Return validation errors if flight is no longer available
- Maintain cache of flight metadata to reduce latency

### 3. **Associating Bookings with Authenticated Users**

- Extract user identity from JWT token via Auth Service
- Link booking to authenticated user ID
- Enforce authorization rules (user can only manage their own bookings)
- Maintain audit trail of who created/modified the booking
- Support role-based access (e.g., admin can view all bookings)

### 4. **Managing Booking States**

Bookings transition through a well-defined state machine:

```
CREATED
   ↓
CONFIRMED (after payment/validation)
   ↓
CANCELLED (user-initiated or system-initiated)
```

Each state transition is logged and can trigger downstream events:

- **CREATED** – Booking initiated, awaiting confirmation
- **CONFIRMED** – Booking confirmed and locked (seat allocated)
- **CANCELLED** – Booking cancelled (refund initiated, seat released)

### 5. **Publishing Booking Events to RabbitMQ**

Asynchronously publish events for downstream service consumption:

- `booking.created` – Trigger reminders, notifications, payment processing
- `booking.confirmed` – Confirm seat allocation, update analytics
- `booking.cancelled` – Process refund, release seat, send cancellation notice

Events include complete booking data, allowing services to react independently without querying Booking Service.

---

## Booking Flow

Step-by-step journey of a booking from client request to completion:

```
STEP 1: User Initiates Booking
        │
        └─→ Client submits booking request with:
            - Flight ID, departure/arrival dates
            - Passenger details (name, email, phone)
            - Seat preference (if applicable)

STEP 2: Request Passes Through API Gateway
        │
        └─→ API Gateway performs:
            - Request validation (schema validation)
            - Rate limiting (prevent DDoS)
            - Request routing to Booking Service

STEP 3: Booking Service Validates User Authentication
        │
        └─→ Booking Service queries Auth Service:
            - Verify JWT token from request header
            - Extract user ID and roles
            - Return 401 if token is invalid/expired

STEP 4: Validate Flight Details via FlightAndSearch Service
        │
        └─→ Booking Service queries FlightAndSearch Service:
            - Verify flight exists and is not cancelled
            - Check if flight has available seats
            - Get flight metadata (airline, duration, price)
            - Return 400 if flight is unavailable

STEP 5: Create Booking in MySQL Database
        │
        └─→ Booking Service:
            - Create booking record with state = 'CREATED'
            - Associate booking with authenticated user_id
            - Store passenger details, seat allocation
            - Generate unique booking reference number
            - Commit transaction to MySQL

STEP 6: Publish Booking Event to RabbitMQ
        │
        └─→ Booking Service publishes 'booking.created' event containing:
            - Booking ID, user ID, flight ID
            - Passenger details, seat information
            - Booking timestamp, booking reference

STEP 7: Downstream Services Consume Event Asynchronously
        │
        ├─→ Reminder Service: Schedule booking reminder email
        │
        ├─→ Notification Service: Send SMS confirmation
        │
        ├─→ Analytics Service: Log booking metrics
        │
        └─→ Payment Service: Initiate payment processing

STEP 8: Return Success Response to Client
        │
        └─→ HTTP 201 Created with:
            - Booking ID, booking reference number
            - Confirmation details
            - Next steps for customer
```

---

## Database Design

### Entity-Relationship Model

```
┌──────────────────────────────────────────────────────────────────┐
│                          BOOKING                                 │
├──────────────────────────────────────────────────────────────────┤
│ PK: id (UUID)                                                    │
│ FK: user_id (references User Service)                            │
│ FK: flight_id (references FlightAndSearch Service)               │
│ - booking_reference (UNIQUE, for customer communication)         │
│ - booking_status (CREATED, CONFIRMED, CANCELLED)                │
│ - total_price (decimal)                                          │
│ - created_at, updated_at, cancelled_at                           │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 1 : Many
               │
┌──────────────▼───────────────────────────────────────────────────┐
│                         PASSENGER                                │
├──────────────────────────────────────────────────────────────────┤
│ PK: id (UUID)                                                    │
│ FK: booking_id (references Booking)                              │
│ - first_name, last_name                                          │
│ - email, phone_number                                            │
│ - date_of_birth, passport_number                                 │
│ - is_primary_passenger (boolean)                                 │
│ - created_at                                                     │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 1 : 1
               │
┌──────────────▼───────────────────────────────────────────────────┐
│                           SEAT                                   │
├──────────────────────────────────────────────────────────────────┤
│ PK: id (UUID)                                                    │
│ FK: booking_id (references Booking, nullable)                    │
│ FK: flight_id (references FlightAndSearch Service)               │
│ - seat_number (e.g., "12A")                                      │
│ - is_available (boolean)                                         │
│ - created_at, reserved_at                                        │
└──────────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Normalization** – Separate concerns into distinct entities (Booking, Passenger, Seat)
2. **Referential Integrity** – Use foreign keys to maintain data consistency
3. **Audit Trail** – Track timestamps (created_at, updated_at) for compliance and debugging
4. **Unique Constraints** – Booking reference is unique for customer-facing communication
5. **Status Tracking** – booking_status enables state machine implementation
6. **Soft Deletes** – cancelled_at allows recovery of cancelled bookings without physical deletion

### Ensuring Consistency

- **Transactions** – All booking creation steps (create booking, allocate seats) wrapped in database transactions
- **Constraints** – Foreign key constraints prevent orphaned records
- **Validation** – Business logic in Service layer validates data before persistence
- **Event Sourcing** – All state changes (CREATED → CONFIRMED) logged for audit trail

---

## Folder Structure

```
src/
├── config/                          # Configuration & environment setup
│   ├── config.json                 # Sequelize database configuration
│   └── serverConfig.js             # App-level config (port, RabbitMQ URL, etc.)
│
├── controller/                      # HTTP Request Handlers
│   ├── booking.controller.js        # Handles incoming REST requests
│   └── index.js                     # Export all controllers
│
├── routes/                          # API Route Definitions
│   ├── index.js                     # Main router
│   └── v1/                          # API v1 endpoints
│       └── index.js                 # Version 1 route definitions
│
├── services/                        # Business Logic Layer
│   ├── booking.service.js           # Core booking operations
│   └── index.js                     # Export all services
│
├── repository/                      # Data Access Layer
│   ├── booking.repository.js        # Database queries & ORM interactions
│   └── index.js                     # Export all repositories
│
├── models/                          # Sequelize ORM Models
│   ├── booking.js                   # Booking model definition
│   └── index.js                     # Model associations
│
├── migrations/                      # Database Schema Changes
│   ├── 20250816100206-create-booking.js          # Initial schema
│   └── 20250816110752-modify_bookings_add_new_fields.js  # Schema updates
│
├── seeders/                         # Test Data & Initialization
│   └── (seed files for test data)
│
├── utils/                           # Utility Functions & Helpers
│   ├── messageQueue.js              # RabbitMQ producer/consumer logic
│   ├── errors/
│   │   ├── app.error.js             # Application-level error class
│   │   ├── service.error.js         # Service-specific errors
│   │   └── validation.error.js      # Validation error handling
│   └── index.js                     # Export utilities
│
└── index.js                         # Application entry point
```

### Layered Architecture Explanation

```
HTTP Request
    ↓
┌─────────────────────────────────────────┐
│  CONTROLLER LAYER (booking.controller)  │ ← Parse HTTP request, extract data
│  - Parse request body                   │
│  - Call service methods                 │
│  - Format HTTP response                 │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  SERVICE LAYER (booking.service)        │ ← Business logic & orchestration
│  - Validate business rules              │
│  - Coordinate with external services    │
│  - Call repository for data access      │
│  - Publish events to message queue      │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  REPOSITORY LAYER (booking.repository)  │ ← Data persistence & retrieval
│  - Execute database queries             │
│  - Handle ORM operations                │
│  - Manage transactions                  │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  DATABASE LAYER (MySQL + Sequelize)     │ ← Physical data storage
│  - MySQL tables                         │
│  - Indexes, constraints, triggers       │
└─────────────────────────────────────────┘
```

**Benefits of This Architecture:**

- **Separation of Concerns** – Each layer has a single, well-defined responsibility
- **Testability** – Can mock dependencies and test each layer independently
- **Maintainability** – Changes to database schema don't affect business logic
- **Reusability** – Services can be consumed by multiple controllers or async consumers
- **Scalability** – Easy to add caching layer, implement async processing, etc.

---

## Message Queue (RabbitMQ)

### Why RabbitMQ?

1. **Decoupling** – Booking Service doesn't depend on downstream services being available
2. **Reliability** – Messages persisted until consumed; no data loss even if services are down
3. **Scalability** – Multiple consumer instances can process events in parallel
4. **Flexibility** – New consumers can be added without modifying Booking Service
5. **Asynchronous Processing** – Non-blocking operations improve API response times

### Booking Events Published

#### 1. `booking.created`

**When:** Immediately after booking is successfully created in database

**Payload:**

```json
{
  "event_type": "booking.created",
  "booking_id": "uuid-xxxxx",
  "booking_reference": "BK-20250108-001",
  "user_id": "user-xxxxx",
  "flight_id": "flight-xxxxx",
  "total_price": 299.99,
  "passengers": [
    {
      "id": "passenger-xxxxx",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "is_primary": true
    }
  ],
  "seats": ["12A", "12B"],
  "created_at": "2025-01-08T10:30:00Z"
}
```

**Consumers:**

- **Reminder Service** – Schedule booking confirmation email
- **Notification Service** – Send SMS with booking details
- **Analytics Service** – Track booking metrics
- **Payment Service** – Initiate payment if required

#### 2. `booking.confirmed`

**When:** After payment is successful or booking is manually confirmed

**Payload:**

```json
{
  "event_type": "booking.confirmed",
  "booking_id": "uuid-xxxxx",
  "booking_reference": "BK-20250108-001",
  "user_id": "user-xxxxx",
  "confirmation_timestamp": "2025-01-08T10:35:00Z"
}
```

**Consumers:**

- **Flight Service** – Lock seats in flight inventory
- **Reminder Service** – Schedule pre-flight reminder
- **Analytics Service** – Update booking completion metrics

#### 3. `booking.cancelled`

**When:** Booking is cancelled (user-initiated or system-initiated)

**Payload:**

```json
{
  "event_type": "booking.cancelled",
  "booking_id": "uuid-xxxxx",
  "booking_reference": "BK-20250108-001",
  "user_id": "user-xxxxx",
  "cancellation_reason": "user_requested",
  "cancelled_at": "2025-01-08T10:40:00Z"
}
```

**Consumers:**

- **Flight Service** – Release allocated seats
- **Refund Service** – Process refund
- **Notification Service** – Send cancellation confirmation
- **Analytics Service** – Log cancellation metrics

### Message Queue Architecture

```
Booking Service
    ↓
produces event → RabbitMQ (Broker)
                    ├─ Queue: booking.created
                    ├─ Queue: booking.confirmed
                    └─ Queue: booking.cancelled
                        ↓
                    ┌───────────────────────────────────┐
                    │      Competing Consumers          │
                    ├───────────────────────────────────┤
                    │ Reminder Service (consumer 1,2,3) │
                    │ Notification Svc (consumer 1,2)   │
                    │ Analytics Service (consumer 1,2,3)│
                    │ Payment Service (consumer 1)      │
                    └───────────────────────────────────┘
```

### Reliability & Scalability Benefits

- **Guaranteed Delivery** – RabbitMQ persists messages until acknowledged by consumer
- **Automatic Retries** – Failed messages can be re-queued automatically
- **Consumer Scaling** – Multiple consumers process events in parallel, increasing throughput
- **Fault Tolerance** – If one consumer fails, others continue processing
- **Loose Coupling** – Adding new consumers doesn't affect Booking Service

---

## API Endpoints

### 1. Create a New Booking

**Endpoint:** `POST /api/v1/bookings`

**Description:** Create a new flight booking for authenticated user

**Request Headers:**

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**

```json
{
  "flight_id": "flight-uuid-123",
  "passengers": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "date_of_birth": "1990-05-15",
      "passport_number": "AB123456",
      "is_primary": true
    }
  ],
  "seat_preferences": ["12A", "12B"],
  "special_requests": "Window seat preferred"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "booking_id": "booking-uuid-456",
    "booking_reference": "BK-20250108-001",
    "user_id": "user-uuid-789",
    "flight_id": "flight-uuid-123",
    "status": "CREATED",
    "total_price": 299.99,
    "currency": "USD",
    "passengers_count": 2,
    "allocated_seats": ["12A", "12B"],
    "created_at": "2025-01-08T10:30:00Z",
    "confirmation_url": "/bookings/booking-uuid-456"
  },
  "message": "Booking created successfully. Confirmation email sent."
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "FLIGHT_UNAVAILABLE",
    "message": "Flight is not available or has insufficient seats",
    "details": "Flight ABC123 has only 1 seat available but 2 passengers requested"
  }
}
```

**Status Codes:**

- `201 Created` – Booking successfully created
- `400 Bad Request` – Invalid request data or flight unavailable
- `401 Unauthorized` – JWT token missing/invalid
- `403 Forbidden` – User not authorized for this operation
- `500 Internal Server Error` – Unexpected server error

---

### 2. Get Booking Details

**Endpoint:** `GET /api/v1/bookings/:bookingId`

**Description:** Retrieve detailed information about a specific booking

**Request Headers:**

```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "booking_id": "booking-uuid-456",
    "booking_reference": "BK-20250108-001",
    "user_id": "user-uuid-789",
    "flight_id": "flight-uuid-123",
    "status": "CONFIRMED",
    "total_price": 299.99,
    "currency": "USD",
    "flight_details": {
      "flight_number": "AA100",
      "airline": "American Airlines",
      "departure": "2025-02-15T08:00:00Z",
      "arrival": "2025-02-15T11:30:00Z",
      "origin": "JFK",
      "destination": "LAX"
    },
    "passengers": [
      {
        "passenger_id": "passenger-111",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "seat": "12A"
      }
    ],
    "created_at": "2025-01-08T10:30:00Z",
    "confirmed_at": "2025-01-08T10:35:00Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking with ID booking-uuid-456 not found"
  }
}
```

---

### 3. Get All Bookings for Authenticated User

**Endpoint:** `GET /api/v1/bookings/user/:userId`

**Description:** Retrieve all bookings associated with a specific user

**Request Headers:**

```http
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**

```
?status=CONFIRMED&page=1&limit=10&sort=-created_at
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "booking_id": "booking-uuid-456",
        "booking_reference": "BK-20250108-001",
        "flight_number": "AA100",
        "status": "CONFIRMED",
        "departure": "2025-02-15T08:00:00Z",
        "created_at": "2025-01-08T10:30:00Z"
      },
      {
        "booking_id": "booking-uuid-789",
        "booking_reference": "BK-20250107-042",
        "flight_number": "UA200",
        "status": "CREATED",
        "departure": "2025-03-20T14:00:00Z",
        "created_at": "2025-01-07T15:45:00Z"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

---

### 4. Cancel a Booking

**Endpoint:** `DELETE /api/v1/bookings/:bookingId`

**Description:** Cancel an existing booking and initiate refund process

**Request Headers:**

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body (Optional):**

```json
{
  "cancellation_reason": "schedule_change",
  "comments": "Flight time doesn't work with my schedule"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "booking_id": "booking-uuid-456",
    "booking_reference": "BK-20250108-001",
    "status": "CANCELLED",
    "cancelled_at": "2025-01-08T10:45:00Z",
    "refund_status": "INITIATED",
    "estimated_refund_amount": 299.99,
    "refund_processing_time": "5-7 business days"
  },
  "message": "Booking cancelled successfully. Refund will be processed shortly."
}
```

**Error Response (409 Conflict):**

```json
{
  "success": false,
  "error": {
    "code": "CANNOT_CANCEL_BOOKING",
    "message": "Cannot cancel booking. Departure time is within 24 hours"
  }
}
```

---

### 5. Update Booking Passenger Details

**Endpoint:** `PATCH /api/v1/bookings/:bookingId/passengers/:passengerId`

**Description:** Update passenger information for an existing booking (only if booking status is CREATED)

**Request Headers:**

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@example.com",
  "date_of_birth": "1992-03-22"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "passenger_id": "passenger-111",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "updated_at": "2025-01-08T10:50:00Z"
  }
}
```

---

## Setup & Installation

### Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v14 or higher) – [Download](https://nodejs.org/)
- **npm** (v6 or higher) – Comes with Node.js
- **MySQL** (v5.7 or higher) – [Download](https://www.mysql.com/downloads/)
- **RabbitMQ** (latest stable) – [Download](https://www.rabbitmq.com/download.html)
- **Git** – For cloning the repository

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-organization/booking-service.git
cd booking-service
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies specified in `package.json`:

- Express.js – REST API framework
- Sequelize – ORM for MySQL
- amqplib – RabbitMQ client
- dotenv – Environment variable management
- axios – HTTP client for service communication

### Step 3: Configure MySQL Database

#### Option A: Using Docker (Recommended)

```bash
docker run --name mysql-booking -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=booking_db -p 3306:3306 -d mysql:5.7
```

#### Option B: Manual Installation

1. Install MySQL locally from [mysql.com](https://www.mysql.com/)
2. Create a new database:
   ```sql
   CREATE DATABASE booking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Create a database user:
   ```sql
   CREATE USER 'booking_user'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON booking_db.* TO 'booking_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Step 4: Configure RabbitMQ

#### Option A: Using Docker (Recommended)

```bash
docker run --name rabbitmq -p 5672:5672 -p 15672:15672 -d rabbitmq:3-management
```

RabbitMQ management console will be available at: `http://localhost:15672`

- Default credentials: `guest` / `guest`

#### Option B: Manual Installation

1. Install RabbitMQ from [rabbitmq.com](https://www.rabbitmq.com/download.html)
2. Start RabbitMQ service:

   ```bash
   # On Windows
   net start RabbitMQ

   # On macOS
   brew services start rabbitmq

   # On Linux
   sudo systemctl start rabbitmq-server
   ```

### Step 5: Create Environment Configuration (.env)

Create a `.env` file in the project root:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=booking_user
DB_PASSWORD=secure_password
DB_NAME=booking_db

# JWT & Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=24h

# External Service URLs
AUTH_SERVICE_URL=http://localhost:3000/api/v1
FLIGHT_SERVICE_URL=http://localhost:3002/api/v1

# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_PREFETCH=10

# Message Queue Exchanges & Queues
RABBITMQ_EXCHANGE=booking_events
RABBITMQ_QUEUE_BOOKING_CREATED=booking.created
RABBITMQ_QUEUE_BOOKING_CONFIRMED=booking.confirmed
RABBITMQ_QUEUE_BOOKING_CANCELLED=booking.cancelled
```

### Step 6: Initialize Database (Sequelize Migrations)

Run migrations to create database schema:

```bash
npx sequelize-cli db:migrate
```

This will execute all migration files in `src/migrations/` in order:

1. `20250816100206-create-booking.js` – Creates Booking, Passenger, Seat tables
2. `20250816110752-modify_bookings_add_new_fields.js` – Adds new fields

### Step 7: (Optional) Seed Database with Test Data

```bash
npx sequelize-cli db:seed:all
```

This populates the database with test data for development.

To roll back seeds:

```bash
npx sequelize-cli db:seed:undo:all
```

### Step 8: Start the Booking Service

Development mode (with auto-reload):

```bash
npm start
```

Production mode:

```bash
NODE_ENV=production node src/index.js
```

Expected output:

```
Booking Service running on port 3001
Database connected successfully
RabbitMQ connection established
✓ Service is ready to accept requests
```

### Step 9: Verify Service Health

```bash
# Check if service is running
curl http://localhost:3001/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-08T11:00:00Z",
  "uptime_seconds": 45
}
```

---

## Use Cases

### 1. Customer Flight Booking

**Scenario:** A customer wants to book a flight through the web application.

**Flow:**

1. Customer logs in to the web application (Auth Service validates credentials)
2. Customer searches for flights (FlightAndSearch Service returns available flights)
3. Customer selects flight and enters passenger details
4. Web app calls Booking Service `POST /bookings` endpoint
5. Booking Service:
   - Validates user (JWT token)
   - Validates flight availability
   - Creates booking record
   - Allocates seats
   - Publishes `booking.created` event
6. Downstream services consume event:
   - Reminder Service sends confirmation email
   - Notification Service sends SMS
   - Analytics Service logs booking metric
7. Customer receives confirmation and booking reference

---

### 2. Managing Booking Lifecycle

**Scenario:** Customer needs to view, modify, or cancel their booking.

**Operations:**

- **View Booking:** Customer calls `GET /bookings/:id` to view booking details, flight info, passenger list, and seat allocation

- **Modify Passenger Info:** Before flight departure, customer can call `PATCH /bookings/:id/passengers/:passengerId` to update passenger details (only if booking status is CREATED)

- **Cancel Booking:** Customer calls `DELETE /bookings/:id` to cancel. Booking Service:
  - Updates booking status to CANCELLED
  - Publishes `booking.cancelled` event
  - Downstream services: Process refund, release seats, send cancellation notice
  - Customer receives refund confirmation

---

### 3. Triggering Downstream Processes

**Scenario:** Multiple services need to respond to booking events without tight coupling.

**Event-Driven Flow:**

```
1. Booking Service creates booking
   ↓
2. Publishes booking.created event to RabbitMQ
   ↓
3. Reminder Service consumes event
   └─→ Schedules reminder email 24 hours before departure
   ↓
4. Notification Service consumes event
   └─→ Sends SMS confirmation to passenger phone
   ↓
5. Analytics Service consumes event
   └─→ Updates booking metrics dashboard
   ↓
6. Payment Service consumes event
   └─→ Processes payment and updates payment status
```

**Benefits:**

- Booking Service doesn't wait for downstream services
- If Reminder Service is down, booking still succeeds
- New services can be added without modifying Booking Service
- Asynchronous processing improves API response times

---

### 4. Maintaining Consistency Across Microservices

**Scenario:** Ensure booking data remains consistent even with distributed system.

**Consistency Mechanisms:**

- **Database Transactions:** All booking creation steps (create record, allocate seat) wrapped in transaction
- **Event Sourcing:** All state changes (CREATED → CONFIRMED → CANCELLED) logged with timestamps
- **Idempotency:** Booking Service accepts duplicate requests and returns same booking reference (prevents double booking)
- **Eventual Consistency:** Seat availability eventually consistent across FlightAndSearch Service
- **Dead Letter Queue:** Failed events sent to DLQ for manual intervention

---

### 5. Auditing & Compliance

**Scenario:** Financial audit requires tracking of all booking transactions.

**Audit Trail:**

- Booking Service maintains:

  - Who created the booking (user_id)
  - When it was created (created_at)
  - When it was modified (updated_at)
  - Cancellation timestamp and reason (cancelled_at, cancellation_reason)
  - All state transitions logged with timestamps

- Historical queries:

  ```sql
  SELECT * FROM bookings WHERE user_id = 'user-123' ORDER BY created_at DESC;
  ```

- Generate audit reports:
  ```sql
  SELECT DATE(created_at), COUNT(*) as bookings_count, SUM(total_price) as total_revenue
  FROM bookings
  WHERE booking_status = 'CONFIRMED'
  GROUP BY DATE(created_at);
  ```

---

## Technologies

### Core Framework & Runtime

- **Node.js** – JavaScript runtime for backend services
- **Express.js** – Lightweight web framework for REST APIs
- **npm** – Package manager for Node.js dependencies

### Database & ORM

- **MySQL** – Relational database for persistent data storage
- **Sequelize** – Promise-based ORM for database operations
- **sequelize-cli** – CLI tool for migrations and seeders

### Message Queue

- **RabbitMQ** – Message broker for asynchronous event publishing
- **amqplib** – Node.js AMQP client for RabbitMQ communication

### External Communication

- **axios** – HTTP client for synchronous microservice communication
- **JWT (JSON Web Tokens)** – Secure user authentication & authorization

### Development & Utilities

- **dotenv** – Environment variable management
- **morgan** – HTTP request logging middleware
- **body-parser** – HTTP request body parsing
- **http-status-codes** – HTTP status code constants
- **nodemon** – Auto-restart development server on file changes

---

## Contributing

### Development Workflow

1. Create a new feature branch:

   ```bash
   git checkout -b feature/new-booking-feature
   ```

2. Make changes following the layered architecture:

   - Update controller if API interface changes
   - Update service if business logic changes
   - Update repository if database access changes
   - Update models if data schema changes

3. Run tests:

   ```bash
   npm test
   ```

4. Commit with descriptive messages:

   ```bash
   git commit -m "feat: add refund processing for cancelled bookings"
   ```

5. Push and create Pull Request:
   ```bash
   git push origin feature/new-booking-feature
   ```

---

## Support & Contact

For issues, questions, or feature requests:

- **GitHub Issues:** [Booking Issues](https://github.com/krishsingh120/BookingService.git)
- **Email:** krishsin2254@gmail.com
- **Documentation:** [Full API Docs](https://docs.airline.com/Bookingservice)
---

## Changelog

### v1.0.0 (2025-01-08)

- Initial release
- Core booking creation, retrieval, and cancellation APIs
- RabbitMQ event publishing for downstream services
- MySQL database with Sequelize ORM
- JWT authentication via Auth Service
- Flight validation via FlightAndSearch Service