# System Architecture Document
## Project: Eary System – Language Words Hearing Assessment Platform

**Document Version:** 2.0.0  
**Status:** Approved / Active  
**Author / Team:** Eary Engineering & Architecture Team  
**Last Updated:** October 2026  

---

## 1. System Overview & Architectural Patterns

The **Eary System** backend is designed as a modular, stateless, three-tier RESTful service built with **Node.js**, **Express.js**, **Prisma ORM**, and **MySQL**. It is specifically structured for high reliability, maintainability, and clean separation of concerns when administering and evaluating audiological language tests.

### 1.1 Core Architectural Principles
1. **Layered Separation of Concerns (3-Tier Architecture)**:
   - **Presentation / HTTP Layer (`routes/` & `controllers/`)**: Handles request routing, parameter extraction, validation, and JSON response serialization.
   - **Domain / Business Logic Layer (`services/`)**: Pure business logic containing scoring algorithms, session randomization, phoneme confusion classification, and PDF generation.
   - **Data Access Layer (`prisma/` & `config/prisma.js`)**: Type-safe database interactions through a shared Prisma client instance.
2. **Stateless Authentication & Authorization**:
   - Access tokens are self-contained **JSON Web Tokens (JWT)** with 15-minute expirations.
   - Refresh tokens (7-day TTL) allow secure session renewal without database roundtrips for every API request.
   - Strict Role-Based Access Control (RBAC) separates standard patients (`user`) from system administrators (`admin`).
3. **Data Integrity & Medical Audit Immutability**:
   - Historical test submissions (`Result` and `ResultItem`) use `onDelete: Restrict` relationships against words and answers. Deleting or deactivating CMS content never invalidates or deletes patient medical records.
4. **Standardized Response Envelope**:
   - All client responses follow a uniform contract for success and failure states, ensuring predictable client-side integration.

---

## 2. High-Level System Architecture Diagram

```mermaid
graph TB
    subgraph ClientLayer [Client Applications]
        WebClient[Web Frontend / Mobile Browser]
        AdminDashboard[Admin CMS Portal]
    end

    subgraph APILayer [Express.js HTTP Server - :4000]
        Router[Central Router /api/v1]
        AuthMW[Auth Middleware - JWT & RBAC]
        UploadMW[Multer Audio Upload Middleware]
        ValidateMW[Express-Validator Middleware]
        ErrorHandler[Central Error Handling Middleware]
    end

    subgraph ControllerLayer [Controllers]
        AuthCtrl[Auth Controller]
        UserCtrl[User Controller]
        WordCtrl[Word/CMS Controller]
        TestCtrl[Test Session Controller]
        ReportCtrl[Report/PDF Controller]
    end

    subgraph ServiceLayer [Business Logic Services]
        AuthSvc[Auth Service]
        UserSvc[User Service]
        WordSvc[Word Bank Service]
        ScoringSvc[Scoring & Phoneme Service]
        PDFSvc[PDFKit Report Service]
    end

    subgraph StorageLayer [Data & File Storage]
        PrismaClient[(Prisma ORM Client)]
        MySQLDB[(MySQL Database)]
        DiskAudio[Local Filesystem - uploads/audio/]
    end

    WebClient -->|HTTPS REST| Router
    AdminDashboard -->|HTTPS REST| Router

    Router --> AuthMW
    Router --> ValidateMW
    Router --> UploadMW

    AuthMW --> AuthCtrl
    AuthMW --> UserCtrl
    AuthMW --> WordCtrl
    AuthMW --> TestCtrl
    AuthMW --> ReportCtrl

    AuthCtrl --> AuthSvc
    UserCtrl --> UserSvc
    WordCtrl --> WordSvc
    TestCtrl --> ScoringSvc
    ReportCtrl --> PDFSvc

    WordCtrl -->|Store Audio| DiskAudio
    AuthSvc --> PrismaClient
    UserSvc --> PrismaClient
    WordSvc --> PrismaClient
    ScoringSvc --> PrismaClient
    PDFSvc --> PrismaClient

    PrismaClient --> MySQLDB
    Router --> ErrorHandler
```

