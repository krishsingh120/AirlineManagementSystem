# Reminder Service – Airline Management System

> A robust, event-driven microservice responsible for managing scheduled notifications and email reminders in a distributed Airline Management System.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Core Responsibilities](#core-responsibilities)
- [Reminder Flow](#reminder-flow)
- [Database Design](#database-design)
- [Folder Structure](#folder-structure)
- [Message Queue Architecture](#message-queue-architecture)
- [Email Notification System](#email-notification-system)
- [API Endpoints](#api-endpoints)
- [Setup & Installation](#setup--installation)
- [Environment Configuration](#environment-configuration)
- [Running the Service](#running-the-service)
- [Use Cases](#use-cases)
- [Design Decisions](#design-decisions)

---

## 📌 Project Overview

**Reminder Service** is a backend microservice within the Airline Management System that provides asynchronous, event-driven notification delivery. The service consumes booking and flight-related events from RabbitMQ, schedules reminders using cron jobs, and delivers time-sensitive notifications via email.

### Key Capabilities

- **Asynchronous Event Processing**: Consumes messages from RabbitMQ without blocking other services
- **Scheduled Notifications**: Uses `node-cron` to trigger reminders at specific times
- **Email Delivery**: Integrates with Nodemailer for reliable email transmission
- **Persistent State Tracking**: Maintains reminder status and delivery history in MySQL
- **Fault Tolerance**: Handles failures gracefully with retry mechanisms and detailed logging
- **Microservice Integration**: Operates independently while seamlessly integrating with other airline management services

### Why Separate Microservice?

1. **Decoupling**: Prevents email delivery failures from impacting core booking or flight services
2. **Scalability**: Can scale independently based on notification volume without affecting other services
3. **Single Responsibility**: Focuses exclusively on reminder management and delivery
4. **Async Processing**: Offloads time-consuming operations (email sending, cron scheduling) from the main application flow
5. **Maintainability**: Isolated codebase makes it easier to maintain and update notification logic

---

## 🏗️ System Architecture

### High-Level Architecture (HLD)

```
┌─────────────────────────────────────────────────────────────┐
│                   AIRLINE MANAGEMENT SYSTEM                  │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   Booking Service    │
                    │   Flight Service     │
                    │   User Service       │
                    └──────────┬───────────┘
                               │
                    Event Publishing
                               │
                    ┌──────────▼───────────┐
                    │    RabbitMQ          │
                    │   (AMQP Broker)      │
                    │                      │
                    │ Exchange: AIRLINES   │
                    │ Queue: REMINDER_QUEUE│
                    │ RoutingKey: reminder.*
                    └──────────┬───────────┘
                               │
                    Event Consumption
                               │
                    ┌──────────▼────────────────┐
                    │  REMINDER SERVICE         │
                    │  (This Service)           │
                    │                          │
                    │  • Event Consumer        │
                    │  • Cron Scheduler        │
                    │  • Email Dispatcher      │
                    │  • Status Manager        │
                    └──────────┬────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │  MySQL Database      │
                    │  (NotificationTicket)│
                    └──────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Nodemailer / Gmail   │
                    │ (Email Provider)     │
                    └──────────────────────┘
```

### Client-Facing Access (via API Gateway)

```
┌──────────────────────────────────────┐
│   Client (Web/Mobile)                │
│   Monitoring Dashboard               │
└──────────────┬───────────────────────┘
               │
    ┌──────────▼──────────┐
    │  Load Balancer      │
    │  (SSL Termination)  │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  API Gateway        │
    │  (Route /api/v1)    │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────────┐
    │  Reminder Service       │
    │  (Health/Status Checks) │
    └─────────────────────────┘
```

### Why RabbitMQ for Asynchronous Communication?

| Benefit            | Details                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------- |
| **Decoupling**     | Services don't depend on real-time availability of each other                             |
| **Reliability**    | Messages are persisted on the broker; even if Reminder Service is down, events are queued |
| **Scalability**    | Multiple Reminder Service instances can consume from the same queue for load distribution |
| **Ordering**       | Messages are processed in FIFO order within a queue                                       |
| **Error Handling** | Dead Letter Queues (DLQ) can capture failed messages for manual intervention              |

---

## 🛠️ Tech Stack

| Component              | Technology | Version | Purpose                                  |
| ---------------------- | ---------- | ------- | ---------------------------------------- |
| **Runtime**            | Node.js    | ^18.0   | JavaScript runtime environment           |
| **Web Framework**      | Express.js | ^5.1.0  | HTTP server and routing                  |
| **Database**           | MySQL      | 8.0+    | Relational data persistence              |
| **ORM**                | Sequelize  | ^6.37.7 | Object-relational mapping and migrations |
| **Message Broker**     | RabbitMQ   | 3.12+   | Event-driven message queue               |
| **AMQP Client**        | amqplib    | ^0.10.9 | RabbitMQ client library                  |
| **Job Scheduling**     | node-cron  | ^4.2.1  | Cron job scheduling for reminders        |
| **Email Service**      | Nodemailer | ^7.0.6  | SMTP-based email delivery                |
| **Environment Config** | dotenv     | ^17.2.2 | Environment variable management          |
| **Process Monitor**    | Nodemon    | dev     | Development hot-reload                   |

---

## 🎯 Core Responsibilities

### 1. Event Consumption from RabbitMQ

The Reminder Service subscribes to specific event types published by other microservices:

- **Event Types**:

  - `booking.confirmed` → Send booking confirmation reminder
  - `flight.created` → Send flight details reminder
  - `notification.request` → Handle generic notification requests

- **How It Works**:
  - Establishes a persistent connection to RabbitMQ
  - Binds to the `REMINDER_QUEUE` with routing keys like `reminder.*`
  - Receives messages asynchronously without blocking
  - Automatically acknowledges messages after processing

---

### 2. Persistent Data Storage

Stores reminder metadata in the `NotificationTicket` table:

- **What Gets Stored**:

  - Email subject and body
  - Recipient email address
  - Scheduled notification time
  - Current status (PENDING, SUCCESS, FAILED)
  - Retry count and timestamps

- **Why It Matters**:
  - Enables audit trails and compliance tracking
  - Allows status monitoring and analytics
  - Supports retry mechanisms for failed notifications
  - Provides historical data for reporting

---

### 3. Scheduling with node-cron

Uses cron expressions to trigger reminders at specific times:

- **Cron Job Responsibilities**:

  - Poll the database every minute for PENDING reminders
  - Identify reminders that match the current timestamp
  - Trigger email delivery for matching reminders
  - Update reminder status in the database

- **Example Cron Pattern**:
  ```
  '0 */12 * * *'  // Every 12 hours
  '0 9 * * MON'   // Every Monday at 9 AM
  '*/5 * * * *'   // Every 5 minutes (for testing)
  ```

---

### 4. Email Delivery via Nodemailer

Sends emails using Gmail SMTP:

- **Email Configuration**:

  - Provider: Gmail SMTP
  - Authentication: App-specific password
  - Transport: TLS encryption

- **Email Content**:

  - Subject: Customizable reminder title
  - Body: Detailed reminder content (HTML or plain text)
  - From: System email address
  - To: User's email address

- **Error Handling**:
  - Logs failures for debugging
  - Records FAILED status in database
  - Supports manual retry operations

---

### 5. Graceful Failure Handling

Implements mechanisms to handle notification failures:

- **Retry Strategy**:

  - Mark failed reminders with FAILED status
  - Store retry count and error details
  - Admin panel can manually trigger retries

- **Logging**:
  - All operations logged to console and logs
  - Error stack traces captured for debugging
  - Message content logged for audit purposes

---

## 📊 Reminder Flow

### Step-by-Step Process

```
┌─ Step 1: Event Published
│  Booking Service: New booking confirmed
│  → Publishes to RabbitMQ AIRLINES exchange
│  Message: { service: "CREATE_TICKET", data: { ... } }
│
├─ Step 2: Event Consumed
│  Reminder Service: Message Queue Consumer
│  → Reads message from REMINDER_QUEUE
│  → Parses JSON payload
│
├─ Step 3: Data Persistence
│  Service Layer: Email Service
│  → Validates incoming data
│  → Creates NotificationTicket record
│  Status: PENDING
│  notificationTime: Set for future delivery
│
├─ Step 4: Scheduling
│  Cron Job: Every minute
│  → Queries database for PENDING reminders
│  → Checks if notificationTime <= current time
│
├─ Step 5: Email Trigger
│  When scheduled time arrives:
│  → Retrieve reminder details from database
│  → Prepare email with subject and content
│  → Call Nodemailer sendMail()
│
├─ Step 6: Delivery
│  Nodemailer:
│  → Connects to Gmail SMTP
│  → Authenticates with credentials
│  → Sends email to recepientEmail
│
└─ Step 7: Status Update
   Success Path:
   → Update status to "SUCCESS"
   → Record delivery timestamp

   Failure Path:
   → Update status to "FAILED"
   → Log error message
   → Queue for manual retry
```

### Code Flow Example

```javascript
// 1. RabbitMQ Consumer receives message
subscribeMessage(channel, emailService.subscribeEvent, "reminder.booking");

// 2. Service processes event
await emailService.createNotification({
  subject: "Booking Confirmation",
  content: "Your booking is confirmed",
  recepientEmail: "user@airline.com",
  notificationTime: "2025-01-09T14:30:00Z",
});

// 3. Cron job triggers every minute
cron.schedule("*/1 * * * *", async () => {
  const pendingEmails = await emailService.fetchPendingEmails();
  for (let email of pendingEmails) {
    if (new Date(email.notificationTime) <= new Date()) {
      // 4. Send email
      await emailService.sendBasicMail(
        "reminder@airline.com",
        email.recepientEmail,
        email.subject,
        email.content
      );
      // 5. Update status
      await emailService.updateTicket(email.id, { status: "SUCCESS" });
    }
  }
});
```

---

## 💾 Database Design

### NotificationTicket Table

This is the primary table for storing reminder information:

```sql
CREATE TABLE NotificationTickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subject VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  recepientEmail VARCHAR(255) NOT NULL,
  status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
  notificationTime DATETIME NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Field Descriptions

| Field              | Type         | Purpose                                          |
| ------------------ | ------------ | ------------------------------------------------ |
| `id`               | INT          | Primary key, unique identifier                   |
| `subject`          | VARCHAR(255) | Email subject line                               |
| `content`          | LONGTEXT     | Email body (supports HTML)                       |
| `recepientEmail`   | VARCHAR(255) | Recipient's email address                        |
| `status`           | ENUM         | Current delivery status (PENDING/SUCCESS/FAILED) |
| `notificationTime` | DATETIME     | When the reminder should be sent                 |
| `createdAt`        | TIMESTAMP    | Record creation timestamp                        |
| `updatedAt`        | TIMESTAMP    | Last update timestamp                            |

### Why This Design?

- **Status Tracking**: Easily identify which reminders are pending, sent, or failed
- **Temporal Queries**: Quick filtering by `notificationTime` for scheduled reminders
- **Audit Trail**: `createdAt` and `updatedAt` provide full history
- **Scalability**: Simple structure allows easy indexing on frequently queried fields
- **Extensibility**: Can add fields like `retryCount`, `bookingId`, `userId` for more complex logic

### Index Recommendations

```sql
-- For efficient status queries
CREATE INDEX idx_status ON NotificationTickets(status);

-- For efficient time-based queries
CREATE INDEX idx_notificationTime ON NotificationTickets(notificationTime);

-- For combined queries
CREATE INDEX idx_status_time ON NotificationTickets(status, notificationTime);
```

### Future Schema Extensions

```sql
-- Support for multiple retry attempts
ALTER TABLE NotificationTickets ADD COLUMN retryCount INT DEFAULT 0;

-- Link reminders to business entities
ALTER TABLE NotificationTickets ADD COLUMN bookingId VARCHAR(36);
ALTER TABLE NotificationTickets ADD COLUMN userId VARCHAR(36);

-- Track who created the reminder
ALTER TABLE NotificationTickets ADD COLUMN createdBy VARCHAR(255);

-- Store error details
ALTER TABLE NotificationTickets ADD COLUMN errorMessage LONGTEXT;
```

---

## 📁 Folder Structure

```
src/
├── config/                      # Configuration files
│   ├── config.json             # Static configurations
│   ├── server.config.js        # Server settings (PORT, DB, etc.)
│   └── email.config.js         # Nodemailer transport setup
│
├── controller/                  # Request handlers
│   └── ticket.controller.js    # HTTP endpoint handlers for reminders
│
├── migrations/                  # Database migration scripts
│   └── 20250914161512-create-notification-ticket.js
│
├── models/                      # Sequelize ORM models
│   ├── index.js                # Model loader and associations
│   └── notificationticket.js   # NotificationTicket model definition
│
├── repository/                  # Data access layer
│   ├── index.js                # Repository exports
│   └── ticket.repository.js    # CRUD operations for reminders
│
├── routes/                      # API route definitions
│   ├── index.js                # Route aggregator
│   └── v1/
│       └── index.js            # v1 API routes (/api/v1/tickets)
│
├── service/                     # Business logic layer
│   └── email.service.js        # Notification, email, and cron logic
│
├── utils/                       # Utility functions
│   ├── index.js                # Utility exports
│   ├── messageQueue.js         # RabbitMQ connection and pub/sub
│   └── job.js                  # Cron job definitions
│
├── index.js                     # Server entry point
└── .env                        # Environment variables (not committed)
```

### Layered Architecture Explanation

#### 1. **Route Layer** (`routes/`)

- **Responsibility**: Define HTTP endpoints and map requests to controllers
- **Example**: `POST /api/v1/tickets` → Call `ticketController.create`
- **Why Separate**: Cleanly separates API contracts from business logic

#### 2. **Controller Layer** (`controller/`)

- **Responsibility**: Handle HTTP requests, validate inputs, call services, format responses
- **Example**:
  ```javascript
  create(req, res) {
    const response = await emailService.createNotification(req.body);
    res.status(201).json(response);
  }
  ```
- **Why Separate**: Isolates HTTP concerns from business logic

#### 3. **Service Layer** (`service/`)

- **Responsibility**: Core business logic, orchestration, event handling
- **Example**:
  ```javascript
  subscribeEvent(payload) {  // Handle RabbitMQ messages
    switch(payload.service) {
      case 'CREATE_TICKET': await createNotification(payload.data);
    }
  }
  ```
- **Why Separate**: Can be reused by controllers, job schedulers, and message consumers

#### 4. **Repository Layer** (`repository/`)

- **Responsibility**: Database access only (CRUD operations)
- **Example**:
  ```javascript
  createTicket(data) {      // INSERT
  get(filter)               // SELECT with filters
  update(id, data)          // UPDATE
  ```
- **Why Separate**: Abstracts database queries; easy to swap databases or add caching

#### 5. **Model Layer** (`models/`)

- **Responsibility**: Sequelize ORM model definitions
- **Defines**: Table structure, field types, validations
- **Why Separate**: Sequelize uses models for migrations and queries

#### 6. **Config Layer** (`config/`)

- **Responsibility**: Centralized configuration management
- **Contains**: Database credentials, email settings, RabbitMQ URLs
- **Why Separate**: Easy environment switching (dev/staging/prod) without code changes

#### 7. **Utils Layer** (`utils/`)

- **Responsibility**: Shared utilities and helper functions
- **Examples**:
  - `messageQueue.js`: RabbitMQ client setup
  - `job.js`: Cron job scheduler
- **Why Separate**: Reusable across multiple services

### Data Flow Through Layers

```
HTTP Request
    ↓
Route (routes/v1/index.js)
    ↓
Controller (ticket.controller.js)
    ↓
Service (email.service.js) ← Triggered by RabbitMQ consumer OR HTTP request
    ↓
Repository (ticket.repository.js)
    ↓
Model (notificationticket.js) ← Sequelize ORM
    ↓
Database (MySQL)
```

---

## 📨 Message Queue Architecture

### RabbitMQ Concepts (High-Level)

#### **Producer** (Booking Service, Flight Service)

- Publishes events to the AIRLINES exchange
- Specifies a routing key (e.g., `reminder.booking.confirmed`)
- Doesn't know or care about subscribers

#### **Exchange** (AIRLINES)

- Acts as a message router
- Uses `direct` exchange type: routes messages based on exact routing key match
- Type `direct`: Message goes to queues whose binding key exactly matches the routing key

#### **Queue** (REMINDER_QUEUE)

- Temporary storage for messages
- Messages persist here even if the Reminder Service is down
- Messages are consumed in FIFO order

#### **Binding**

- Links a Queue to an Exchange with a specific routing key
- Example: Bind `REMINDER_QUEUE` to `AIRLINES` exchange with key `reminder.*`

#### **Consumer** (Reminder Service)

- Connects to the Queue
- Reads and processes messages
- Acknowledges messages after processing (tells RabbitMQ: "I handled this")

### RabbitMQ Flow in Reminder Service

```javascript
// Step 1: Create connection and channel
const channel = await createChannel(); // Connects to RabbitMQ
// Asserts exchange exists: AIRLINES (type: direct)

// Step 2: Subscribe to messages
subscribeMessage(channel, emailService.subscribeEvent, "reminder.booking");
// Asserts REMINDER_QUEUE exists
// Binds REMINDER_QUEUE to AIRLINES exchange with key 'reminder.booking'
// Consumes messages continuously

// Step 3: Process message
channel.consume(queue, (msg) => {
  const payload = JSON.parse(msg.content.toString());
  emailService.subscribeEvent(payload); // Handle the event
  channel.ack(msg); // Acknowledge: mark as processed
});
```

### Why Message-Based Communication?

| Scenario                        | Without RabbitMQ            | With RabbitMQ                                   |
| ------------------------------- | --------------------------- | ----------------------------------------------- |
| Booking Service publishes event | Direct HTTP to Reminder     | Publish to queue                                |
| Reminder Service is down        | Request fails, user lost    | Message queued, processed when service recovers |
| High volume of bookings         | Synchronous bottleneck      | Async, decoupled scaling                        |
| Debugging failures              | Lost information            | Messages persisted in queue for inspection      |
| Adding new subscriber           | Booking Service code change | New service subscribes to same queue            |

### Dead Letter Queue (DLQ) Pattern

For production, implement DLQ for failed messages:

```javascript
// Optional: Setup DLQ for failed messages
const dlqName = "REMINDER_DLQ";
await channel.assertQueue(dlqName);
await channel.bindQueue(dlqName, EXCHANGE_NAME, "reminder.dead_letter");

// In consumer error handler
channel.nack(msg, false, false); // Move to DLQ instead of requeuing
```

---

## 📧 Email Notification System

### Nodemailer Configuration

**File**: [src/config/email.config.js](src/config/email.config.js)

```javascript
const nodemailer = require("nodemailer");

const sender = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_ID, // Gmail address
    pass: process.env.EMAIL_PASS, // Gmail app password
  },
});
```

### Why Gmail SMTP?

- **Reliability**: Gmail infrastructure ensures high deliverability
- **Free Tier**: Sufficient for moderate email volumes
- **Security**: TLS encryption, spam protection
- **Integration**: Easy setup with standard SMTP

### How Email Sending Works

```javascript
// Step 1: Service retrieves reminder from database
const ticket = await repo.get({ id: reminderId });

// Step 2: Prepare email content
const mailOptions = {
  from: "reminder@airline.com",
  to: ticket.recepientEmail, // User's email
  subject: ticket.subject, // e.g., "Flight Reminder: UA234"
  text: ticket.content, // e.g., "Your flight departs in 2 hours"
};

// Step 3: Send via Nodemailer
await sender.sendMail(mailOptions);

// Step 4: Update database status
await repo.update(reminderId, { status: "SUCCESS" });
```

### Email Template Examples

#### **Booking Confirmation**

```
Subject: Your Booking Confirmation - Flight UA234

Dear John,

Thank you for booking with Airline Management System.

Booking Details:
- Confirmation #: BK123456789
- Flight: UA234 (New York → London)
- Date: January 20, 2025
- Departure: 2:30 PM EST
- Seat: 12A

Please arrive 2 hours before departure.

Best regards,
Airline Management System
```

#### **Flight Reminder (24 hours before)**

```
Subject: Reminder: Your Flight UA234 Departs Tomorrow

Dear John,

Your flight is departing tomorrow!

Flight Details:
- Flight: UA234 (New York → London)
- Date: January 20, 2025
- Departure: 2:30 PM EST
- Terminal: 4
- Gate: TBA (Check online 2 hours before departure)

Check-in opens 24 hours before departure.

Safe travels!
```

### Handling Email Failures

```javascript
try {
  await sender.sendMail(mailOptions);
  // Success - update status
  await repo.update(id, { status: "SUCCESS" });
} catch (error) {
  // Failure scenarios
  console.log("Email send failed:", error.message);

  // Determine if retryable
  if (error.code === "ECONNREFUSED") {
    // Network error - likely temporary, safe to retry
    await repo.update(id, {
      status: "FAILED",
      retryCount: existingCount + 1,
    });
  } else if (error.message.includes("invalid recipient")) {
    // Invalid email - don't retry
    await repo.update(id, { status: "FAILED_PERMANENT" });
  }
}
```

### Email Delivery Best Practices

1. **Validate Email Addresses**: Before storing in database
2. **Use Authentication**: App-specific passwords, not plain passwords
3. **Implement Logging**: Log all email operations for audit trail
4. **Handle Bounces**: Set up bounce notifications from email provider
5. **Monitor Delivery**: Track open/click rates via email provider APIs
6. **Rate Limiting**: Don't send more than provider's limit (Gmail: ~50/second)
7. **HTML Templates**: Use professional HTML templates instead of plain text
8. **Unsubscribe Links**: Always include unsubscribe mechanism for compliance (CAN-SPAM)

---

## 🔌 API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### 1. Create Reminder / Ticket

**Endpoint**: `POST /tickets`

**Request**:

```bash
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Flight Reminder",
    "content": "Your flight UA234 departs in 2 hours",
    "recepientEmail": "john.doe@example.com",
    "notificationTime": "2025-01-15T14:30:00Z"
  }'
```

**Request Body**:

```json
{
  "subject": "string (required)", // Email subject
  "content": "string (required)", // Email body
  "recepientEmail": "string (required)", // Valid email address
  "notificationTime": "string (required)" // ISO 8601 datetime
}
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": 15,
    "subject": "Flight Reminder",
    "content": "Your flight UA234 departs in 2 hours",
    "recepientEmail": "john.doe@example.com",
    "status": "PENDING",
    "notificationTime": "2025-01-15T14:30:00Z",
    "createdAt": "2025-01-13T10:15:00Z",
    "updatedAt": "2025-01-13T10:15:00Z"
  },
  "message": "Successfully registered an email reminder.",
  "err": {}
}
```

**Error Response** (500 Internal Server Error):

```json
{
  "success": false,
  "data": {},
  "message": "Unable to register an email reminder.",
  "err": {
    "name": "SequelizeValidationError",
    "message": "Validation error: recepientEmail cannot be null"
  }
}
```

**When Used**:

- Called by other services via REST API when direct RabbitMQ integration isn't available
- Called by monitoring dashboards to create ad-hoc reminders
- Called by admin panels for manual reminder creation

---

### 2. Get Reminder by ID

**Endpoint**: `GET /tickets/:id`

**Request**:

```bash
curl http://localhost:3000/api/v1/tickets/15
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": 15,
    "subject": "Flight Reminder",
    "content": "Your flight UA234 departs in 2 hours",
    "recepientEmail": "john.doe@example.com",
    "status": "SUCCESS",
    "notificationTime": "2025-01-15T14:30:00Z",
    "createdAt": "2025-01-13T10:15:00Z",
    "updatedAt": "2025-01-15T14:30:15Z"
  },
  "message": "Successfully retrieved reminder.",
  "err": {}
}
```

**Not Found Response** (404 Not Found):

```json
{
  "success": false,
  "data": null,
  "message": "Reminder not found.",
  "err": {}
}
```

**When Used**:

- Monitoring dashboard queries reminder status
- Admin checks delivery history
- Troubleshooting failed reminders

---

### 3. Health Check / Service Status

**Endpoint**: `GET /health`

**Request**:

```bash
curl http://localhost:3000/health
```

**Success Response** (200 OK):

```json
{
  "status": "healthy",
  "timestamp": "2025-01-13T10:20:00Z",
  "service": "Reminder Service",
  "version": "1.0.0",
  "uptime": 3600,
  "database": "connected",
  "messageQueue": "connected"
}
```

**When Used**:

- Load balancer health checks
- Kubernetes readiness probes
- Monitoring alerts
- Service dependency checks

---

### 4. List All Pending Reminders

**Endpoint**: `GET /tickets/status/pending`

**Request**:

```bash
curl "http://localhost:3000/api/v1/tickets/status/pending?limit=10&offset=0"
```

**Query Parameters**:

```
limit:  number (default: 50)     // Max records to return
offset: number (default: 0)      // Pagination offset
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "subject": "Flight Reminder",
      "status": "PENDING",
      "notificationTime": "2025-01-15T14:30:00Z",
      "createdAt": "2025-01-13T10:15:00Z"
    },
    {
      "id": 16,
      "subject": "Booking Confirmation",
      "status": "PENDING",
      "notificationTime": "2025-01-14T09:00:00Z",
      "createdAt": "2025-01-13T11:00:00Z"
    }
  ],
  "count": 2,
  "message": "Successfully retrieved pending reminders."
}
```

**When Used**:

- Monitoring dashboard shows pending reminders
- Admin manually triggers sending for overdue reminders
- Debugging why reminders weren't sent

---

### API vs. Message Queue: When to Use Which?

| Use Case                    | API Call | RabbitMQ Message |
| --------------------------- | -------- | ---------------- |
| Real-time response needed   | ✓        | ✗                |
| Decoupled services required | ✗        | ✓                |
| High throughput events      | ✗        | ✓                |
| Admin/Dashboard action      | ✓        | ✗                |
| Booking service event       | ✗        | ✓                |
| Manual reminder creation    | ✓        | ✗                |
| Error visibility required   | ✓        | ✗                |

---

## 🚀 Setup & Installation

### Prerequisites

Ensure you have installed:

- **Node.js** (v18.0 or higher)
- **npm** (v8.0 or higher)
- **MySQL** (v8.0 or higher)
- **RabbitMQ** (v3.12 or higher)
- **Git**

**Verification**:

```bash
node --version       # v18.x.x
npm --version        # 8.x.x
mysql --version      # 8.0.x
rabbitmq-server --version  # 3.12.x
```

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/airline-management/reminder-service.git
cd reminder-service
```

---

### Step 2: Install Dependencies

```bash
npm install
```

This installs all packages defined in [package.json](package.json):

- Express.js for HTTP routing
- Sequelize ORM for database
- amqplib for RabbitMQ
- node-cron for scheduling
- Nodemailer for email

---

### Step 3: Configure MySQL Database

#### Option A: Using Local MySQL Server

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE airline_reminder_service;

# Create user with password
CREATE USER 'reminder_user'@'localhost' IDENTIFIED BY 'reminder_password_123';

# Grant permissions
GRANT ALL PRIVILEGES ON airline_reminder_service.* TO 'reminder_user'@'localhost';
FLUSH PRIVILEGES;

# Verify
SELECT USER();
EXIT;
```

#### Option B: Using Docker

```bash
# Run MySQL container
docker run --name reminder-mysql \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=airline_reminder_service \
  -e MYSQL_USER=reminder_user \
  -e MYSQL_PASSWORD=reminder_password_123 \
  -p 3306:3306 \
  -d mysql:8.0

# Verify connection
docker exec -it reminder-mysql mysql -u reminder_user -p airline_reminder_service -e "SELECT DATABASE();"
```

---

### Step 4: Configure RabbitMQ

#### Option A: Local RabbitMQ Installation

```bash
# Windows (using Chocolatey)
choco install rabbitmq-server

# macOS (using Homebrew)
brew install rabbitmq

# Linux (Ubuntu/Debian)
sudo apt-get install rabbitmq-server

# Start RabbitMQ
sudo service rabbitmq-server start

# Enable management plugin
sudo rabbitmq-plugins enable rabbitmq_management

# Access management UI: http://localhost:15672
# Default credentials: guest / guest
```

#### Option B: Using Docker

```bash
# Run RabbitMQ container with management plugin
docker run --name reminder-rabbitmq \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  -p 5672:5672 \
  -p 15672:15672 \
  -d rabbitmq:3.12-management

# Access management UI: http://localhost:15672
# Create exchange and queue (or let Reminder Service auto-create)
```

#### Verify RabbitMQ Connection

```bash
# Check if RabbitMQ is running
sudo service rabbitmq-server status

# Or access management UI
curl -u guest:guest http://localhost:15672/api/overview
```

---

### Step 5: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your configurations:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=reminder_user
DB_PASSWORD=reminder_password_123
DB_NAME=airline_reminder_service
DB_DIALECT=mysql

# Email Configuration (Gmail)
EMAIL_ID=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# RabbitMQ Configuration
MESSAGE_BROKER_URL=amqp://guest:guest@localhost:5672
EXCHANGE_NAME=AIRLINES
REMINDER_BINDING_KEY=reminder.*

# Logging
LOG_LEVEL=debug
```

**Getting Gmail App Password**:

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** → **2-Step Verification** (enable if not active)
3. Under **App passwords**, select **Mail** and **Windows Computer**
4. Copy the generated 16-character password
5. Paste in `.env` as `EMAIL_PASS`

---

### Step 6: Run Database Migrations

Initialize the database schema:

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Verify tables created
mysql -u reminder_user -p airline_reminder_service -e "SHOW TABLES;"
```

**Expected output**:

```
Tables_in_airline_reminder_service
NotificationTickets
SequelizeMeta
```

If migrations fail, run create migration manually:

```bash
npx sequelize-cli migration:generate --name create-notification-ticket

# Edit the generated file in src/migrations/
# Add up/down functions

# Then run migration
npx sequelize-cli db:migrate
```

---

### Step 7: Start the Server

#### Development Mode (with auto-reload)

```bash
npm start
```

**Expected output**:

```
Server is listening on port http://localhost:3000
Reminder Service initialized successfully
Connected to RabbitMQ
```

#### Production Mode

```bash
NODE_ENV=production npm start
```

---

## 🔧 Environment Configuration

### Configuration Files

**[src/config/server.config.js](src/config/server.config.js)**: Main server configuration

```javascript
require("dotenv").config({ path: "./.env" });

module.exports = {
  PORT: process.env.PORT,
  EMAIL_ID: process.env.EMAIL_ID,
  EMAIL_PASS: process.env.EMAIL_PASS,
  MESSAGE_BROKER_URL: process.env.MESSAGE_BROKER_URL,
  EXCHANGE_NAME: process.env.EXCHANGE_NAME,
  REMINDER_BINDING_KEY: process.env.REMINDER_BINDING_KEY,
};
```

**[src/config/email.config.js](src/config/email.config.js)**: Nodemailer setup

```javascript
const nodemailer = require("nodemailer");
const { EMAIL_ID, EMAIL_PASS } = require("./server.config");

const sender = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: EMAIL_ID,
    pass: EMAIL_PASS,
  },
});

