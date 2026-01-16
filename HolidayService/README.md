# Holiday Service API

A microservice for managing employee holiday requests built with TypeScript, Express, and PostgreSQL.

## Features

- 🔐 JWT Authentication (via Auth Service)
- 📅 Create, update, and delete holiday requests
- ✅ Admin approval/rejection workflow
- 📊 Holiday statistics per user
- 🔗 Integration with ToDoChart service (prevents holidays during pending tasks)
- � **RabbitMQ Logging with Correlation ID tracking**
- 🗄️ **Log management endpoints (fetch, query, delete)**
- 🐳 Docker support

## Tech Stack

- **TypeScript** - Strongly typed JavaScript
- **Express** - Web framework
- **TypeORM** - ORM for PostgreSQL (similar to Entity Framework)
- **PostgreSQL** - Database
- **JWT** - Authentication
- **RabbitMQ** - Message broker for logging
- **Docker** - Containerization

## Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Running Auth Service (for authentication)
- Running ToDoChart Service (for task validation)








## API Endpoints

### Authentication
All endpoints require JWT token from Auth Service in the header:
```
Authorization: Bearer <your-jwt-token>
```

### User Endpoints

#### Create Holiday Request
```http
POST /holidayService/requests
Content-Type: application/json
Authorization: Bearer <token>

{
  "startDate": "2026-02-01",
  "endDate": "2026-02-05",
  "reason": "Family vacation"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "string",
  "userName": "john",
  "startDate": "2026-02-01",
  "endDate": "2026-02-05",
  "reason": "Family vacation",
  "status": "pending",
  "numberOfDays": 5,
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-10T10:00:00.000Z"
}
```

#### Get My Holiday Requests
```http
GET /holidayService/requests?status=all
Authorization: Bearer <token>
```

Query parameters:
- `status` - Filter by status: `pending`, `approved`, `rejected`, `all` (default: all)

#### Get Specific Request
```http
GET /holidayService/requests/:id
Authorization: Bearer <token>
```

#### Update Holiday Request (Pending Only)
```http
PUT /holidayService/requests/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "startDate": "2026-02-02",
  "endDate": "2026-02-06",
  "reason": "Updated reason"
}
```

#### Delete Holiday Request (Pending Only)
```http
DELETE /holidayService/requests/:id
Authorization: Bearer <token>
```

#### Get My Holiday Statistics
```http
GET /holidayService/requests/stats/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalRequested": 5,
  "approved": 3,
  "pending": 1,
  "rejected": 1,
  "approvedDays": 15
}
```

### Admin Endpoints

#### Get All Holiday Requests
```http
GET /holidayService/admin/requests?status=pending
Authorization: Bearer <admin-token>
```

Query parameters:
- `status` - Filter: `pending`, `approved`, `rejected`, `all`
- `userId` - Filter by user ID
- `startDate` - Filter by start date
- `endDate` - Filter by end date

#### Review Holiday Request (Approve/Reject)
```http
POST /holidayService/admin/requests/:id/review
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "status": "approved",
  "reviewComment": "Approved for good performance"
}
```

Status must be: `approved` or `rejected`

#### Delete Any Holiday Request
```http
DELETE /holidayService/admin/requests/:id
Authorization: Bearer <admin-token>
```

#### Get User Statistics
```http
GET /holidayService/admin/stats/:userId
Authorization: Bearer <admin-token>
```

## Business Rules

1. **Date Validation:**
   - Start date must be before end date
   - Cannot request holidays for past dates
   - Cannot have overlapping holiday requests

2. **Task Validation:**
   - Users cannot request holidays if they have pending/in-progress tasks during that period
   - Integrates with ToDoChart service to check for conflicts

3. **Status Management:**
   - Only pending requests can be updated or deleted by users
   - Only admins can approve/reject requests
   - Only admins can delete non-pending requests




## Database Schema

### HolidayRequest Entity
```typescript
{
  id: UUID (primary key)
  userId: string (from Auth service)
  userName: string
  startDate: date
  endDate: date
  reason: text (optional)
  status: enum (pending, approved, rejected)
  reviewedBy: string (optional)
  reviewComment: text (optional)
  reviewedAt: timestamp (optional)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Log Entity
```typescript
{
  id: UUID (primary key)
  timestamp: timestamp (indexed)
  logType: enum (INFO, ERROR, WARN)
  url: string
  correlationId: string (indexed)
  serviceName: string
  message: string
  method: string (optional)
  statusCode: number (optional)
  userId: string (optional)
  createdAt: timestamp
}
```

## Logging System

Storitev uporablja RabbitMQ za upravljanje logov z naslednjimi funkcionalnostmi:

### Correlation ID
- Vsak request dobi unikaten correlation ID (UUID)
- Correlation ID se prenaša med mikrostoritvami preko X-Correlation-Id headerja
- Omogoča sledljivost dogodkov preko večih storitev

### Log Format
```
<timestamp> <LogType> <URL> <CorrelationId> <serviceName> - <Message>

Primer:
2026-01-16T10:30:45.123Z INFO http://localhost:5004/holidayService/requests Correlation: 550e8400-e29b-41d4-a716-446655440000 HolidayService - Incoming GET request
```

### Log Endpoints

#### POST /logs
Prenese vse loge iz RabbitMQ queue-ja in jih shrani v bazo podatkov.
```bash
curl -X POST http://localhost:5004/logs \
  -H "Authorization: Bearer <jwt_token>"
```

Response:
```json
{
  "message": "Logs fetched and saved successfully",
  "count": 150,
  "logs": [...]
}
```

#### GET /logs/:dateFrom/:dateTo
Pridobi vse loge med dvema datuma (format: YYYY-MM-DD).
```bash
curl -X GET http://localhost:5004/logs/2026-01-01/2026-01-31 \
  -H "Authorization: Bearer <jwt_token>"
```

Response:
```json
{
  "dateFrom": "2026-01-01T00:00:00.000Z",
  "dateTo": "2026-01-31T23:59:59.999Z",
  "count": 45,
  "logs": [...]
}
```

#### DELETE /logs
Izbriše vse loge iz baze podatkov.
```bash
curl -X DELETE http://localhost:5004/logs \
  -H "Authorization: Bearer <jwt_token>"
```

Response:
```json
{
  "message": "All logs deleted successfully",
  "deletedCount": 150
}
```

#### GET /logs?logType=ERROR&limit=50
Pridobi loge s filtriranjem (opcijsko).
```bash
curl -X GET "http://localhost:5004/logs?logType=ERROR&limit=50" \
  -H "Authorization: Bearer <jwt_token>"
```

#### GET /logs/correlation/:correlationId
Pridobi vse loge za določen correlation ID (za sledljivost).
```bash
curl -X GET http://localhost:5004/logs/correlation/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <jwt_token>"
```

### RabbitMQ Configuration
- **Exchange**: `logs_exchange` (topic)
- **Queue**: `holiday_service_logs`
- **Routing Key**: `holiday.logs`
- **Connection**: Konfigurirana preko Docker Compose
}
```
