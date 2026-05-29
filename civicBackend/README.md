# civicBackend - REST API

Common backend for **civicApp (Flutter)** and **civicWeb (React)**.

## Architecture

```
civicApp (Flutter)  ──┐
                       ├──► civicBackend (Express) ──► MongoDB Atlas
civicWeb (React)    ──┘        │
                               └──► Firebase Admin (verify tokens)
                               └──► Cloudinary (media uploads)
                               └──► Gemini API (urgency AI)
```

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
2. Create a free M0 cluster (it's free forever)
3. Create a **Database User** (not your Atlas account - a separate DB user)
4. In Network Access, add `0.0.0.0/0` to allow connections from anywhere (for dev)
5. Click **Connect → Drivers** and copy the connection string
6. Replace `<password>` in the string with your DB user's password
7. Paste into `MONGODB_URI` in `.env`

#### Firebase Admin SDK
1. Open [Firebase Console](https://console.firebase.google.com) → your project
2. **Project Settings** (gear icon) → **Service Accounts**
3. Click **"Generate new private key"** → downloads a JSON file
4. Open the JSON file and copy:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (paste the whole string including `-----BEGIN...-----`)

> ⚠️ **Important**: In `.env`, the private key must have literal `\n` characters. Copy it exactly as it appears in the JSON file.

#### Cloudinary
Your cloud name is already known: `dmecx8pcz`
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Go to **Settings → API Keys**
3. Copy `API Key` and `API Secret`

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
| `POST` | `/api/users/sync` | ✅ Any | Create/update user after Firebase login |
| `GET` | `/api/users/me` | ✅ Any | Get current user profile |

#### POST /api/users/sync
Call this immediately after every Firebase sign-in. Creates user in MongoDB if new, or updates if existing.

**Request Body:**
```json
{
  "name": "Bhargav Sharma",
  "email": "bhargav@example.com",
  "phone": "+91-9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "mongo_object_id",
    "firebaseUid": "firebase_uid",
    "name": "Bhargav Sharma",
    "role": "citizen"
  }
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
  "voiceNoteUrl": null
}
```
> Note: `imageUrl` is optional. Upload to Cloudinary first (or use `/api/upload/signature`), then pass the URL here.

#### GET /api/complaints (Query Params)
```
?category=Road&status=Pending&urgency=High&page=1&limit=20
```

#### PATCH /api/complaints/:id/status
**Request Body:**
```json
{ "status": "In Progress" }
```
Valid values: `Pending`, `In Progress`, `Resolved`, `Rejected`

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
| `GET` | `/api/upload/signature` | ✅ | Get Cloudinary signed upload params |

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
│   │   ├── validate.js     # Joi request body validation
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
│   │   ├── notificationService.js  # Business logic for notifications
│   │   └── urgencyService.js       # Gemini AI urgency detection
│   ├── app.js             # Express app (middleware + routes)
│   └── server.js          # Entry point (DB connect + listen)
├── tests/
│   └── health.test.js
├── .env.example
├── .gitignore
└── package.json
```

---

## Deployment (Render)

1. Push `civicBackend` to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Add all variables from `.env`
5. Click Deploy
