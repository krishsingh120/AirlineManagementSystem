# API Gateway – AirlineBookingSystem

A lightweight, high-performance API Gateway that serves as the single entry point for all client requests in a microservices-based airline booking system.

## Overview

The API Gateway is a critical middleware layer that sits between client applications and backend microservices. It handles application-level concerns including request routing, authentication validation, rate limiting, and traffic control.

**Request Flow:**

```
FRONTEND → API GATEWAY → MICROSERVICES
```

The gateway intelligently routes incoming requests to the appropriate backend service and ensures system reliability through traffic management and request validation.

## Tech Stack

| Technology                | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| **Node.js**               | JavaScript runtime for server-side execution                  |
| **Express.js**            | Lightweight web framework for routing and middleware handling |
| **Axios**                 | HTTP client for making requests to backend microservices      |
| **http-proxy-middleware** | Forwards requests to backend services transparently           |
| **express-rate-limit**    | Prevents abuse by limiting requests per IP address            |
| **morgan**                | HTTP request logging for monitoring and debugging             |
| **dotenv**                | Manages environment variables securely                        |
| **PM2**                   | Process manager for production deployment and clustering      |

## Core Responsibilities

The API Gateway handles the following application-level concerns:

- **Request Routing** – Directs incoming requests to appropriate microservices (e.g., `/auth` → AuthService, `/bookings` → BookingService)
- **Authentication & Authorization** – Validates client credentials before forwarding requests
- **Rate Limiting** – Protects backend services by restricting requests per client
- **Request Logging** – Tracks all incoming requests for monitoring and troubleshooting
- **Basic Validation** – Ensures requests meet minimum requirements before processing
- **Traffic Control** – Acts as a smart traffic controller managing load distribution

## API Gateway vs Load Balancer

While both are crucial for production systems, they serve different purposes:

| Aspect      | API Gateway                       | Load Balancer                       |
| ----------- | --------------------------------- | ----------------------------------- |
| **Focus**   | Application-level concerns        | Traffic distribution                |
| **Layer**   | Application layer (Layer 7)       | Network/Transport layer (Layer 4-7) |
| **Purpose** | Routing, security, transformation | High availability, scalability      |
| **Scope**   | Microservice orchestration        | Instance distribution               |

**In Production:** Both work together—the API Gateway handles service routing while the Load Balancer distributes traffic across multiple gateway instances.

## Rate Limiting

Rate limiting restricts the number of requests a client can make within a specific time window. This is essential for:

- **Preventing Abuse** – Stops malicious actors from overwhelming the system
- **Fair Resource Allocation** – Ensures all clients get fair access
- **Backend Protection** – Shields microservices from unexpected traffic spikes

The gateway uses `express-rate-limit` to implement a configurable window (e.g., 5 requests per minute per IP) and returns a `429 Too Many Requests` response when limits are exceeded.

## Project Structure

```
Api_Gateway/
├── index.js              # Main application entry point
├── package.json          # Project dependencies
├── .env                  # Environment configuration
├── README.md             # This file
└── (no database required)
```

This service is **stateless** and does not require a database, making it lightweight and horizontally scalable.

## Scalability

The API Gateway is designed for horizontal scalability:

- **Stateless Architecture** – No local session data, enabling easy replication
- **PM2 Clustering** – Utilizes multiple CPU cores with PM2's cluster mode
- **Load Distribution** – Multiple instances can run behind a load balancer
- **Horizontal Scaling** – Add new instances as traffic increases

Example PM2 cluster deployment:

```bash
pm2 start index.js -i max  # Spawns one process per CPU core
```

## Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=3005
NODE_ENV=production
```

### 3. Start the Service

**Development (with auto-reload):**

```bash
npm start
```

**Production (with PM2):**

```bash
pm2 start index.js --name "api-gateway" --instances max
pm2 save
pm2 startup
```

The gateway will start listening for incoming requests and forward them to the appropriate microservices.