---

## 3. Directory & File Structure

The project follows a clean `src/` layout separating entry points, configuration, business logic, and documentation:

```text
eary-backend/
├── src/
│   ├── config/                      # Environment & infrastructural setup
│   │   ├── env.js                   # Validated environment variables (dotenv)
│   │   └── prisma.js                # Shared Prisma client singleton
│   │
│   ├── controllers/                 # HTTP request orchestration & response formatting
│   │   ├── auth.controller.js       # Signup, login, refresh token, logout
│   │   ├── user.controller.js       # Profile retrieval & administrative user management
│   │   ├── word.controller.js       # Word item CRUD & distractor options
│   │   ├── test.controller.js       # Dynamic session retrieval & test submission
│   │   └── report.controller.js     # Patient result history & PDF generation
│   │
│   ├── services/                    # Core business logic & database queries
│   │   ├── auth.service.js          # Password hashing, token signing & validation
│   │   ├── user.service.js          # User queries, activation toggling
│   │   ├── word.service.js          # Word bank curation & audio file handling
│   │   ├── scoring.service.js       # WRS % calculation & phoneme error classification
│   │   └── pdf.service.js           # PDF document construction via pdfkit
│   │
│   ├── routes/                      # API endpoint declarations
│   │   ├── index.js                 # Central aggregator mounted at /api/v1
│   │   ├── auth.routes.js           # /api/v1/auth
│   │   ├── user.routes.js           # /api/v1/users
│   │   ├── word.routes.js           # /api/v1/words
│   │   ├── test.routes.js           # /api/v1/tests
│   │   └── report.routes.js         # /api/v1/reports
│   │
│   ├── middleware/                  # Request lifecycle interceptors
│   │   ├── auth.middleware.js       # JWT extraction & role enforcement (requireAdmin)
│   │   ├── validate.middleware.js   # express-validator result handler
│   │   ├── upload.middleware.js     # Multer storage configuration for audio assets
│   │   └── error.middleware.js      # Global 404 & 500 error boundary
│   │
│   ├── utils/                       # Shared utility functions & constants
│   │   ├── apiResponse.js           # Uniform JSON success/error response helpers
│   │   ├── phonemeClassifier.js     # Minimal pair error tagging logic
│   │   └── logger.js                # Standardized console / operational logger
│   │
│   └── app.js                       # Express application assembly (CORS, parser, static routes)
│
├── prisma/
│   ├── schema.prisma                # Modern Prisma data models & enums
│   ├── migrations/                  # Generated SQL migration history
│   └── seed.js                      # Seeder for admin account & word banks
│
├── uploads/
│   └── audio/                       # Permanent disk storage for spoken audio files
│
├── docs/                            # Formal system documentation
│   ├── PRD.md                       # Product Requirement Document
│   ├── ARCHITECTURE.md              # System Architecture (this document)
│   └── API_SPEC.md                  # REST API Specification & Contract
│
├── server.js                        # Process runner (port listening & graceful shutdown)
├── package.json
└── .env.example
```

---

## 4. Subsystems & Detailed Data Flows

### 4.1 Authentication & Token Lifecycle Flow

Eary utilizes a double-token security architecture (Access Token + Refresh Token):

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant AuthRouter as /api/v1/auth
    participant AuthCtrl as auth.controller.js
    participant AuthSvc as auth.service.js
    participant DB as MySQL (via Prisma)

    Client->>AuthRouter: POST /login (email, password)
    AuthRouter->>AuthCtrl: login(req, res)
    AuthCtrl->>AuthSvc: authenticateUser(email, password)
    AuthSvc->>DB: Find unique user by email
    DB-->>AuthSvc: User record
    AuthSvc->>AuthSvc: Verify password via bcrypt.compare()
    AuthSvc->>AuthSvc: Check status === 'ACTIVE'
    AuthSvc->>AuthSvc: Sign Access Token (JWT - 15m)
    AuthSvc->>AuthSvc: Generate Refresh Token (7d)
    AuthSvc->>DB: Persist refreshToken on User record
    AuthSvc-->>AuthCtrl: { user, accessToken, refreshToken }
    AuthCtrl-->>Client: 200 OK + Payload
