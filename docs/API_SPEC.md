# REST API Specification & Contract
## Project: Eary System – Language Words Hearing Assessment Platform

**Document Version:** 2.0.0  
**Base URL:** `http://localhost:4000/api/v1`  
**Protocol:** HTTP/1.1 (HTTPS in Production)  
**Authentication Scheme:** Bearer Token (Stateless JSON Web Token)  
**Last Updated:** October 2026  

---

## 1. Global API Standards & Conventions

### 1.1 Headers
- **Content-Type**: `application/json` for all standard REST payloads; `multipart/form-data` for audio file uploads.
- **Authorization**: `Bearer <access_token>` required on all protected endpoints.

### 1.2 Uniform Response Envelopes

#### Success Envelope (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

#### Failure Envelope (`400`, `401`, `403`, `404`, `409`, `500`)
```json
{
  "success": false,
  "message": "Validation failed / Resource not found",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

---

## 2. Authentication & Account Endpoints (`/api/v1/auth`)

### 2.1 Register New Account
- **Endpoint**: `POST /api/v1/auth/register`
- **Access**: Public
- **Description**: Registers a new patient user account with bcrypt password hashing.

#### Request Body
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "phone": "+1234567890",
  "dob": "1995-05-15",
  "gender": "female",
  "preferred_language": "AR"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 12,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "role": "user",
    "status": "active",
    "dob": "1995-05-15",
    "gender": "female",
    "createdAt": "2026-10-23T20:00:00.000Z"
  }
}
```

---

### 2.2 Login & Issue Tokens
- **Endpoint**: `POST /api/v1/auth/login`
- **Access**: Public
- **Description**: Verifies email/password and returns a short-lived access token and refresh token.

#### Request Body
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 12,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "status": "active"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "d7a8f9b2c3e4...",
      "expiresIn": "15m"
    }
  }
}
```

---

### 2.3 Refresh Access Token
- **Endpoint**: `POST /api/v1/auth/refresh`
- **Access**: Public
- **Description**: Exchanges a valid refresh token for a new 15-minute access token.

#### Request Body
```json
{
  "refreshToken": "d7a8f9b2c3e4..."
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m"
  }
}
```

---

### 2.4 Logout & Invalidate Session
- **Endpoint**: `POST /api/v1/auth/logout`
- **Access**: Authenticated (Bearer Token)
- **Description**: Invalidates the active refresh token in the database.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2.5 Get Current Profile
- **Endpoint**: `GET /api/v1/auth/me`
- **Access**: Authenticated (Bearer Token)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 12,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "dob": "1995-05-15",
    "gender": "female",
    "role": "user",
    "status": "active"
  }
}
```

---

## 3. Language Words CMS Endpoints (`/api/v1/words`) [Admin]

