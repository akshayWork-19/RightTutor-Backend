# 🚀 Right Tutor Backend

The core heartbeat of the Right Tutor platform, providing real-time data synchronization between Firestore and Google Sheets, AI-powered inquiry analysis, and administrative dashboard support.

## 🏗️ Architecture Overview

The backend follows a modular **Controller-Service-Repository** pattern for scalability and maintainability.

- **Config/**: Centralized configuration for Firebase Admin SDK and environment variables.
- **Controllers/**: Orchestrates incoming requests, translates them for services, and returns standardized JSON responses.
- **Services/**: The "Brain" of the application. Contains business logic for synchronization, matching, and database interactions.
- **Middleware/**: Security and authentication layers (JWT validation, Error handling).
- **Routes/**: Express.js routing definitions for API v1.
- **Utils/**: Reusable utility functions like `asyncHandler`, `logger`, and `ApiError`.

---

## ⚡ Core Features

### 1. Bidirectional Google Sheets Sync
The `SyncService` maintains consistency between the cloud database (Firestore) and legacy/client Google Sheets.
- **Push Sync**: Immediate updates to Google Sheets when data is modified via the Admin Dashboard.
- **Poll Sync**: A background loop (every 25s) that checks for external edits in Google Sheets and pulls them back into Firestore.

### 2. Real-time Communication
Powered by **Socket.io**, the system broadcasts `data_updated` events to all connected admin clients whenever a change occurs in:
- Bookings / Consultations
- Parent Inquiries
- Manual Match Requests

### 3. AI Analysis (Gemini 1.5 Flash)
Integrated with Google's Generative AI to provide:
- Instant summaries of complex parent inquiries.
- Suggested professional replies for administrative staff.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Sync**: Google Sheets API (v4)
- **AI**: @google/generative-ai
- **Real-time**: Socket.io

---

## ⚙️ Environment Configuration

Create a `.env` file in this directory with the following keys:

```ini
PORT=8000
FRONTEND_URL=your_frontend_url
ADMIN_DASHBOARD_URL=your_admin_url

# Firebase Admin
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google AI
GEMINI_API_KEY=...

# Auth
JWT_SECRET=your_secret_key
```

---

## 🚀 Setup & Execution

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Production Deployment**:
   Ensure all environment variables are set in your hosting provider (e.g., Render, Railway, DigitalOcean).

---

## 📡 API Endpoints (v1)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/consultation` | GET/POST/PUT/DELETE | Manage student bookings |
| `/api/v1/contact` | GET/POST/PUT/DELETE | Manage parent inquiries |
| `/api/v1/manual-match` | GET/POST/PUT/DELETE | specialized tutor matching |
| `/api/v1/dashboard/stats` | GET | Aggregated platform statistics |
| `/api/v1/repository` | GET/POST | Manage linked Google Sheets |

---

## 🛡️ Reliability Guarantees
- **Asynchronous Sync**: Google Sheets failures do not block database operations.
- **Standardized Errors**: Consistent API error responses via `ApiError` utility.
- **Security**: JWT-based authentication for all non-public routes.