```

- **Access Token**: Carries `id`, `email`, and `role` (`user` | `admin`). Validated purely in memory without database queries.
- **Refresh Token Rotation**: Used at `/api/v1/auth/refresh` to issue a fresh access token. On logout (`/api/v1/auth/logout`), the refresh token is set to `null` in the database to prevent replay attacks.

---

### 4.2 Dynamic Test Session Assembly Flow

To eliminate test memorization and learning bias, tests are generated dynamically per session:

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Test-Taker Client
    participant TestRouter as /api/v1/tests
    participant TestCtrl as test.controller.js
    participant WordSvc as word.service.js
    participant DB as MySQL (via Prisma)

    Patient->>TestRouter: GET /session?language=AR&category=ADULT
    TestRouter->>TestCtrl: getSession(req, res)
    TestCtrl->>WordSvc: getRandomizedWords(language, category, limit=20)
    WordSvc->>DB: Query active questions matching criteria
    DB-->>WordSvc: Active questions + options
    WordSvc->>WordSvc: Random sample of 20 items (Fisher-Yates)
    WordSvc->>WordSvc: Sanitize options (STRIP is_correct flags)
    WordSvc->>WordSvc: Append absolute audio stream URL
    WordSvc-->>TestCtrl: Sanitized Session Packet
    TestCtrl-->>Patient: 200 OK { sessionId, questions: [...] }
```

> **Security Guard**: `is_correct` and answer priority flags are completely stripped from the response payload before reaching the client to prevent client-side inspection cheats.

---

### 4.3 Test Evaluation, Scoring & Phoneme Confusion Flow

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Test-Taker Client
    participant TestRouter as /api/v1/tests
    participant TestCtrl as test.controller.js
    participant ScoringSvc as scoring.service.js
    participant DB as MySQL (via Prisma)

    Patient->>TestRouter: POST /submit (answers: [{question_id, selected_answer_id}])
    TestRouter->>TestCtrl: submitTest(req, res)
    TestCtrl->>ScoringSvc: evaluateSession(userId, submissionData)
    ScoringSvc->>DB: Fetch ground truth for submitted question IDs
    DB-->>ScoringSvc: Real answers with is_correct & phoneme_tag

    ScoringSvc->>ScoringSvc: Compute Correct Count & WRS %
    ScoringSvc->>ScoringSvc: Determine Discrimination Tier (EXCELLENT, GOOD, FAIR, POOR)
    ScoringSvc->>ScoringSvc: Categorize phoneme errors (voicing, place, vowel formant)
    
    ScoringSvc->>DB: Prisma Transaction [Create Result + Bulk Create ResultItems]
    DB-->>ScoringSvc: Created Result entity
    ScoringSvc-->>TestCtrl: Complete Diagnostic Summary
    TestCtrl-->>Patient: 201 Created { score, tier, error_summary, result_id }
