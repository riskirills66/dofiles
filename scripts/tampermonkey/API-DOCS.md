# Verification API Documentation

A Node.js HTTP server that provides endpoints for managing agent verification and session management.

## Server Configuration

- **Port**: 8092
- **Base URL**: `http://localhost:8092`

## Database Configuration

- **Server**: 10.0.0.2:1433
- **Database**: otomax
- **User**: server

## Endpoints

### 1. Get Verification Data

```
GET /verification?session={sessionId}
```

Retrieves pending verification records.

**Query Parameters:**
- `session` (optional): PHP session ID (default: `7fc0hb51jvduh2q955o0tagejk`)

**Response:**
```json
[
  {
    "verificationId": "123",
    "agentCode": "APPS1234",
    "imageUrl": "https://images.otoreport.com/foto_agen/..."
  }
]
```

### 2. Get User by Agent Code

```
GET /user/{agentCode}?session={sessionId}
```

Retrieves verification records for a specific agent, including both Selfie and KTP images.

**Path Parameters:**
- `agentCode`: Agent code (e.g., APPS1234)

**Query Parameters:**
- `session` (optional): PHP session ID

**Response:**
```json
[
  {
    "verificationId": "123",
    "agentCode": "APPS1234",
    "imageUrl": "https://images.otoreport.com/foto_agen/...",
    "type": "Selfie",
    "status": "Menunggu Diverifikasi"
  },
  {
    "verificationId": "123",
    "agentCode": "APPS1234",
    "imageUrl": "https://images.otoreport.com/foto_ktp/...",
    "type": "KTP",
    "status": "Menunggu Diverifikasi"
  }
]
```

**Status Values:**
- `Menunggu Diverifikasi` - Pending verification
- `Verified` - Verified
- `Menunggu Diverifikasi Perbaikannya` - Pending correction
- `Verifikasi Ditolak` - Rejected
- `Belum Diverifikasi` - Not yet verified

### 3. Verify User

```
POST /verify
```

Submits verification action for an agent. Automatically updates agent level in database upon successful verification.

**Body Parameters (x-www-form-urlencoded):**
- `id` (required): Verification ID
- `agentCode` (optional): Agent code for level update
- `status` (optional): Verification status (default: "1")
- `statusktp` (optional): KTP status (default: "1")
- `keterangan` (optional): Notes (default: "%23RK")
- `session` (optional): PHP session ID

**Response:**
```json
{
  "success": true,
  "id": "123",
  "message": "Verification successful",
  "levelUpdate": {
    "oldLevel": "B",
    "newLevel": "A",
    "upline": "APPS5678"
  }
}
```

**Level Update Logic:**
- If upline is `RMWAPPS`, agent level is set to `A`
- Otherwise, agent inherits upline's level
- Updates `reseller` table: `kode_level` field

### 4. Unlock Session

```
POST /unlock-session/{agentCode}?session={sessionId}
```

Unlocks session limitation for an agent.

**Path Parameters:**
- `agentCode`: Agent code to unlock

**Query Parameters:**
- `session` (optional): PHP session ID

**Response:**
```json
{
  "success": true,
  "agentCode": "APPS1234",
  "message": "Session unlocked successfully"
}
```

## Error Responses

All endpoints return error responses in this format:

```json
{
  "error": "Error message",
  "success": false
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (missing parameters)
- `404` - Not found
- `500` - Server error

## External Dependencies

- **rmwapps.otoreport.com**: External verification system
- **images.otoreport.com**: Image hosting service
- **SQL Server**: Agent data storage

## Database Tables

### reseller
- `kode` - Agent code (primary key)
- `kode_level` - Agent level
- `kode_upline` - Upline agent code
