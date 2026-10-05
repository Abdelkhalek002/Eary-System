# Eary System Backend

A robust RESTful API built with **Node.js**, **Express**, **MySQL**, and **Prisma ORM** for managing audio-based assessment tests, questions, answer options, user results, and role-based administration.

---

## 🚀 Features

- **Authentication & Security**:
  - User registration with validation (`express-validator`).
  - Secure password hashing using `bcrypt`.
  - Token-based session authentication with dynamic token generation.
  - Role-based access control (Regular Users vs. Admin).
  - Bearer token support (`Authorization: Bearer <token>`) with backwards compatibility for legacy `token` headers.
- **Questions & Audio Management**:
  - Create, view, update, and delete assessment questions.
  - Multi-part audio file upload handling using `multer`.
  - Static audio asset serving with dynamic host URL generation.
- **Answers & Priorities**:
  - Full CRUD for question answers and associated priority/weight scores.
  - Relational cascade deletion linked to question records.
- **Results & History**:
  - Record user assessment scores.
  - View historical test results ordered chronologically.
- **Prisma ORM**:
  - Type-safe database queries.
  - Declarative schema migrations and relations.

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v16+)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MySQL](https://www.mysql.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **File Uploads**: [Multer](https://github.com/expressjs/multer)
- **Validation**: [express-validator](https://express-validator.github.io/)
- **Password Hashing**: [bcrypt](https://github.com/kelektiv/node.bcrypt.js)

---

## 📁 Project Structure

```text
Eary-System/
├── db/
│   ├── dbConnection.js    # Legacy MySQL connection pool
│   └── prisma.js          # Shared Prisma client instance
├── middleWare/
│   ├── admin.js           # Admin privilege verification middleware
│   ├── authorize.js       # Authenticated user verification middleware
│   └── uploadAudio.js     # Multer storage configuration for audio files
├── prisma/
│   └── schema.prisma      # Prisma database schema and models
├── routes/
│   ├── auth.js            # User registration & login endpoints
│   ├── manageAnswers.js   # Answer options CRUD
│   ├── manageQuestions.js # Question management & audio uploads
│   └── manageResults.js   # User assessment scores & test history
├── upload/                # Static folder for uploaded audio files
├── .env.example           # Example environment variable definitions
├── index.js               # Application entry point & route mounting
└── package.json           # Project dependencies & scripts
```

---

## ⚙️ Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MySQL](https://www.mysql.com/) Server installed and running

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/Abdelkhalek002/Eary-System.git
cd Eary-System
npm install
```

### 3. Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Adjust the values in `.env` to match your local setup:

```env
PORT=4000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=eary_dev

# Prisma Connection URL
DATABASE_URL="mysql://root:@localhost:3306/eary_dev"
```

### 4. Database Setup & Prisma Generation

Push the schema to your MySQL database and generate the Prisma Client:

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

*(Optional) Launch Prisma Studio to inspect your database in the browser:*
```bash
npx prisma studio
```

### 5. Start the Server

```bash
# Development mode with auto-reload (nodemon)
npm start

# Or directly with node
node index.js
```

The server will start on `http://localhost:4000`.

---

## 🔐 Authentication & Roles

Protected routes require an authentication token generated upon login.

### Passing the Token

Send the token in the request header using either:

1. **Bearer Token (Recommended)**:
   ```http
   Authorization: Bearer <your_token_here>
   ```
2. **Custom Header (Legacy)**:
   ```http
   token: <your_token_here>
   ```

### User Roles
- `role: 0` – Standard User (Can take tests, view their own results).
- `role: 1` – Administrator (Can create/edit/delete questions and answers).

---

## 📡 API Reference

### 1. Authentication (`/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Log in and receive an authentication token |

#### Example: Login Request
```http
POST /auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

### 2. Questions (`/questions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/questions` | Public | Retrieve all questions with answers & audio URLs |
| `GET` | `/questions/:id` | Public | Retrieve a specific question by ID |
| `POST` | `/questions` | Admin | Create a new question (`multipart/form-data`) |
| `PUT` | `/questions/:id` | Admin | Update a question (`multipart/form-data` or JSON) |
| `DELETE` | `/questions/:id` | Admin | Delete a question (cascades to answers) |

#### Example: Create Question (`multipart/form-data`)
- `name`: Question text or identifier
- `audio`: Audio file (`.mp3`, `.wav`, etc.)
- Header: `Authorization: Bearer <admin_token>`

---

### 3. Answers (`/questions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/questions/answers` | Public | Retrieve all answers across questions |
| `GET` | `/questions/:id/answers` | Public | Retrieve all answers for question `:id` |
| `POST` | `/questions/:id/answers` | Admin | Add an answer option to question `:id` |
| `PUT` | `/questions/answers/:id` | Admin | Update an answer option by ID |
| `DELETE` | `/questions/answers/:id` | Admin | Delete an answer option by ID |

#### Example: Create Answer Request
```http
POST /questions/1/answers HTTP/1.1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "description": "Option A Description",
  "priority": 10
}
```

---

### 4. Results & Test History (`/results`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/results/history/:id` | Authorized | Get test history and scores for user `:id` |
| `POST` | `/results/saveAnswers/:id`| Authorized | Save an assessment score for user `:id` |

#### Example: Save Score
```http
POST /results/saveAnswers/1 HTTP/1.1
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "score": 85.5
}
```

---

### 5. Users & Profile (`/`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Public | Get list of all users |
| `GET` | `/users/:id` | Public | Get user details by ID |
| `POST` | `/users` | Public | Create a user |
| `PUT` | `/users/:id` | Public | Update user profile |
| `DELETE` | `/users/:id` | Public | Delete a user by ID |
| `GET` | `/admins/:id` | Public | Get admin details by ID |
| `PUT` | `/admins/:id` | Public | Update admin profile |

---

## 🛡️ Error Handling

The application includes centralized error handling:
- **`400 Bad Request`**: Returned for invalid request payloads, missing parameters, or malformed JSON.
- **`401 Unauthorized`**: Returned when authentication token is missing.
- **`403 Forbidden`**: Returned when the user lacks required permissions or token is invalid.
- **`404 Not Found`**: Returned when a requested resource does not exist.
- **`500 Internal Server Error`**: Catches unhandled database or server exceptions.