module.exports = sender;
```

### Environment Variables Reference

| Variable               | Example                           | Description          |
| ---------------------- | --------------------------------- | -------------------- |
| `PORT`                 | 3000                              | HTTP server port     |
| `NODE_ENV`             | development                       | Environment mode     |
| `DB_HOST`              | localhost                         | MySQL host           |
| `DB_PORT`              | 3306                              | MySQL port           |
| `DB_USER`              | reminder_user                     | MySQL username       |
| `DB_PASSWORD`          | password                          | MySQL password       |
| `DB_NAME`              | airline_reminder_service          | Database name        |
| `EMAIL_ID`             | service@gmail.com                 | Gmail address        |
| `EMAIL_PASS`           | xxxx xxxx xxxx xxxx               | Gmail app password   |
| `MESSAGE_BROKER_URL`   | amqp://guest:guest@localhost:5672 | RabbitMQ URL         |
| `EXCHANGE_NAME`        | AIRLINES                          | RabbitMQ exchange    |
| `REMINDER_BINDING_KEY` | reminder.\*                       | RabbitMQ routing key |

---

## ▶️ Running the Service

### Full Startup Checklist

```bash
# 1. Verify MySQL is running
mysql -u reminder_user -p -e "SELECT 1;"

# 2. Verify RabbitMQ is running
curl -u guest:guest http://localhost:15672/api/overview

