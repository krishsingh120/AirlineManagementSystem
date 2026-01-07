# FlightAndSearch Service – Airline Management System

## Table of Contents

1. [Overview](#overview)
2. [Project Context](#project-context)
3. [Microservice Architecture](#microservice-architecture)
4. [Core Responsibilities](#core-responsibilities)
5. [Flight Search Flow](#flight-search-flow)
6. [Database Design](#database-design)
7. [Folder Structure & Layered Architecture](#folder-structure--layered-architecture)
8. [API Endpoints](#api-endpoints)
9. [Setup & Installation](#setup--installation)
10. [Use Cases](#use-cases)
11. [Technology Stack](#technology-stack)

---

## Overview

**FlightAndSearch Service** is a production-grade microservice that forms the backbone of an Airline Management and Booking System. It is responsible for managing flight-related data, enabling advanced search capabilities, and serving as the single source of truth for flight metadata across the ecosystem.

This service operates behind an API Gateway in a distributed, microservices-based architecture, ensuring scalability, maintainability, and separation of concerns.

---

## Project Context

### What is FlightAndSearch Service?

FlightAndSearch Service is a dedicated microservice designed to handle all flight-related operations in an Airline Management System. It abstracts flight management complexity and provides a unified API for consuming services (such as the Booking Service) and client applications.

### Primary Responsibilities

1. **Flight Management**: Create, update, and manage flight records with attributes like airline, aircraft, routes, schedules, and pricing.
2. **Advanced Search**: Enable powerful search capabilities to find flights based on multiple criteria (source, destination, date, availability).
3. **Data Consistency**: Maintain flight metadata as the authoritative source across all services in the ecosystem.
4. **API Gateway Integration**: Expose REST APIs consumed by client applications (Web/Mobile) and internal microservices.

### Why a Separate Microservice?

In monolithic architectures, flight management, booking, and payments would exist in a single codebase, creating tight coupling and reducing scalability. By isolating FlightAndSearch as a dedicated microservice:

- **Scalability**: Flight search is often the most read-heavy operation. This service can scale independently based on demand.
- **Separation of Concerns**: Flight management logic is decoupled from booking, payment, and user management logic.
- **Team Ownership**: A dedicated team can own and optimize the flight service without impacting other services.
- **Resilience**: A failure in flight search doesn't cascade to booking or payment systems.
- **Independent Deployment**: Flight service updates don't require redeploying the entire system.

---

## Microservice Architecture

### System Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Client Applications                        │
│              (Web Browser / Mobile App)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │      Load Balancer           │
            │   (Request Routing)          │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │      API Gateway             │
            │  (Authentication, Rate       │
            │   Limiting, Routing)         │
            └──────────────┬───────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
   ┌─────────────────────┐   ┌──────────────────────┐
   │ FlightAndSearch     │   │  Booking Service     │
   │  Service            │   │  (Manages           │
   │ (Manages Flights,   │   │   Reservations,     │
   │  Availability,      │   │   Payments)         │
   │  Search)            │   │                      │
   │                     │   │                      │
   │ ┌─────────────┐    │   │  Consumes Flight    │
   │ │   MySQL     │    │   │  Data from Flight   │
   │ │ Database    │    │   │  Service            │
   │ │ (Flights,   │    │   │                      │
   │ │  Airlines,  │    │   │ ┌─────────────┐    │
   │ │  Airports,  │    │   │ │   MySQL     │    │
   │ │  Aircraft)  │    │   │ │ Database    │    │
   │ └─────────────┘    │   │ │ (Bookings,  │    │
   └─────────────────────┘   │ │  Payments)  │    │
                             │ └─────────────┘    │
                             └──────────────────────┘
```

### Why This Architecture?

1. **Independent Scaling**: FlightAndSearch can be scaled horizontally to handle high search volumes during peak travel seasons.
2. **Technology Flexibility**: Each service can choose its own tech stack if needed (though currently both use Node.js + Express).
3. **Fault Isolation**: If Booking Service is down, flight search remains operational.
4. **API Contract**: Clear REST API contract ensures services evolve independently without breaking changes.

### Service Collaboration

**FlightAndSearch Service** → **Booking Service**

When a user places a booking:

1. Booking Service queries FlightAndSearch to validate flight availability.
2. It retrieves flight details (price, capacity, schedule).
3. It verifies seat availability in real-time.
4. Upon booking confirmation, it may notify FlightAndSearch to update seat count (or use a queue-based system).

---

## Core Responsibilities

### 1. Flight Data Management

FlightAndSearch Service manages comprehensive flight information including:

- **Flight Details**: Flight number, airline, aircraft type, route
- **Schedule**: Departure and arrival times
- **Capacity**: Total seats, available seats
- **Pricing**: Base fare, dynamic pricing rules
- **Status**: Active, cancelled, delayed

### 2. Flight Search & Filtering

The service provides powerful search capabilities allowing users to find flights by:

| Search Parameter   | Description                         |
| ------------------ | ----------------------------------- |
| **Departure City** | Source city (e.g., "New York")      |
| **Arrival City**   | Destination city (e.g., "London")   |
| **Departure Date** | Date of travel                      |
| **Availability**   | Filter flights with available seats |
| **Price Range**    | Budget constraints                  |
| **Departure Time** | Preferred departure window          |

### 3. Data Consistency & Authority

This service acts as the **single source of truth** for flight metadata:

- All flight-related queries from client apps must go through this service.
- The Booking Service trusts this service for flight validation.
- Real-time seat availability is maintained and updated.

### 4. Performance & Optimization

- **Indexed Queries**: Database indexes on frequently searched columns (departure city, arrival city, date).
- **Caching Strategy**: Flight listings can be cached for frequently searched routes.
- **Pagination**: Large result sets are paginated to improve response times.

---

## Flight Search Flow

### Step-by-Step Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User Initiates Flight Search                        │
│ (Web/Mobile App - Client)                                   │
│ Input: Source, Destination, Date                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Request Passes Through API Gateway                  │
│ - Authentication & Authorization                            │
│ - Rate Limiting                                             │
│ - Request Validation                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: FlightAndSearch Service Receives Request            │
│ - Validates search parameters                               │
│ - Applies business rules (e.g., future dates only)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Query MySQL Database                                │
│ - Execute search query with filters                         │
│ - Join with Airport, City, Airplane tables                  │
│ - Calculate available seats                                 │
│ - Sort by price, departure time, duration                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Format & Return Results                             │
│ - Enrich flight data with airline & airport info            │
│ - Apply pagination                                          │
│ - Return JSON response to client                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Client Application Displays Results                 │
│ User selects a flight for booking                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Booking Service Validates Flight                    │
│ - Queries FlightAndSearch to confirm availability           │
│ - Verifies price hasn't changed significantly               │
│ - Reserves seats (via separate transaction)                 │
└─────────────────────────────────────────────────────────────┘
```

### Example Search Scenario

**User Request:**

```
GET /api/v1/flights/search?source=New%20York&destination=London&date=2026-02-15
```

**Process:**

1. Controller receives request with query parameters.
2. Service validates that the date is in the future.
3. Repository constructs a Sequelize query with WHERE conditions.
4. Database joins Flights with Airports and Cities tables.
5. Results are filtered, sorted, and paginated.
6. Response is returned with flight details and available seats.

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "flightNumber": "AA123",
      "airline": "American Airlines",
      "departureAirport": "JFK",
      "arrivalAirport": "LHR",
      "departureTime": "2026-02-15T14:00:00Z",
      "arrivalTime": "2026-02-16T02:00:00Z",
      "price": 450,
      "totalSeats": 180,
      "availableSeats": 45,
      "boardingGate": "B12"
    },
    {
      "id": 102,
      "flightNumber": "BA456",
      "airline": "British Airways",
      "departureAirport": "JFK",
      "arrivalAirport": "LHR",
      "departureTime": "2026-02-15T18:30:00Z",
      "arrivalTime": "2026-02-16T06:30:00Z",
      "price": 520,
      "totalSeats": 220,
      "availableSeats": 89,
      "boardingGate": "A05"
    }
  ],
  "message": "Successfully fetched flights",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2
  }
}
```

---

## Database Design

### Entity-Relationship Diagram

```
┌───────────┐
│ Airline   │
│ (Master)  │
└─────┬─────┘
      │ 1:N
      │
      ▼
┌──────────────┐        ┌─────────────┐
│   Flights    │◄───────│  Airplanes  │
│  (Core)      │ 1:N    │   (Master)  │
└──────┬───────┘        └─────────────┘
       │ 1:N (Departure)
       │ 1:N (Arrival)
       │
    ┌──┴──┐
    │     │
    ▼     ▼
┌─────────────┐
│   Airports  │
│  (Master)   │
└──────┬──────┘
       │ 1:N
       │
       ▼
┌─────────────┐
│    Cities   │
│  (Master)  │
└─────────────┘
```

### Core Entities

#### 1. **City**

```sql
CREATE TABLE Cities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose**: Master entity representing a city (e.g., "New York", "London", "Tokyo")

**Relationships**: 1 City → Many Airports

---

#### 2. **Airport**

```sql
CREATE TABLE Airports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  address VARCHAR(255),
  cityId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cityId) REFERENCES Cities(id)
);
```

**Purpose**: Represents physical airports (e.g., "John F. Kennedy International Airport" - JFK)

**Relationships**:

- Many Airports belong to 1 City
- 1 Airport can be departure point for many Flights
- 1 Airport can be arrival point for many Flights

---

#### 3. **Airplane**

```sql
CREATE TABLE Airplanes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  modelNumber VARCHAR(50) NOT NULL,
  capacity INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose**: Master entity for aircraft types (e.g., "Boeing 747", "Airbus A380")

**Attributes**:

- `modelNumber`: Aircraft model
- `capacity`: Total passenger capacity

**Relationships**: 1 Airplane → Many Flights

---

#### 4. **Flight** (Core Entity)

```sql
CREATE TABLE Flights (
  id INT PRIMARY KEY AUTO_INCREMENT,
  flightNumber VARCHAR(20) NOT NULL UNIQUE,
  airplaneId INT NOT NULL,
  departureAirportId INT NOT NULL,
  arrivalAirportId INT NOT NULL,
  departureTime DATETIME NOT NULL,
  arrivalTime DATETIME NOT NULL,
  price INT NOT NULL,
  totalSeats INT NOT NULL,
  boardingGate VARCHAR(10),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (airplaneId) REFERENCES Airplanes(id),
  FOREIGN KEY (departureAirportId) REFERENCES Airports(id),
  FOREIGN KEY (arrivalAirportId) REFERENCES Airports(id)
);
```

**Purpose**: Core entity representing a specific flight instance

**Attributes**:

- `flightNumber`: Unique flight identifier (e.g., "AA123")
- `airplaneId`: Which aircraft operates this flight
- `departureAirportId`: Source airport
- `arrivalAirportId`: Destination airport
- `departureTime`, `arrivalTime`: Schedule
- `price`: Ticket fare in USD
- `totalSeats`: Passenger capacity
- `boardingGate`: Gate assignment

**Relationships**:

- Flights belong to 1 Airplane
- Flights originate from 1 Airport (departure)
- Flights arrive at 1 Airport (arrival)
- Each Airport is linked to 1 City

---

### Why MySQL + Relational Database?

1. **Structured Data**: Flight data has clear, consistent structure with defined relationships.
2. **Data Integrity**: Foreign keys ensure referential integrity (flights can't reference non-existent airports).
3. **Complex Queries**: JOIN operations easily retrieve enriched flight data with airport and city information.
4. **ACID Compliance**: Ensures data consistency during concurrent bookings and updates.
5. **Indexing**: Efficient queries on frequently accessed columns (dates, airports).
6. **Mature Ecosystem**: Sequelize ORM provides excellent abstraction over SQL.

---

## Folder Structure & Layered Architecture

FlightAndSearch Service follows a **layered architecture** pattern, separating concerns into distinct layers:

```
src/
├── config/                 # Configuration Management
├── controllers/            # Request Handlers
├── middleware/             # Custom Middleware
├── migrations/             # Database Schema Versions
├── models/                 # Sequelize ORM Models
├── repository/             # Data Access Layer
├── routes/                 # API Routing
├── seeders/                # Database Seed Data
├── services/               # Business Logic Layer
├── utils/                  # Helper Functions & Constants
└── index.js                # Server Entry Point
```

### Detailed Explanation of Each Layer

---

#### **config/** – Configuration Management

**Purpose**: Centralized configuration for environment variables, database connections, and server settings.

**Key Files**:

- `serverConfig.js`: Port, environment variables
- `config.json`: Sequelize database configuration

**Example** (`config/serverConfig.js`):

```javascript
const PORT = process.env.PORT || 8080;
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "password";

module.exports = {
  PORT,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
};
```

**Why Separate?**: Keeps environment-specific settings out of business logic. Facilitates deployment across dev, staging, and production environments.

---

#### **routes/** – API Routing

**Purpose**: Defines API endpoints and routes requests to appropriate controllers.

**Structure**:

```
routes/
├── index.js          # Route aggregator
└── v1/               # API version 1
    └── index.js      # v1 endpoints
```

**Example** (`routes/v1/index.js`):

```javascript
const express = require("express");
const router = express.Router();
const { FlightController, AirportController } = require("../../controllers");

// Flight endpoints
router.post("/flights", FlightController.create);
router.get("/flights", FlightController.getAll);
router.get("/flights/:id", FlightController.get);

// Search endpoints
router.get("/flights/search", FlightController.search);

// Airport endpoints
router.get("/airports", AirportController.getAll);

module.exports = router;
```

**Why Separate?**: Decouples URL structure from business logic. Simplifies adding/removing endpoints without touching controller code. Supports API versioning (v1, v2).

---

#### **controllers/** – Request Handlers

**Purpose**: HTTP request entry points. Handles request parsing, validation, and response formatting.

**Responsibility**:

- Parse incoming request data
- Call appropriate service methods
- Handle errors gracefully
- Format and return JSON responses

**Example** (`controllers/flight.controller.js`):

```javascript
const { FlightServices } = require("../services/index");

const flightService = new FlightServices();

const create = async (req, res) => {
  try {
    const flightData = {
      flightNumber: req.body.flightNumber,
      airplaneId: req.body.airplaneId,
      departureAirportId: req.body.departureAirportId,
      arrivalAirportId: req.body.arrivalAirportId,
      departureTime: req.body.departureTime,
      arrivalTime: req.body.arrivalTime,
      price: req.body.price,
    };

    const flight = await flightService.createFlight(flightData);

    return res.status(201).json({
      data: flight,
      success: true,
      message: "Flight created successfully",
      err: {},
    });
  } catch (error) {
    return res.status(500).json({
      data: {},
      success: false,
      message: "Failed to create flight",
      err: error,
    });
  }
};

module.exports = { create, getAll, get, search };
```

**Why Separate?**: Controllers are thin and focused only on HTTP concerns. All business logic moves to services, making code testable and reusable.

---

#### **services/** – Business Logic Layer

**Purpose**: Contains core application logic independent of HTTP/database specifics.

**Responsibility**:

- Implement business rules (e.g., "departure time must be before arrival time")
- Orchestrate repository calls
- Transform data between layers
- Throw meaningful errors

**Example** (`services/flight.service.js`):

```javascript
const { FlightRepository } = require("../repository/index");

class FlightServices {
  constructor() {
    this.flightRepository = new FlightRepository();
  }

  async createFlight(data) {
    try {
      // Business rule: validate times
      if (new Date(data.arrivalTime) <= new Date(data.departureTime)) {
        throw {
          error: "Arrival time must be after departure time",
        };
      }

      // Call repository to persist
      const flight = await this.flightRepository.createFlight(data);
      return flight;
    } catch (error) {
      throw { error };
    }
  }

  async searchFlights(filters) {
    try {
      // Business logic: prepare search query
      const flights = await this.flightRepository.searchFlights(filters);

      // Transform response
      return flights.map((f) => ({
        id: f.id,
        flightNumber: f.flightNumber,
        availableSeats: f.totalSeats - f.bookedSeats,
        // ... more transformations
      }));
    } catch (error) {
      throw { error };
    }
  }
}

module.exports = FlightServices;
```

**Why Separate?**: Business logic is decoupled from HTTP and database details. Services can be tested without mocking HTTP or database. Easy to reuse in batch jobs, scheduled tasks, or other contexts.

---

#### **repository/** – Data Access Layer

**Purpose**: Abstracts database operations. All queries go through repositories.

**Responsibility**:

- Execute database queries via Sequelize
- Handle ORM-specific logic
- Provide a clean interface for services

**Example** (`repository/flight.repository.js`):

```javascript
const { Flights, Airports, City } = require("../models/index");
const { Op } = require("sequelize");

class FlightRepository {
  async createFlight(data) {
    const flight = await Flights.create(data);
    return flight.toJSON();
  }

  async getFlight(id) {
    const flight = await Flights.findByPk(id, {
      include: [
        {
          model: Airports,
          as: "departureAirport",
          include: [{ model: City }],
        },
        {
          model: Airports,
          as: "arrivalAirport",
          include: [{ model: City }],
        },
      ],
    });
    return flight.toJSON();
  }

  async searchFlights(filters) {
    const where = {};

    if (filters.departureAirportId) {
      where.departureAirportId = filters.departureAirportId;
    }
    if (filters.arrivalAirportId) {
      where.arrivalAirportId = filters.arrivalAirportId;
    }
    if (filters.departureDate) {
      where.departureTime = {
        [Op.gte]: new Date(filters.departureDate),
        [Op.lt]: new Date(
          new Date(filters.departureDate).getTime() + 24 * 60 * 60 * 1000
        ),
      };
    }

    const flights = await Flights.findAll({
      where,
      limit: filters.limit || 10,
      offset: (filters.page - 1) * (filters.limit || 10),
      order: [["departureTime", "ASC"]],
    });

    return flights.map((f) => f.toJSON());
  }
}

module.exports = FlightRepository;
```

**Why Separate?**: Repositories encapsulate all database logic. If you switch from Sequelize to Knex or raw SQL, only repositories change. Services and controllers remain untouched.

---

#### **models/** – Sequelize ORM Models

**Purpose**: Define database table schemas and relationships using Sequelize.

**Example** (`models/flights.js`):

```javascript
module.exports = (sequelize, DataTypes) => {
  class Flights extends require("sequelize").Model {
    static associate(models) {
      this.belongsTo(models.Airplane, { foreignKey: "airplaneId" });
      this.belongsTo(models.Airport, {
        foreignKey: "departureAirportId",
        as: "departureAirport",
      });
      this.belongsTo(models.Airport, {
        foreignKey: "arrivalAirportId",
        as: "arrivalAirport",
      });
    }
  }

  Flights.init(
    {
      flightNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      airplaneId: { type: DataTypes.INTEGER, allowNull: false },
      departureAirportId: { type: DataTypes.INTEGER, allowNull: false },
      arrivalAirportId: { type: DataTypes.INTEGER, allowNull: false },
      departureTime: { type: DataTypes.DATE, allowNull: false },
      arrivalTime: { type: DataTypes.DATE, allowNull: false },
      price: { type: DataTypes.INTEGER, allowNull: false },
      totalSeats: { type: DataTypes.INTEGER, allowNull: false },
      boardingGate: { type: DataTypes.STRING },
    },
    { sequelize, modelName: "Flights" }
  );

  return Flights;
};
```

**Why Separate?**: Models are single source of truth for table structure. Relationships are defined once and automatically available in ORM.

---

#### **middleware/** – Custom Middleware

**Purpose**: Middleware functions that intercept requests before they reach controllers.

**Common Middleware**:

- Authentication verification
- Request validation
- CORS handling
- Error handling
- Logging

**Example** (`middleware/flight.middleware.js`):

```javascript
const validateFlightCreation = (req, res, next) => {
  const { flightNumber, airplaneId, departureTime, arrivalTime, price } =
    req.body;

  if (
    !flightNumber ||
    !airplaneId ||
    !departureTime ||
    !arrivalTime ||
    !price
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
      err: {},
    });
  }

  next();
};

module.exports = { validateFlightCreation };
```

**Why Separate?**: Middleware promotes code reuse. Instead of validating in every controller, middleware handles it once before requests reach handlers.

---

#### **migrations/** – Database Schema Versioning

**Purpose**: Version-controlled schema changes using Sequelize migrations.

**Files**: Named by timestamp and purpose (e.g., `20250731114649-create-flights.js`)

**Example** (`migrations/20250731114649-create-flights.js`):

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Flights", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      flightNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      departureTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      // ... more columns
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Flights");
  },
};
```

**Why Separate?**: Migrations enable reproducible database changes. Deploy to any environment by running migrations. Rollback is always possible.

---

#### **seeders/** – Initial Data

**Purpose**: Populate database with initial/test data.

**Example** (`seeders/20250731110228-add-airplanes.js`):

```javascript
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert("Airplanes", [
      { modelNumber: "Boeing 747", capacity: 416 },
      { modelNumber: "Airbus A380", capacity: 853 },
      { modelNumber: "Boeing 777", capacity: 350 },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("Airplanes", null, {});
  },
};
```

**Why Separate?**: Seeders ensure consistent test data across environments. New developers get working demo data immediately.

---

#### **utils/** – Helper Functions & Constants

**Purpose**: Shared utilities and constants used across layers.

**Example** (`utils/error.codes.js`):

```javascript
const SuccessCode = {
  OK: 200,
  CREATED: 201,
};

const ErrorCode = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

module.exports = { SuccessCode, ErrorCode };
```

**Example** (`utils/helper.js`):

```javascript
const compareTime = (arrivalTime, departureTime) => {
  return new Date(arrivalTime) > new Date(departureTime);
};

const formatFlightResponse = (flight) => {
  return {
    id: flight.id,
    flightNumber: flight.flightNumber,
    availability: flight.totalSeats - flight.bookedSeats,
  };
};

module.exports = { compareTime, formatFlightResponse };
```

**Why Separate?**: Prevents code duplication. Common logic in one place. Easy to test and reuse.

---

#### **index.js** – Server Entry Point

**Purpose**: Bootstrap the Express server and initialize all components.

**Responsibility**:

- Load environment variables
- Initialize Express app
- Register middleware
- Connect database
- Start listening

```javascript
const express = require("express");
const bodyParser = require("body-parser");
const db = require("./models/index");
const ApiRoutes = require("./routes/index");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api", ApiRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  // Sync database schema
  if (process.env.SYNC_DB) {
    db.sequelize.sync({ alter: true });
  }
});
```

---

### Data Flow Through Layers

```
HTTP Request
    ▼
Routes (Routing)
    ▼
Controllers (HTTP Handling)
    ▼
Middleware (Validation, Auth)
    ▼
Services (Business Logic)
    ▼
Repository (Data Access)
    ▼
Models (ORM Abstraction)
    ▼
MySQL Database
    ▼
Models (ORM Mapping)
    ▼
Repository (Result Transformation)
    ▼
Services (Response Formatting)
    ▼
Controllers (JSON Serialization)
    ▼
HTTP Response
```

### Benefits of This Layered Architecture

| Benefit                    | Explanation                                                     |
| -------------------------- | --------------------------------------------------------------- |
| **Separation of Concerns** | Each layer has a single responsibility                          |
| **Testability**            | Mock dependencies; test each layer independently                |
| **Reusability**            | Services can be used in multiple contexts (API, jobs, webhooks) |
| **Maintainability**        | Changes in one layer don't ripple to others                     |
| **Scalability**            | Easy to understand and extend for new features                  |
| **Professional Standards** | Follows industry best practices (e.g., Clean Architecture)      |

---

## API Endpoints

### Base URL

```
http://localhost:8080/api/v1
```

### Flight Endpoints

#### 1. Create Flight

**Endpoint**: `POST /flights`

**Description**: Create a new flight schedule.

**Request Body**:

```json
{
  "flightNumber": "AA123",
  "airplaneId": 1,
  "departureAirportId": 1,
  "arrivalAirportId": 2,
  "departureTime": "2026-02-15T14:00:00Z",
  "arrivalTime": "2026-02-16T02:00:00Z",
  "price": 450
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "Flight created successfully",
  "data": {
    "id": 101,
    "flightNumber": "AA123",
    "airplaneId": 1,
    "departureAirportId": 1,
    "arrivalAirportId": 2,
    "departureTime": "2026-02-15T14:00:00Z",
    "arrivalTime": "2026-02-16T02:00:00Z",
    "price": 450,
    "totalSeats": 416,
    "createdAt": "2026-01-08T10:30:00Z",
    "updatedAt": "2026-01-08T10:30:00Z"
  },
  "err": {}
}
```

---

#### 2. Get All Flights

**Endpoint**: `GET /flights`

**Description**: Retrieve all flights with pagination.

**Query Parameters**:
| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Results per page (default: 10) |

**Request**:

```
GET /api/v1/flights?page=1&limit=5
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Successfully fetched flights",
  "data": [
    {
      "id": 101,
      "flightNumber": "AA123",
      "departureTime": "2026-02-15T14:00:00Z",
      "arrivalTime": "2026-02-16T02:00:00Z",
      "price": 450,
      "totalSeats": 416,
      "boardingGate": "B12"
    },
    {
      "id": 102,
      "flightNumber": "BA456",
      "departureTime": "2026-02-15T18:30:00Z",
      "arrivalTime": "2026-02-16T06:30:00Z",
      "price": 520,
      "totalSeats": 220,
      "boardingGate": "A05"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 45
  },
  "err": {}
}
```

---

#### 3. Get Flight by ID

**Endpoint**: `GET /flights/:id`

**Description**: Retrieve a specific flight with detailed information.

**Request**:

```
GET /api/v1/flights/101
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Successfully fetched flight",
  "data": {
    "id": 101,
    "flightNumber": "AA123",
    "airplane": {
      "id": 1,
      "modelNumber": "Boeing 747",
      "capacity": 416
    },
    "departureAirport": {
      "id": 1,
      "code": "JFK",
      "name": "John F. Kennedy International",
      "city": {
        "id": 1,
        "name": "New York"
      }
    },
    "arrivalAirport": {
      "id": 2,
      "code": "LHR",
      "name": "London Heathrow",
      "city": {
        "id": 2,
        "name": "London"
      }
    },
    "departureTime": "2026-02-15T14:00:00Z",
    "arrivalTime": "2026-02-16T02:00:00Z",
    "price": 450,
    "totalSeats": 416,
    "boardingGate": "B12"
  },
  "err": {}
}
```

---

#### 4. Search Flights

**Endpoint**: `GET /flights/search`

**Description**: Advanced flight search with multiple filters.

**Query Parameters**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `source` | string | No | Departure city name |
| `destination` | string | No | Arrival city name |
| `departureDate` | string | No | Departure date (YYYY-MM-DD) |
| `departureAirportId` | integer | No | Departure airport ID |
| `arrivalAirportId` | integer | No | Arrival airport ID |
| `minPrice` | integer | No | Minimum ticket price |
| `maxPrice` | integer | No | Maximum ticket price |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 10) |

**Request Examples**:

```
GET /api/v1/flights/search?source=New%20York&destination=London&departureDate=2026-02-15
```

```
GET /api/v1/flights/search?departureAirportId=1&arrivalAirportId=2&minPrice=400&maxPrice=600
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Successfully fetched flights",
  "data": [
    {
      "id": 101,
      "flightNumber": "AA123",
      "airline": "American Airlines",
      "departureCity": "New York",
      "arrivalCity": "London",
      "departureTime": "2026-02-15T14:00:00Z",
      "arrivalTime": "2026-02-16T02:00:00Z",
      "duration": "12h 00m",
      "price": 450,
      "totalSeats": 416,
      "availableSeats": 120,
      "boardingGate": "B12"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3
  },
  "err": {}
}
```

---

### Airport Endpoints

#### 5. Get All Airports

**Endpoint**: `GET /airports`

**Description**: Retrieve all airports with city information.

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Successfully fetched airports",
  "data": [
    {
      "id": 1,
      "code": "JFK",
      "name": "John F. Kennedy International",
      "address": "Jamaica, Queens, New York",
      "city": {
        "id": 1,
        "name": "New York"
      }
    },
    {
      "id": 2,
      "code": "LHR",
      "name": "London Heathrow",
      "address": "Hounslow, London",
      "city": {
        "id": 2,
        "name": "London"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  },
  "err": {}
}
```

---

### City Endpoints

#### 6. Get All Cities

**Endpoint**: `GET /cities`

**Description**: Retrieve all available cities.

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Successfully fetched cities",
  "data": [
    {
      "id": 1,
      "name": "New York"
    },
    {
      "id": 2,
      "name": "London"
    },
    {
      "id": 3,
      "name": "Tokyo"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  },
  "err": {}
}
```

---

### Error Responses

All endpoints follow consistent error handling:

**400 Bad Request**:

```json
{
  "success": false,
  "message": "Invalid request parameters",
  "data": {},
  "err": {
    "code": 400,
    "details": "Missing required field: flightNumber"
  }
}
```

**404 Not Found**:

```json
{
  "success": false,
  "message": "Flight not found",
  "data": {},
  "err": {
    "code": 404,
    "details": "Flight with ID 999 does not exist"
  }
}
```

**500 Internal Server Error**:

```json
{
  "success": false,
  "message": "Internal server error",
  "data": {},
  "err": {
    "code": 500,
    "details": "Database connection failed"
  }
}
```

---

## Setup & Installation

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **MySQL Server** (v5.7 or higher)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/flight-search-service.git
cd flight-search-service
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:

- **express**: Web framework
- **sequelize**: ORM for MySQL
- **mysql2**: MySQL database driver
- **body-parser**: Request body parsing
- **dotenv**: Environment variable management
- **nodemon**: Development auto-reload

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=airline_db
DB_DIALECT=mysql
DB_PORT=3306

# Sync database schema (only for development)
SYNC_DB=true
```

### Step 4: Create MySQL Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE airline_db;
EXIT;
```

### Step 5: Run Sequelize Migrations

Create tables based on migrations:

```bash
npx sequelize-cli db:migrate
```

Output should show:

```
Loaded configuration file "config/config.json".
Using environment "development".
== 20250710181950-create-city: migrating =======
== 20250710181950-create-city: migrated (0.123s)
== 20250713133335-create-airport: migrating =======
== 20250713133335-create-airport: migrated (0.456s)
== 20250731104133-create-airplane: migrating =======
== 20250731104133-create-airplane: migrated (0.234s)
== 20250731114649-create-flights: migrating =======
== 20250731114649-create-flights: migrated (0.345s)
```

### Step 6: Run Sequelize Seeders (Optional)

Populate database with initial data:

```bash
npx sequelize-cli db:seed:all
```

This adds sample cities, airports, and aircraft.

### Step 7: Start the Server

**Development** (with auto-reload):

```bash
npm start
```

**Production**:

```bash
NODE_ENV=production node src/index.js
```

Expected output:

```
Server is listening http://localhost:8080
```

### Step 8: Test the Service

```bash
curl http://localhost:8080/api/v1/flights
```

---

## Use Cases

### Use Case 1: Customer Flight Search

**Scenario**: A customer wants to book a flight from New York to London on February 15, 2026.

**Flow**:

1. Customer opens the airline booking website.
2. Enters: Departure (New York) → Arrival (London) → Date (2026-02-15)
3. Client app calls: `GET /api/v1/flights/search?source=New%20York&destination=London&departureDate=2026-02-15`
4. FlightAndSearch Service queries MySQL with JOINs across Flights, Airports, and Cities tables.
5. Returns list of 3 flights sorted by price.
6. Customer sees options and selects "AA123" departing 14:00.

**Key Responsibility**: FlightAndSearch ensures fast, accurate search results.

---

### Use Case 2: Booking Service Flight Validation

**Scenario**: Customer confirms booking for flight AA123. Booking Service needs to validate availability.

**Flow**:

1. Booking Service receives booking request.
2. Before creating reservation, calls: `GET /api/v1/flights/101` (get detailed flight)
3. FlightAndSearch returns:
   - Flight details: price, schedule, capacity
   - Current seat availability
   - Airport information for boarding details
4. Booking Service verifies:
   - Flight exists and is not cancelled
   - Price hasn't changed significantly
   - Seats are available
5. Booking Service creates reservation, then notifies FlightAndSearch to decrement available seats.

**Key Responsibility**: FlightAndSearch provides authoritative, real-time flight data.

---

### Use Case 3: System Scalability During Peak Season

**Scenario**: It's Christmas season. 10,000 users simultaneously search for flights.

**Challenge**: A monolithic system would struggle. All requests compete for resources.

**Solution with Microservices**:

- **FlightAndSearch scales independently**: Deploy 5 instances behind load balancer.
- **Booking Service unaffected**: If one instance goes down, others continue.
- **Database optimization**: Add indexes on frequently searched columns.
- **Cache layer**: Frequently searched routes cached in-memory.

**Key Responsibility**: FlightAndSearch handles massive concurrent load while maintaining response times < 200ms.

---

### Use Case 4: Providing Flight Metadata to Multiple Services

**Scenario**: Different internal services need flight information:

- **Notifications Service**: "Your flight is delayed"
- **Revenue Service**: "Calculate ancillary revenue from this flight"
- **Analytics Service**: "Track flight occupancy trends"

**Solution**:

- All services query FlightAndSearch API.
- Single source of truth prevents data inconsistency.
- Changes to flight data are automatically reflected across all services.

**Key Responsibility**: FlightAndSearch ensures data consistency across the ecosystem.

---

### Use Case 5: Price Optimization During Low Demand

**Scenario**: A flight from New York to London on a Tuesday has poor sales. Airlines want to reduce price dynamically.

**Flow**:

1. Revenue Service analyzes demand patterns.
2. Calls FlightAndSearch: `PATCH /api/v1/flights/101` with new price ($350).
3. FlightAndSearch updates database.
4. Next customer search returns updated price.
5. Increased bookings from price reduction.

**Key Responsibility**: FlightAndSearch supports dynamic pricing while maintaining data consistency.

---

## Technology Stack

| Component            | Technology    | Version | Purpose                           |
| -------------------- | ------------- | ------- | --------------------------------- |
| **Runtime**          | Node.js       | v16+    | JavaScript execution              |
| **Framework**        | Express.js    | v5.1.0  | Web server & routing              |
| **Database**         | MySQL         | v5.7+   | Relational data storage           |
| **ORM**              | Sequelize     | v6.37.7 | Database abstraction & migrations |
| **CLI**              | Sequelize CLI | v6.6.3  | Schema migrations & seeders       |
| **HTTP Body Parser** | body-parser   | v2.2.0  | Request body parsing              |
| **Config Manager**   | dotenv        | v17.1.0 | Environment variable management   |
| **Dev Tool**         | nodemon       | v3.1.10 | Auto-reload during development    |

---

## Contributing & Support

### Running Tests (Future Enhancement)

```bash
npm test
```

### Code Style

Follow Node.js conventions:

- Use camelCase for variables and functions
- Use PascalCase for classes
- Use UPPER_SNAKE_CASE for constants
- Indent with 2 spaces

### Reporting Issues

Create a GitHub issue with:

- Description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Environment (OS, Node version, etc.)

---

## Contact & Support

For questions or support regarding FlightAndSearch Service:

- **GitHub Issues:** [FlightAndSearch Issues](https://github.com/krishsingh120/FlightAndSearchService.git)
- **Email:** krishsin2254@gmail.com
- **Documentation:** [Full API Docs](https://docs.airline.com/FlightAndSearchservice)

---

## Appendix: Quick Reference

### Common Commands

```bash
# Start development server
npm start

# Create a new migration
npx sequelize-cli migration:generate --name create-new-table

# Run all migrations
npx sequelize-cli db:migrate

# Rollback last migration
npx sequelize-cli db:migrate:undo

# Create a seeder
npx sequelize-cli seed:generate --name add-sample-data

# Run all seeders
npx sequelize-cli db:seed:all

# Connect to MySQL
mysql -u root -p airline_db
```

### Useful MySQL Queries

```sql
-- View all flights with airport details
SELECT f.flightNumber, f.departureTime, f.arrivalTime,
       da.code as departure_airport, aa.code as arrival_airport,
       f.price, f.totalSeats
FROM Flights f
JOIN Airports da ON f.departureAirportId = da.id
JOIN Airports aa ON f.arrivalAirportId = aa.id
ORDER BY f.departureTime;

-- Find flights between two cities
SELECT f.*, c1.name as departure_city, c2.name as arrival_city
FROM Flights f
JOIN Airports da ON f.departureAirportId = da.id
JOIN Airports aa ON f.arrivalAirportId = aa.id
JOIN Cities c1 ON da.cityId = c1.id
JOIN Cities c2 ON aa.cityId = c2.id
WHERE c1.name = 'New York' AND c2.name = 'London';
```

---

**Happy flying!**