### 3.1 List All Word Items
- **Endpoint**: `GET /api/v1/words`
- **Access**: Admin (`role: admin`)
- **Query Parameters**:
  - `language`: `AR` | `EN` (optional)
  - `category`: `ADULT` | `CHILD` (optional)
  - `status`: `ACTIVE` | `INACTIVE` (optional)
  - `page`: default `1`
  - `limit`: default `20`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Word items retrieved successfully",
  "data": {
    "words": [
      {
        "id": 101,
        "word": "سمك",
        "ipa_transcription": "/samak/",
        "audio_url": "http://localhost:4000/uploads/audio/172972-audio.mp3",
        "language": "AR",
        "category": "ADULT",
        "status": "active",
        "options": [
          { "id": 401, "text": "سمك", "is_correct": true, "phoneme_tag": null },
          { "id": 402, "text": "شمع", "is_correct": false, "phoneme_tag": "voicing" },
          { "id": 403, "text": "صمغ", "is_correct": false, "phoneme_tag": "place" }
        ]
      }
    ],
    "pagination": {
      "total": 85,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

---

### 3.2 Create Word Item with Audio
- **Endpoint**: `POST /api/v1/words`
- **Access**: Admin (`role: admin`)
- **Content-Type**: `multipart/form-data`

#### Form Fields
- `word`: "bat"
- `ipa_transcription`: "/bæt/"
- `language`: "EN"
- `category`: "ADULT"
- `audio`: `<binary file (.mp3 / .wav)>`
- `options`: JSON string:
  ```json
  [
    { "text": "bat", "is_correct": true },
    { "text": "pat", "is_correct": false, "phoneme_tag": "voicing" },
    { "text": "bet", "is_correct": false, "phoneme_tag": "vowel_formant" },
    { "text": "bad", "is_correct": false, "phoneme_tag": "place" }
  ]
  ```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Word item created successfully",
  "data": {
    "id": 102,
    "word": "bat",
    "ipa_transcription": "/bæt/",
    "audio_url": "http://localhost:4000/uploads/audio/172973-bat.mp3",
    "language": "EN",
    "category": "ADULT",
    "status": "active",
    "options": [
      { "id": 404, "text": "bat", "is_correct": true, "phoneme_tag": null },
      { "id": 405, "text": "pat", "is_correct": false, "phoneme_tag": "voicing" },
      { "id": 406, "text": "bet", "is_correct": false, "phoneme_tag": "vowel_formant" },
      { "id": 407, "text": "bad", "is_correct": false, "phoneme_tag": "place" }
    ]
  }
}
```

---

### 3.3 Soft-Delete / Deactivate Word Item
- **Endpoint**: `DELETE /api/v1/words/:id`
- **Access**: Admin (`role: admin`)
- **Description**: Sets word item status to `INACTIVE`. Does not hard-delete to safeguard patient audit trails.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Word item deactivated successfully (audit history preserved)"
}
```

---

## 4. Test Session & Assessment Endpoints (`/api/v1/tests`)

### 4.1 Assemble Dynamic Test Session
- **Endpoint**: `GET /api/v1/tests/session`
- **Access**: Authenticated (`role: user` or `role: admin`)
- **Query Parameters**:
  - `language`: `AR` | `EN` (required)
  - `category`: `ADULT` | `CHILD` (required)
  - `count`: default `20`

> **Anti-Cheat Guard**: Option flags `is_correct` and `phoneme_tag` are explicitly omitted from the response.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Dynamic test session generated",
  "data": {
    "sessionId": "sess-4a8b-9f12",
    "language": "AR",
    "category": "ADULT",
    "totalQuestions": 20,
    "questions": [
      {
        "questionId": 101,
        "audioUrl": "http://localhost:4000/uploads/audio/172972-audio.mp3",
        "options": [
          { "answerId": 401, "text": "سمك" },
          { "answerId": 402, "text": "شمع" },
          { "answerId": 403, "text": "صمغ" }
        ]
      }
    ]
  }
}
```

---

### 4.2 Submit Completed Test
- **Endpoint**: `POST /api/v1/tests/submit`
- **Access**: Authenticated (`role: user`)
- **Description**: Evaluates submitted choices, calculates WRS %, determines speech discrimination tier, identifies phoneme confusion patterns, and stores the medical result audit record.

#### Request Body
```json
{
  "sessionId": "sess-4a8b-9f12",
  "language": "AR",
  "category": "ADULT",
  "durationSeconds": 145,
  "answers": [
    { "questionId": 101, "selectedAnswerId": 401 },
    { "questionId": 102, "selectedAnswerId": 405 }
  ]
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Test evaluated and saved successfully",
  "data": {
    "resultId": 501,
    "score": 95.0,
    "tier": "excellent",
    "correctCount": 19,
    "totalQuestions": 20,
    "durationSeconds": 145,
    "diagnosticSummary": "Normal speech discrimination within standard conversational limits.",
    "recommendation": "Routine periodic screening in 12 months.",
    "errorSummary": {
      "totalErrors": 1,
      "breakdown": [
        {
          "type": "voicing",
          "count": 1,
          "details": "Target: 'bat' / Selected: 'pat'"
        }
      ]
    }
  }
}
```

---

## 5. Reports & Diagnostic History Endpoints (`/api/v1/reports`)

### 5.1 Patient Result History
- **Endpoint**: `GET /api/v1/reports/history`
- **Access**: Authenticated (Patient queries own; Admin can append `?userId=12`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Historical results retrieved",
  "data": [
    {
      "resultId": 501,
      "score": 95.0,
      "tier": "excellent",
      "language": "AR",
      "category": "ADULT",
      "date": "2026-10-23T21:15:00.000Z",
      "correctCount": 19,
      "totalQuestions": 20
    }
  ]
}
```

---

### 5.2 Single Result Detailed Diagnostic Breakdown
- **Endpoint**: `GET /api/v1/reports/:id`
- **Access**: Authenticated (Owner or Admin)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Result breakdown retrieved",
  "data": {
    "resultId": 501,
    "patient": {
      "id": 12,
      "name": "Jane Doe",
      "dob": "1995-05-15",
      "gender": "female"
    },
    "test": {
      "language": "AR",
      "category": "ADULT",
      "date": "2026-10-23T21:15:00.000Z",
      "durationSeconds": 145,
      "score": 95.0,
      "tier": "excellent"
    },
    "errorSummary": {
      "totalErrors": 1,
      "breakdown": [{ "type": "voicing", "count": 1 }]
    },
    "items": [
      {
        "questionId": 101,
        "word": "سمك",
        "selectedAnswer": "سمك",
        "isCorrect": true
      },
      {
        "questionId": 102,
        "word": "bat",
        "selectedAnswer": "pat",
        "isCorrect": false,
        "phonemeTag": "voicing"
      }
    ]
  }
}
```

---

### 5.3 Download Clinical PDF Report
- **Endpoint**: `GET /api/v1/reports/:id/pdf`
- **Access**: Authenticated (Owner or Admin)
- **Response**: `application/pdf` binary stream with `Content-Disposition: attachment; filename="Eary_Report_501.pdf"`.

---

## 6. User Management Endpoints (`/api/v1/users`) [Admin]

### 6.1 List Users
- **Endpoint**: `GET /api/v1/users`
- **Access**: Admin (`role: admin`)
- **Query Parameters**: `role`, `status`, `search`, `page`, `limit`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": 12,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "user",
        "status": "active",
        "createdAt": "2026-10-23T20:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20 }
  }
}
```

---

### 6.2 Toggle User Status
- **Endpoint**: `PATCH /api/v1/users/:id/status`
- **Access**: Admin (`role: admin`)

#### Request Body
```json
{
  "status": "inactive"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "id": 12,
    "status": "inactive"
  }
}
```

---

## 7. Status & Health Check

### 7.1 System Health
- **Endpoint**: `GET /api/v1/health`
- **Access**: Public

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Eary System API is operational",
  "data": {
    "status": "healthy",
    "timestamp": "2026-10-23T23:15:00.000Z",
    "version": "2.0.0"
  }
}
```
