# API Documentation - Anti-DDoS Protection System

Base URL: `http://localhost:3001/api`

## Authentication

All endpoints (except `/auth/login`) require a Bearer token in the Authorization header.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ddos-protection.cz",
  "password": "Admin123!"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@ddos-protection.cz",
    "role": "owner",
    "full_name": "System Administrator"
  }
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

## Users (Owner Only)

### List Users

```http
GET /api/users
Authorization: Bearer <token>
```

### Create User

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "role": "subuser",
  "full_name": "John Doe"
}
```

### Update User

```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "full_name": "Jane Doe"
}
```

### Delete User

```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

## IP Addresses

### List IPs

```http
GET /api/ips
Authorization: Bearer <token>
```

### Get IP Details

```http
GET /api/ips/:id
Authorization: Bearer <token>
```

### Create IP (Owner Only)

```http
POST /api/ips
Authorization: Bearer <token>
Content-Type: application/json

{
  "ip_address": "192.168.1.100",
  "label": "Web Server",
  "firewall_mode": "filter"
}
```

### Update IP

```http
PUT /api/ips/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Database Server",
  "status": "active",
  "firewall_mode": "drop"
}
```

### Delete IP (Owner Only)

```http
DELETE /api/ips/:id
Authorization: Bearer <token>
```

## Attack Logs

### Get Attack Logs

```http
GET /api/attacks/:ipId?limit=100&offset=0
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit`: Number of records (default: 100)
- `offset`: Pagination offset (default: 0)
- `startDate`: Filter by start date (ISO 8601)
- `endDate`: Filter by end date (ISO 8601)

### Get Attack Statistics

```http
GET /api/attacks/:ipId/stats?days=7
Authorization: Bearer <token>
```

**Response:**

```json
{
  "total_attacks": 1234,
  "blocked_attacks": 1200,
  "top_countries": [
    { "country_code": "CN", "count": 500 },
    { "country_code": "RU", "count": 300 }
  ],
  "top_asns": [
    { "asn": "AS13335", "count": 200 }
  ],
  "top_ports": [
    { "port": 80, "count": 600 },
    { "port": 443, "count": 400 }
  ],
  "top_protocols": [
    { "protocol": "tcp", "count": 800 },
    { "protocol": "udp", "count": 400 }
  ]
}
```

## Geo-Blocking

### List Geo-Blocks

```http
GET /api/geoblocks/:ipId
Authorization: Bearer <token>
```

### Create Geo-Block (Owner Only)

```http
POST /api/geoblocks
Authorization: Bearer <token>
Content-Type: application/json

{
  "ip_id": "uuid",
  "country_code": "CN",
  "action": "block"
}
```

### Update Geo-Block (Owner Only)

```http
PUT /api/geoblocks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "allow"
}
```

### Delete Geo-Block (Owner Only)

```http
DELETE /api/geoblocks/:id
Authorization: Bearer <token>
```

## Firewall Rules

### List Firewall Rules

```http
GET /api/firewall/:ipId
Authorization: Bearer <token>
```

### Create Firewall Rule (Owner Only)

```http
POST /api/firewall
Authorization: Bearer <token>
Content-Type: application/json

{
  "ip_id": "uuid",
  "port": 80,
  "protocol": "tcp",
  "action": "allow",
  "description": "HTTP traffic"
}
```

### Update Firewall Rule (Owner Only)

```http
PUT /api/firewall/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "deny",
  "description": "Block HTTP"
}
```

### Delete Firewall Rule (Owner Only)

```http
DELETE /api/firewall/:id
Authorization: Bearer <token>
```

## Rate Limits

- **Login**: 5 requests per 15 minutes
- **Read operations (GET)**: 100 requests per minute
- **Write operations (POST/PUT/DELETE)**: 30 requests per minute

Exceeding limits returns HTTP 429 with:

```json
{
  "error": "Too many requests, please try again later"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## WebSocket

Connect to WebSocket for real-time updates:

```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:3001');

// Subscribe to IP updates
socket.emit('subscribe:ip', ipId);

// Listen for attack events
socket.on('attack:new', (data) => {
  console.log('New attack:', data);
});

// Unsubscribe
socket.emit('unsubscribe:ip', ipId);
```
