# ReportingService - Quick Start

## 1. Dependencies
```bash
npm install
```

## 2. Database & Services
```bash
docker compose up -d reporting-db rabbitmq auth-api workhours-api
```

Wait ~10s for services to be healthy, then:

## 3. Run in Development
```bash
npm run dev
```

or build and start:
```bash
npm run build
npm start
```

## 4. Test Endpoints

Get JWT token from auth-api (e.g., login/register), then use Postman:

**Create Report from Workhours:**
```
POST http://localhost:5008/reporting/fetch
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "userId": "user-123",
  "periodStart": "2026-01-01",
  "periodEnd": "2026-01-31",
  "hourlyRate": 25
}
```

**Create Manual Report:**
```
POST http://localhost:5008/reporting
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "userId": "user-123",
  "periodStart": "2026-01-01",
  "periodEnd": "2026-01-31",
  "totalHours": 160,
  "hourlyRate": 25,
  "notes": "Q1 Review"
}
```

**List Reports:**
```
GET http://localhost:5008/reporting?userId=user-123
Authorization: Bearer {JWT_TOKEN}
```

**Check Health:**
```
GET http://localhost:5008/health
```

## 5. Logs

Fetch logs from RabbitMQ and save to DB:
```
POST http://localhost:5008/logs
Authorization: Bearer {JWT_TOKEN}
```

Retrieve logs:
```
GET http://localhost:5008/logs
Authorization: Bearer {JWT_TOKEN}
```

---

See [README.md](README.md) for full API documentation.
