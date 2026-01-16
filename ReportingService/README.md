# ReportingService

Microservice for generating and managing reports with RabbitMQ logging integration. Pulls work hours data from the Workhours API and generates payroll/productivity reports.

## Features

- **Create reports from Workhours API** — automatically fetch employee hours for a period and calculate pay
- **Create manual reports** — manually input hours and payment data
- **Update report fields** — modify hours, rates, pay, or notes
- **Update report status** — mark reports as draft, approved, paid, etc.
- **Delete reports** — remove single reports or clear all
- **Fetch and store logs** — pull RabbitMQ logs to database
- **View logs** — retrieve all stored logs with timestamps and details
- **RabbitMQ logging** — distributed logging with topic-based message routing
- **JWT authentication** — all endpoints protected with Bearer token auth
- **Correlation ID tracking** — trace requests across services
- **TypeORM with PostgreSQL** — persistent storage with migrations



## API Endpoints

All endpoints require JWT authentication (`Authorization: Bearer <token>`), except `/health`.

### Health Check

**GET /health** — Service health status (public, no auth required)
- **Response:** `{ "status": "ok" }`

### Reports API (`/reporting`)

#### **POST /reporting/fetch** — Create report from Workhours API
Fetches work hours for a specific employee from the Workhours service for a given period, calculates total pay based on hourly rate, and creates a draft report.

- **Headers:** `Authorization: Bearer {jwt_token}`
- **Body:**
  ```json
  {
    "userId": "user-123",
    "periodStart": "2026-01-01",
    "periodEnd": "2026-01-31",
    "hourlyRate": 25,
    "notes": "January payroll"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "uuid",
    "userId": "user-123",
    "periodStart": "2026-01-01",
    "periodEnd": "2026-01-31",
    "totalHours": 160,
    "hourlyRate": 25,
    "totalPay": 4000,
    "source": "workhours",
    "status": "draft",
    "notes": "January payroll",
    "createdAt": "2026-01-16T21:30:00Z",
    "updatedAt": "2026-01-16T21:30:00Z"
  }
  ```

#### **POST /reporting** — Create manual report
Manually create a report with specified hours and payment data (no Workhours API call).

- **Headers:** `Authorization: Bearer {jwt_token}`
- **Body:**
  ```json
  {
    "userId": "user-456",
    "periodStart": "2026-01-01",
    "periodEnd": "2026-01-31",
    "totalHours": 160,
    "hourlyRate": 30,
    "totalPay": 4800,
    "notes": "Manual Q1 entry"
  }
  ```
- **Response (201 Created):** Similar structure with `source: "manual"`

#### **GET /reporting** — List all reports (with optional filtering)
Retrieve all reports, optionally filtered by user ID. Returns reports ordered by period start date (newest first).

- **Headers:** `Authorization: Bearer {jwt_token}`
- **Query Parameters:**
  - `userId` (optional) — Filter by specific user
- **Example:** `GET /reporting?userId=user-123`
- **Response (200 OK):** Array of report objects
  ```json
  [
    { id, userId, periodStart, ... },
    { id, userId, periodStart, ... }
  ]
  ```

#### **GET /reporting/:id** — Get single report by ID
Retrieve detailed information for a specific report.

- **Headers:** `Authorization: Bearer {jwt_token}`
- **URL Params:** `id` (report UUID)
- **Response (200 OK):** Single report object

#### **PUT /reporting/:id** — Update report fields
Modify existing report data (hours, rate, pay, notes). Automatically recalculates total pay if hours or rate changes.

- **Headers:** `Authorization: Bearer {jwt_token}`
- **URL Params:** `id` (report UUID)
- **Body:**
  ```json
  {
    "hourlyRate": 35,
    "totalHours": 150,
    "notes": "Revised after review"
  }
  ```
- **Response (200 OK):** Updated report object

#### **PUT /reporting/:id/status** — Update report status
Change the status of a report (e.g., draft → approved → paid).

- **Headers:** `Authorization: Bearer {jwt_token}`
- **URL Params:** `id` (report UUID)
- **Body:**
  ```json
  {
    "status": "approved"
  }
  ```
- **Response (200 OK):** Updated report with new status

#### **DELETE /reporting/:id** — Delete single report
Remove a specific report from the database.

- **Headers:** `Authorization: Bearer {jwt_token}`
- **URL Params:** `id` (report UUID)
- **Response (200 OK):** `{ "message": "Report deleted" }`

#### **DELETE /reporting** — Delete all reports
Permanently remove all reports from the database.

- **Headers:** `Authorization: Bearer {jwt_token}`
- **Response (200 OK):** `{ "message": "All reports deleted", "deleted": 42 }`

### Logs API (`/logs`)

#### **POST /logs** — Fetch and save logs
Consume all pending log messages from RabbitMQ and persist them to the database.

- **Headers:** `Authorization: Bearer {jwt_token}`
- **Response (200 OK):**
  ```json
  {
    "message": "Saved 25 logs"
  }
  ```

#### **GET /logs** — Retrieve all logs
Get all stored logs from the database, ordered by creation date (newest first).

- **Headers:** `Authorization: Bearer {jwt_token}`
- **Response (200 OK):** Array of log objects
  ```json
  [
    {
      "id": "uuid",
      "timestamp": "2026-01-16T21:30:00Z",
      "logType": "INFO",
      "message": "Incoming POST request",
      "correlationId": "abc-123",
      "serviceName": "ReportingService",
      "url": "http://localhost:5008/reporting/fetch",
      "method": "POST",
      "statusCode": 201,
      "userId": "user-123",
      "createdAt": "2026-01-16T21:30:00Z"
    }
  ]
  ```

#### **DELETE /logs** — Clear all logs
Delete all stored logs from the database.

- **Headers:** `Authorization: Bearer {jwt_token}`
- **Response (200 OK):**
  ```json
  {
    "message": "Logs deleted",
    "deleted": 42
  }
  ```

## Request/Response Examples

### Example 1: Create report from Workhours
```bash
curl -X POST http://localhost:5008/reporting/fetch \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "emp-001",
    "periodStart": "2026-01-01",
    "periodEnd": "2026-01-31",
    "hourlyRate": 25
  }'
```

### Example 2: List reports for a user
```bash
curl -X GET "http://localhost:5008/reporting?userId=emp-001" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 3: Update report status to approved
```bash
curl -X PUT http://localhost:5008/reporting/abc-123-def/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

## Docker

Build and run with Docker Compose:
```bash
docker compose build reporting-service
docker compose up reporting-service reporting-db rabbitmq
```

## Testing

1. **Import Postman collection:** [ReportingService_postman.json](ReportingService_postman.json)
2. **Set variables:**
   - `baseUrl`: `http://localhost:5008`
   - `jwt_token`: Your JWT token from auth-api
3. **Create sample workhours:**
   ```bash
   curl -X POST http://localhost:3002/workHours/log \
     -H "Authorization: Bearer {jwt_token}" \
     -H "Content-Type: application/json" \
     -d '{"workDate": "2026-01-15", "hours": 8}'
   ```
4. **Run endpoint requests** from the Postman collection

## Architecture

- **Framework:** Express.js (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL with TypeORM
- **Logging:** RabbitMQ (topic exchange `logs_exchange`)
- **Auth:** JWT Bearer token validation
- **External Integration:** Workhours API (`GET /workHours/my`)

---

**Service Port:** 5008  
**Database Port:** 5437 (external) / 5432 (internal)  
**RabbitMQ Queue:** `reporting_service_logs`  
**Routing Key:** `reporting.logs`

