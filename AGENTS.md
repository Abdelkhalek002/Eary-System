# AGENTS.md — Agent & Developer Guidelines for Eary Backend

Welcome to the **Eary Backend** repository. This document serves as the primary operational and behavioral guide for AI agents and human engineers contributing to this codebase. All modifications must adhere to the design, standards, and architectural blueprints defined herein and in the companion documentation in `docs/`.

---

## 1. Project Overview & Vision

**Eary** is a web-based speech discrimination assessment platform designed to evaluate auditory recognition through interactive language-based hearing tests. The platform focuses on **Language Words Hearing Tests (Word Recognition / Speech Discrimination Testing)** in **Arabic** and **English**, across **Adult** and **Pediatric (Children)** demographics.

### Key References
- **PRD**: [docs/PRD.md](file:///d:/www/eary-backend/docs/PRD.md) — Product requirements, user personas, clinical diagnostic tiers, and feature specifications.
- **Architecture**: [docs/ARCHITECTURE.md](file:///d:/www/eary-backend/docs/ARCHITECTURE.md) — 3-tier layered system design, sequence diagrams, and security model.
- **API Spec**: [docs/API_SPEC.md](file:///d:/www/eary-backend/docs/API_SPEC.md) — REST endpoint schemas, payloads, and response envelopes.

---

## 2. Architectural Blueprint & Directory Layout

The application adheres strictly to a **clean 3-tier layered architecture** housed inside `src/`. Do **not** place business logic inside route handlers or database queries inside controllers.

```text
eary-backend/
├── src/
│   ├── config/              # Centralized environment & database singletons
│   │   ├── env.js           # Validated environment variables (dotenv)
│   │   └── prisma.js        # Shared Prisma client instance
│   ├── controllers/         # Request handling, validation unwrapping & HTTP responses
│   ├── services/            # Pure business logic (scoring, session generation, PDF)
│   ├── routes/              # Express routers mounted under /api/v1
│   ├── middleware/          # JWT auth, RBAC guards, Multer uploads, error handler
│   ├── utils/               # apiResponse envelope, phoneme classifier, logger
│   └── app.js               # Express application initialization & middleware setup
├── prisma/
│   ├── schema.prisma        # Canonical database models and enums
│   └── seed.js              # Word bank & administrator seeding script
├── uploads/
│   └── audio/               # Permanent local disk storage for audio assets
├── docs/                    # Formal product, architectural, and API specs
├── server.js                # Server entry point (starts HTTP listener)
└── package.json
```

---

## 3. Strict Development Rules & Conventions

### 3.1 Architectural Separation
1. **Controllers** (`src/controllers/`):
   - Responsible *only* for inspecting `req.body`, `req.params`, `req.query`, and `req.user`.
   - Call the corresponding service function.
   - Return responses exclusively using the standardized `apiResponse` utility.
   - Never write direct database queries (`prisma.*`) inside controllers.
2. **Services** (`src/services/`):
   - Contain all business calculations (e.g., WRS score calculation, phonetic error categorization, dynamic randomization).
   - Perform all Prisma database queries.
   - Throw operational errors (e.g., `createError(404, 'Word not found')`) to be caught by the global error middleware.
3. **Routes** (`src/routes/`):
   - Define URL paths and attach validation middleware and authentication guards.
   - Keep route files declarative and minimal.

### 3.2 Authentication & Security Standards
- **JWT-First**: All authenticated endpoints verify Bearer tokens via `src/middleware/auth.middleware.js`.
- **Role Enforcement**: Use enum-based roles (`Role.USER` vs `Role.ADMIN`). Admin-only endpoints must use `requireAdmin`.
- **Account Status Guard**: Every authenticated request must ensure the user has `status === 'ACTIVE'`.
- **Password Protection**: Passwords must always be hashed with `bcrypt` (10 salt rounds). Never return the `password` field in any API response or log.
- **Anti-Cheat / Information Masking**: When serving active test sessions (`GET /api/v1/tests/session`), **never expose** `is_correct` or answer weight flags to the client.

### 3.3 Database & Prisma Conventions
- **Shared Singleton**: Always import Prisma from `src/config/prisma.js`. Never instantiate `new PrismaClient()` in individual files.
- **Medical Audit Immutability**:
  - `ResultItem` references `Question` and `Answer` with `onDelete: Restrict`.
  - Never hard-delete active questions with existing results; toggle `status: INACTIVE` instead.
- **Naming Conventions**:
  - Models in PascalCase (e.g., `User`, `Question`, `Result`).
  - Table mappings in snake_case (e.g., `@@map("users")`, `@@map("result_items")`).
  - Fields in camelCase or snake_case matching schema definitions.

### 3.4 API Response Envelope
Always use `src/utils/apiResponse.js` for formatting HTTP responses:

```javascript
// Success Response
return res.status(200).json({
  success: true,
  message: "Session retrieved successfully",
  data: sessionData
});

// Failure Response
return res.status(400).json({
  success: false,
  message: "Validation failed",
  errors: [{ field: "email", message: "Invalid email address" }]
});
```

---

## 4. Prohibited Patterns (Do NOT Do)

1. **NO Raw MySQL Pool Queries**: Do not import `dbConnection.js` or run raw `conn.query()` SQL strings. All queries must run through Prisma ORM.
2. **NO Hardcoded Configuration**: Never hardcode ports, secrets, or paths. Always use `src/config/env.js`.
3. **NO Business Logic in Routes or Controllers**: Always delegate to `src/services/`.
4. **NO Direct File Path Exposure**: Audio files served over HTTP must use dynamic relative or host-formatted paths via `/uploads/audio/`, never server absolute filesystem paths.

---

## 5. Standard Commands

- **Start Dev Server**: `npm run dev` or `npm start`
- **Prisma Migrations**: `npx prisma migrate dev --name <migration_name>`
- **Prisma Studio**: `npx prisma studio`
- **Run Seeder**: `node prisma/seed.js`
- **Format Code**: `npm run lint` or `npx prettier --write .`

---

## 6. How to Implement New Features

When instructed to add or modify a feature:
1. **Check the Docs First**: Verify alignment with [docs/PRD.md](file:///d:/www/eary-backend/docs/PRD.md) and [docs/ARCHITECTURE.md](file:///d:/www/eary-backend/docs/ARCHITECTURE.md).
2. **Update Prisma Schema** if schema changes are required (`prisma/schema.prisma`), then generate the migration.
3. **Implement Service Logic** in `src/services/`.
4. **Implement Controller & Route** in `src/controllers/` and `src/routes/`.
5. **Add Validation Middleware** using `express-validator`.
6. **Verify Endpoints**: Test endpoints against edge cases (deactivated user, unauthorized access, invalid input).
