# civicBackend - REST API

Common backend for **civicApp (Flutter)** and **civicWeb (React)**.

## Architecture

```
civicApp (Flutter)  ──┐
                       ├──► civicBackend (Express) ──► MongoDB Atlas
civicWeb (React)    ──┘        │
                               └──► Firebase Admin (Auth Token Verification & FCM Push)
                               └──► Cloudinary (Image & Voice media storage)
                               └──► Groq API (Urgency AI & Whisper transcription)
```

---

## Key Phase 2 Implementations

- **Google Sign-In Session Sync**: Endpoints adapted to verify Firebase Google ID tokens and sync profiles dynamically to MongoDB Atlas.
- **Groq Whisper Audio Transcription**: Re-routed the transcription pipeline to utilize Groq Whisper API for backend-side STT parsing. Received voice complaints (Cloudinary `.m4a` / `.mp3` URLs) are sent to Groq Whisper for transcription.
- **AI Urgency Classification**: The text transcription is automatically combined with the text description and evaluated through the LLaMA-3.1 model to determine severity categories (Admin/Backend only).
- **Push Notification Service & Token Management**: Configured FCM messaging handlers to broadcast instant status update changes (Pending -> In Progress -> Resolved) back to the reporting citizen. Exposes `/api/users/fcm-token` for precise device targeting and integrates directly with the App's token lifecycle hooks.

---

## Setup & Running Locally

### Step 1: Install dependencies
```bash
cd NagrikSevaSetu/civicBackend
npm install
```

### Step 2: Create your `.env` file
```bash
cp .env.example .env
```
Now open `.env` and fill in your values. See below for where to get each one.

### Step 3: Get your credentials

#### MongoDB Atlas
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas/database)
2. Create a free M0 cluster
3. Create a **Database User**
4. In Network Access, add `0.0.0.0/0` to allow connections from anywhere
5. Click **Connect → Drivers** and copy the connection string
6. Replace `<password>` in the string with your DB user's password
7. Paste into `MONGODB_URI` in `.env`

#### Firebase Admin SDK
1. Open [Firebase Console](https://console.firebase.google.com) → your project
2. **Project Settings** → **Service Accounts**
3. Click **"Generate new private key"** → downloads a JSON file
4. Open the JSON file and copy:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (paste the whole string including `-----BEGIN...-----`)

> ⚠️ **Important**: In `.env`, the private key must have literal `\n` characters. Copy it exactly as it appears in the JSON file.

#### Cloudinary
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copy `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` and paste them into `.env`

#### Groq API Key
1. Go to the Groq Console and obtain an API Key.
2. Paste it into `GROQ_API_KEY` in `.env`.

### Step 4: Run the development server
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
✅ Firebase Admin SDK Initialized
✅ Cloudinary Configured
🚀 civicBackend running in development mode
🌐 Server: http://localhost:5000
```

---

## API Reference

All endpoints are prefixed with `/api/`. All protected routes require:
```
Authorization: Bearer <firebase-id-token>
```

### Health Check
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/health` | None | Server health check |

---

### Users
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/users/sync` | ✅ Any | Create/update user after Google Sign-In |
| `GET` | `/api/users/me` | ✅ Any | Get current user profile |

#### POST /api/users/sync
Call this immediately after every Firebase Google sign-in. Creates user in MongoDB if new, or updates profile info.

**Request Body:**
```json
{
  "name": "Bhargav Sharma",
  "email": "bhargav@example.com",
  "phone": "+91-9876543210"
}
```

---

### Complaints
| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| `GET` | `/api/complaints` | ✅ | Any | Get all complaints (filterable) |
| `POST` | `/api/complaints` | ✅ | Any | Submit a new complaint |
| `GET` | `/api/complaints/mine` | ✅ | Any | Get my own complaints |
| `GET` | `/api/complaints/stats` | ✅ | admin/staff | Dashboard statistics |
| `GET` | `/api/complaints/:id` | ✅ | Any | Get single complaint |
| `PATCH` | `/api/complaints/:id/status` | ✅ | admin/staff | Update status |
| `POST` | `/api/complaints/:id/upvote` | ✅ | Any | Toggle upvote |

#### POST /api/complaints
**Request Body:**
```json
{
  "category": "Road",
  "description": "Large pothole on MG Road near bus stop causing accidents",
  "lat": 18.5204,
  "lng": 73.8567,
  "imageUrl": "https://res.cloudinary.com/dmecx8pcz/image/upload/...",
  "voiceNoteUrl": "https://res.cloudinary.com/dmecx8pcz/video/upload/..."
}
```
> Note: `imageUrl` is compulsory. `description` OR `voiceNoteUrl` must be provided (enforced via backend validation).

---

### Notifications
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/notifications` | ✅ | Get all my notifications |
| `PATCH` | `/api/notifications/:id/read` | ✅ | Mark one as read |
| `PATCH` | `/api/notifications/read-all` | ✅ | Mark all as read |

---

### Upload
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/upload/signature` | ✅ | Get Cloudinary signed upload parameters |
| `GET` | `/api/upload/voice-signature` | ✅ | Cloudinary parameters for raw audio files |

---

## Folder Structure

```
civicBackend/
├── src/
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   ├── firebase.js     # Firebase Admin SDK init
│   │   └── cloudinary.js   # Cloudinary SDK config
│   ├── models/
│   │   ├── User.js         # Mongoose User schema
│   │   ├── Complaint.js    # Mongoose Complaint schema
│   │   └── Notification.js # Mongoose Notification schema
│   ├── middleware/
│   │   ├── auth.js         # Firebase token verification + role check
│   │   └── errorHandler.js # Global error handler
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── complaintController.js
│   │   ├── notificationController.js
│   │   └── uploadController.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── uploadRoutes.js
│   ├── services/
│   │   ├── notificationService.js  # Business logic & FCM Multicast Push
│   │   ├── urgencyService.js       # Groq LLaMA urgency & Whisper audio transcription
│   ├── app.js             # Express app (middleware + routes)
│   └── server.js          # Entry point (DB connect + listen)
```
