# Holiday Service API

A microservice for managing employee holiday requests built with TypeScript, Express, and PostgreSQL.

## Features

- 🔐 JWT Authentication (via Auth Service)
- 📅 Create, update, and delete holiday requests
- ✅ Admin approval/rejection workflow
- 📊 Holiday statistics per user
- 🔗 Integration with ToDoChart service (prevents holidays during pending tasks)
- 🐳 Docker support

## Tech Stack

- **TypeScript** - Strongly typed JavaScript
- **Express** - Web framework
- **TypeORM** - ORM for PostgreSQL (similar to Entity Framework)
- **PostgreSQL** - Database
- **JWT** - Authentication
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


## Integration with Other Services



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