# 3. Check .env file exists
test -f .env && echo ".env exists" || echo ".env missing"

# 4. Install dependencies
npm install

# 5. Run migrations
npx sequelize-cli db:migrate

# 6. Start the service
npm start
```

### Monitoring During Runtime

#### Check Server Health

```bash
curl http://localhost:3000/health
```

#### View Pending Reminders

```bash
curl http://localhost:3000/api/v1/tickets/status/pending
```

#### Monitor RabbitMQ Queues

```bash
# Via management UI
open http://localhost:15672

# Or via API
curl -u guest:guest http://localhost:15672/api/queues
```

#### View Application Logs

```bash
# Terminal logs (from npm start)
# All console.log statements appear here

# Check for errors
grep -i "error" <log-file>

# Follow logs in real-time
tail -f <log-file>
```

### Stopping the Service

```bash
# Press Ctrl+C in terminal running npm start

# Or find and kill process
lsof -ti:3000 | xargs kill -9
```

---

## 💡 Use Cases

### Use Case 1: Flight Reminder (24 Hours Before Departure)

**Scenario**: User books a flight scheduled for January 15, 2 PM.

**Flow**:

1. **1:00 PM Jan 14**: Booking Service publishes `booking.confirmed` event
2. **RabbitMQ**: Message queued in REMINDER_QUEUE
3. **Reminder Service**: Consumes message, creates NotificationTicket
   - `notificationTime`: January 15, 1:00 PM (24 hours before)
   - `status`: PENDING
4. **Cron Job**: Every minute, checks if notification time reached
5. **1:00 PM Jan 15**: Cron finds ticket, triggers email send
6. **Nodemailer**: Sends "Your flight departs tomorrow" email
7. **Database**: Updates ticket status to SUCCESS

**User Experience**: Gets a timely reminder to prepare for flight.

---

### Use Case 2: Booking Confirmation Email

**Scenario**: User completes booking flow.

**Flow**:

1. **Booking Service**: Publishes event immediately upon booking confirmation
2. **Reminder Service**: Creates notification with immediate `notificationTime`
3. **Cron Job**: Processes within 1 minute
4. **Email**: Confirmation details sent to user
5. **Database**: Records successful delivery

**Business Value**: Users have instant confirmation; also serves as receipt/invoice.

---

### Use Case 3: Retry Failed Notification

**Scenario**: Email sending failed due to temporary network issue.

**Flow**:

1. **Cron Job**: Tries to send email
2. **Nodemailer**: Connection timeout error
3. **Service**: Catches error, marks status as FAILED
4. **Admin Dashboard**: Shows failed notification
5. **Admin**: Clicks "Retry" button (calls API endpoint)
6. **Service**: Updates retry count, resets `notificationTime` to now
7. **Cron Job**: Picks up on next cycle, successfully sends

**Benefit**: Manual recovery without re-processing from original service.

---

### Use Case 4: Bulk Reminder Creation

**Scenario**: Pre-departure reminders for all passengers on a specific flight.

**Flow**:

1. **Flight Service**: Flight UA234 scheduled, 100 bookings exist
2. **Event Publishing**: Publishes `flight.scheduled` event with flight details
3. **Reminder Service**: Batch creates 100 NotificationTickets
   - All with same `notificationTime` (2 hours before departure)
   - Different recipients (each passenger's email)
4. **Cron Job**: At scheduled time, triggers 100 emails in parallel
5. **Database**: Records delivery status for each

**Scale Benefit**: Handles thousands of reminders from single event.

---

### Use Case 5: Monitoring & Alerting

**Scenario**: Operations team monitors reminder delivery health.

**Flow**:

1. **Dashboard**: Queries `/api/v1/tickets/status/pending` every 5 minutes
2. **Alert Condition**: If pending count > threshold for > 30 minutes
3. **Alert**: Pager alert sent to on-call engineer
4. **Investigation**: Engineer checks:
   - Cron job running?
   - RabbitMQ connected?
   - Database accessible?
   - Email provider issues?
5. **Mitigation**: Restart service, check logs, escalate if needed

**Operational Benefit**: Proactive detection of service degradation.

---

## 🎨 Design Decisions

### 1. **Event-Driven via RabbitMQ (Not Direct API Calls)**

**Decision**: Use asynchronous message queues instead of REST API calls from Booking Service.

**Rationale**:

- **Decoupling**: Booking Service doesn't wait for Reminder Service response
- **Reliability**: Messages persist if Reminder Service is temporarily down
- **Scalability**: Multiple Reminder Service instances can consume from same queue
- **Resilience**: Service failures don't cascade to booking flow

**Trade-off**: Slightly higher latency (seconds) vs. immediate notification.

---

### 2. **Database Persistence for Reminders**

**Decision**: Store reminder metadata in MySQL before scheduled sending.

**Rationale**:

- **Audit Trail**: Complete history of all notifications
- **Retry Mechanism**: Failed reminders can be reprocessed
- **Status Tracking**: Monitor delivery success rate
- **Compliance**: Prove delivery to users and regulators

**Alternative Considered**: Only send immediately without storing

- Rejected: Loses audit trail, no retry capability

---

### 3. **Cron-Based Scheduling (Not External Queue)**

**Decision**: Use `node-cron` with database polling for scheduled reminders.

**Rationale**:

- **Simplicity**: No additional infrastructure (vs. separate job queue service)
- **Cost-Effective**: Leverages existing database
- **Accurate**: Database timestamps as source of truth
- **Flexible**: Easy to query and debug scheduled jobs

**Alternative Considered**: External task queue (Celery, Bull)

- Rejected: Adds complexity and operational overhead for this use case

---

### 4. **Email via Gmail SMTP**

**Decision**: Use Nodemailer with Gmail SMTP for email delivery.

**Rationale**:

- **Reliability**: Gmail infrastructure and reputation
- **Low Cost**: No separate email service needed
- **Simple Setup**: Standard SMTP integration
- **Scalable**: Handles moderate volumes (suitable for airline context)

**Production Upgrade Path**: Switch to SendGrid, AWS SES, or Mailgun for higher volumes

---

### 5. **Sequelize ORM (Not Raw SQL)**

**Decision**: Use Sequelize ORM for database abstraction.

**Rationale**:

- **Type Safety**: Models define schema clearly
- **Migrations**: Version control for schema changes
- **Relationships**: Easy to add user/booking associations later
- **Query Builder**: Type-safe query construction

**Migrations Support**: `sequelize-cli` enables safe schema evolution

---

### 6. **Layered Architecture (Controller → Service → Repository)**

**Decision**: Separate concerns into distinct layers.

**Benefits**:

- **Testability**: Each layer can be unit tested independently
- **Reusability**: Services used by API endpoints, message consumers, cron jobs
- **Maintainability**: Changes isolated to specific layers
- **Clarity**: Each layer has single responsibility

**Layer Responsibilities**:

- **Routes**: HTTP contracts
- **Controller**: Request/response mapping
- **Service**: Business logic
- **Repository**: Data access
- **Models**: Schema definition

---

## 📊 Monitoring & Observability

### Metrics to Track

```
- Pending reminders count
- Reminders sent per hour
- Email delivery success rate
- Average send latency
- Failed reminders count
- Cron job execution time
- RabbitMQ message lag
- Database connection pool usage
```

### Logging Best Practices

```javascript
// Include context in logs
logger.info("Reminder created", {
  reminderId: 123,
  email: "user@example.com",
  notificationTime: "2025-01-15T14:30:00Z",
  service: "Reminder Service",
});

