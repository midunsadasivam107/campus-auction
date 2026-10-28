# API Reference

> Full API documentation will be added as endpoints are implemented.

## Base URL

```
Development: http://localhost:5000/api
Production:  https://campus-auction-api.onrender.com/api
```

## Authentication

All authenticated endpoints require a valid JWT cookie (set automatically on login).

## Health Check

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-10-28T04:00:00.000Z",
  "uptime": 123.456
}
```