```

---

## 5. Database Schema & Data Models

The data layer is managed with **Prisma ORM** targeting MySQL 8+.

```mermaid
erDiagram
    users ||--o{ results : "takes"
    questions ||--|{ answers : "has"
    questions ||--o{ result_items : "referenced in"
    answers ||--o{ result_items : "selected in"
    results ||--|{ result_items : "contains"

    users {
        int id PK
        string name
        string email UK
        string password
        string phone
        date dob
        string gender
        enum role
        enum status
        string refreshToken
        datetime createdAt
        datetime updatedAt
    }

    questions {
        int id PK
        string word
        string ipa_transcription
        string audio_file
        enum language
        enum category
        enum status
        datetime createdAt
        datetime updatedAt
    }

    answers {
        int id PK
        string text
        boolean is_correct
        string phoneme_tag
        int question_id FK
    }

    results {
        int id PK
        float score
        enum tier
        enum language
        enum category
        int total_questions
        int correct_count
        int duration_seconds
        json error_summary
        datetime date
        int user_id FK
    }

    result_items {
        int id PK
        int result_id FK
        int question_id FK
        int selected_answer_id FK
        boolean is_correct
    }
```

### 5.1 Relational Integrity Rules
- `users` $\to$ `results`: `onDelete: Cascade`. Deleting a user account cleans up their test history.
- `questions` $\to$ `answers`: `onDelete: Cascade`. Deleting a draft question cleans up its answer options.
- `questions` $\to$ `result_items`: `onDelete: Restrict`. Prevents deletion of any word that has ever been part of a patient test, preventing audit corruption.
- `answers` $\to$ `result_items`: `onDelete: Restrict`. Prevents deletion of answer options with historical submissions.

---

## 6. Security Architecture

### 6.1 Authentication & RBAC Guard
- **Token Verification**: Handled by `authenticateToken` middleware. Rejects missing, malformed, or expired bearer tokens with `401 Unauthorized`.
- **Role Enforcement**: Handled by `requireAdmin` middleware. Verifies `req.user.role === 'ADMIN'`. Rejects non-admin users with `403 Forbidden`.
- **Account Active Verification**: Middleware checks if `req.user.status === 'ACTIVE'`. Inactive users are instantly locked out.

### 6.2 Password Security
- All passwords are encrypted using `bcrypt` with salt rounds = 10 before persisting.
- Passwords are explicitly scrubbed (`delete user.password`) before returning user objects to callers.

### 6.3 Media & Static File Upload Protection
- Multer configuration validates MIME types strictly (`audio/mpeg`, `audio/wav`, `audio/x-wav`).
- Uploads are capped at **5 MB**.
- File names are sanitized and assigned a unique, unguessable timestamp + crypto hex prefix to prevent directory traversal and name collision:
  ```javascript
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  ```

---

## 7. Error Handling & Response Envelope

### 7.1 Standard API Response Envelope
All API responses use a standardized JSON envelope through `apiResponse.js`:

#### Success Envelope (`200`, `201`)
```json
{
  "success": true,
  "message": "Test session retrieved successfully",
  "data": { ... }
}
```

#### Failure Envelope (`400`, `401`, `403`, `404`, `500`)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

### 7.2 Centralized Error Middleware (`error.middleware.js`)
All thrown errors or unhandled rejections are caught by the global error handler:
- **Entity Parse Errors**: Translates malformed JSON payloads into `400 Bad Request`.
- **Prisma Known Request Errors**: Translates unique constraint violations (e.g. `P2002` duplicate email) into clean `409 Conflict` responses.
- **Operational vs Programmer Errors**: Internal stack traces are logged on the server and masked in production (`NODE_ENV === 'production'`).

---

## 8. Deployment & Environment Strategy

### 8.1 Required Environment Variables
The application strictly validates its environment at boot through `src/config/env.js`:

```env
# Application
PORT=4000
NODE_ENV=development
API_PREFIX=/api/v1
CLIENT_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=mysql://eary_user:eary_pass@localhost:3306/eary_db

# JWT Secrets
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
JWT_REFRESH_EXPIRES_IN=7d

# File Storage
UPLOAD_AUDIO_DIR=uploads/audio
MAX_AUDIO_SIZE_MB=5
```

### 8.2 Production Considerations
- **Process Management**: Run via process managers (e.g., PM2 or Docker container) with healthcheck endpoint at `/api/v1/health`.
- **Static Audio Serving**: Express serves `/uploads/audio` with `maxAge: '1d'`. For high traffic, this can sit behind NGINX or an S3/CloudFront reverse proxy without altering application code.
