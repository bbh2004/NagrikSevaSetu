# civicWeb - Municipal Dashboard

The civicWeb portal is a React application built with Vite and Vanilla CSS for municipal authorities to manage civic complaints.

## Features

- **Role-Based Access Control (RBAC):** Supports `admin`, `main_officer`, and `department_staff`.
- **Live Incident Map:** Integrated with Google Maps API to visualize complaints geographically. Markers are clustered and color-coded by current grievance status.
- **SLA & Analytics:** Dashboards for tracking pending complaints, resolution time targets, and department-wise performance metrics.
- **AI Urgency Flags:** Highlights complaints marked as "High" urgency by the backend AI (visible only to municipal staff).
- **Voice Note Transcription:** Displays the backend-transcribed text next to voice-based complaints.
- **Cloudinary Integration:** Supports viewing image evidence attached to complaints.
- **Modern Responsive Design:** Re-coded styles for improved visual presentation and mobile adaptability.

## Tech Stack

- **Framework:** React + Vite
- **Styling:** Vanilla CSS (curated HSL palettes, cards, modern grids)
- **Maps:** `@react-google-maps/api`
- **Charts:** Recharts
- **State/API:** React Context + Axios interceptors for authentication syncing

## Architecture & Data Flow

This frontend **does not** connect directly to Firestore. Instead, it communicates securely with the `civicBackend` REST API.

1. **Auth:** User logs in via Firebase Authentication.
2. **Token:** Firebase ID Token is passed as a `Bearer` token in every Axios request.
3. **Backend:** The `civicBackend` Express API verifies the token, enforces RBAC, and fetches data from MongoDB.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure you have the following keys configured:
- `VITE_FIREBASE_*` (for Authentication)
- `VITE_API_BASE_URL` (Points to civicBackend, usually `http://localhost:5000/api`)
- `VITE_GOOGLE_MAPS_API_KEY` (Required for the live incident map)
- `VITE_CLOUDINARY_CLOUD_NAME` & `VITE_CLOUDINARY_UPLOAD_PRESET`

### 3. Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Folder Structure

- `src/components/ui.jsx` - Reusable UI primitives (Cards, Buttons, Badges)
- `src/constants/civic.js` - Single Source of Truth for categories, statuses, map configs, etc.
- `src/context/AuthContext.jsx` - Firebase Auth state & Role Management
- `src/pages/` - Main views (Dashboard, DepartmentDashboard, ComplaintDetail, Analytics)
- `src/services/api.js` - Axios instance with Firebase Token Interceptor
- `src/utils/formatDate.js` - Unified date/time formatting utility