// Log errors with full context
logger.error("Email send failed", {
  reminderId: 123,
  error: error.message,
  errorCode: error.code,
  retryCount: 2,
});
```

### Health Checks

The `/health` endpoint should verify:

- ✓ Database connectivity
- ✓ RabbitMQ connectivity
- ✓ Email provider accessibility
- ✓ Disk space availability
- ✓ Memory usage

---

## 🔐 Security Considerations

### Environment Variables

- Never commit `.env` files
- Use `.env.example` for documentation
- Rotate credentials regularly
- Use app-specific passwords (not main account password)

### Database

- Use parameterized queries (Sequelize handles this)
- Restrict database user permissions (read/write on specific tables only)
- Enable SSL connections to MySQL
- Regular backups

### RabbitMQ

- Change default guest credentials in production
- Use TLS for AMQP connections
- Restrict queue access to specific users
- Monitor for unauthorized consumers

### Email

- Validate email addresses before sending
- Implement rate limiting to prevent spam
- Log all email operations for audit
- Encrypt email content if sensitive

---

## 📈 Future Enhancements

### Short-Term (1-3 months)

- [ ] Add retry mechanism with exponential backoff
- [ ] Implement email templates (HTML)
- [ ] Add request validation middleware
- [ ] Create `/health` endpoint
- [ ] Add structured logging (Winston/Bunyan)
- [ ] Unit tests for services

### Medium-Term (3-6 months)

- [ ] Add user/booking relationships in database
- [ ] Implement notification preferences (do-not-disturb times)
- [ ] Add SMS notifications alongside email
- [ ] Create admin dashboard
- [ ] Implement rate limiting per user
- [ ] Add Prometheus metrics export

### Long-Term (6+ months)

- [ ] Switch to external email service (SendGrid, AWS SES)
- [ ] Implement distributed tracing (Jaeger)
- [ ] Add notification templates with variable interpolation
- [ ] Multi-language support for emails
- [ ] Analytics dashboard (delivery rates, engagement)
- [ ] Webhook notifications for other services

---

## 👥 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Contact

For questions or support:

- **GitHub Issues:** [ReminderService Issues](https://github.com/krishsingh120/ReminderService.git)
- **Email:** krishsin2254@gmail.com
- **Documentation:** [Full API Docs](https://docs.airline.com/ReminderService)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready