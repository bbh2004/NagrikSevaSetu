# 🏛️ Nagrik Seva Setu — Civic Grievance Redressal System

[![Smart India Hackathon 2025](https://img.shields.io/badge/SIH-2025-blue.svg)](https://www.sih.gov.in/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?logo=flutter&logoColor=white)](https://flutter.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

> A Smart India Hackathon 2025 project developed for the **Government of Jharkhand** to streamline public grievance reporting and municipal complaint management.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Phase 2 Implementations](#key-phase-2-implementations)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Mobile Application](#mobile-application)
- [Web Dashboard](#web-dashboard)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)

---

## 🎯 Overview

**Nagrik Seva Setu** is a comprehensive civic issue management ecosystem that bridges the gap between citizens and municipal authorities. The platform enables:

- **Citizens** to report complaints with images, descriptions/voice notes, and GPS locations
- **Municipal officials** to view, prioritize, and resolve complaints via a dedicated web dashboard
- **City authorities** to access analytics, maps, and departmental insights for data-driven decision-making

The system intelligently reduces duplicate complaints, improves response accuracy, and enhances public participation in civic governance.

---

## 🚀 Key Phase 2 Implementations

During Phase 2, major functional, architectural, and visual upgrades were introduced:

1. **Google Sign-In Auth Migration**: Replaced the email/password authentication system entirely with Google Sign-In for app users. Removed all legacy auth screens (register, verify, reset, signup, forgot password, etc.) to streamline citizen onboarding.
2. **Audio/Voice note Submission with Groq STT (Whisper API)**: Integrated voice note recording (up to 2 minutes) with Cloudinary signed uploads. The backend transcribes the audio using Groq Whisper API, allowing the AI model to parse voice-only complaints for automated urgency classification.
3. **UI/UX Overhaul & Modern Design System**:
   - Rebuilt the **Login Screen** with feature cards, soft pulsating animations, and robust asset-free Base64 vectors (Google Logo).
   - Fully functional **Dynamic Dark Mode** using Provider, saving state to SharedPreferences, and precisely applying Material 3 ColorSchemes across all widgets (Map, Cards, Forms).
   - Refined the **Home Screen Drawer** with ClipOval profile pictures, custom greeting logic, and personalized time-based messages.
   - Upgraded the **Map Screen** with custom status-colored markers, an interactive bottom sheet for complaint details, and a map legend.
   - Added card-based **Settings & Notifications** screens with grouped preference tiles, relative timestamps, and visual status badges.
   - Optimized state updates to ensure upvote counters update **optimistically and instantly** across all screens (Home, Map, and Status lists).
4. **Bulletproof Push Notifications (FCM)**:
   - Engineered robust FCM lifecycle management: notifications function flawlessly across Foreground, Background, and Terminated app states.
   - Intelligent Token Lifecycle: Automatically registers device tokens on login and explicitly wipes them on logout to prevent misdirected notifications when switching accounts on the same device.

---

## ✨ Features

### 🌟 Core Capabilities

- ✅ **End-to-end complaint tracking** from submission to resolution with audit logs
- 🔄 **Duplicate prevention** via geolocation-based nearby check and upvoting system
- 🤖 **AI-driven urgency classification** for critical issues (Groq LLaMA-3.1 Integration)
- 🎙️ **Voice Notes translation & transcription** via Groq Whisper AI (Backend integration)
- 🔔 **Real-time Push Notifications** via Firebase Cloud Messaging (FCM)
- 🗺️ **Interactive map visualization** using Google Maps (mobile) and Leaflet/Google Maps (web)
- 📊 **Analytics dashboard** for municipal insights
- 🔥 **REST API synchronization** across mobile app and web dashboard via a custom Express/MongoDB backend

---

## 📱 Mobile Application (Flutter)

The citizen-facing mobile application provides an intuitive interface for reporting and tracking civic issues.

### Key Features

#### 🔐 Secure Authentication
- Pure Google Sign-In authentication.
- Syncs citizen metadata automatically to MongoDB Atlas.

#### 📝 Complaint Submission
- 📸 Upload compulsory issue photographs.
- 🎙️ Record optional voice notes describing the issue (up to 2 minutes) — XOR restriction ensures a complaint contains either text description or a voice note (but not both).
- ✍️ Add detailed descriptions (minimum 10 characters).
- 📍 Auto-capture GPS coordinates (latitude & longitude).
- 🏷️ Categorize by department (Water, Sanitation, Electrical, Roads, etc.).

#### 📍 Geolocation-based Upvote System
- Automatically detects nearby reported issues.
- Prevents duplicate submissions by prompting upvotes.
- **Optimistic UI Updates** ensure that upvotes reflect instantly without waiting for network hops.

#### 📊 Interactive Dashboard & Maps
- Dynamic app drawer and time-based greetings.
- Live Map view with custom markers representing complaint status (Pending, In Progress, Resolved, Rejected), legend, and details display bottom sheet.
- Clean category filtering on the Complaint Status page.

---

## 🖥️ Municipal Web Dashboard

A comprehensive, role-based dashboard for municipal authorities to efficiently manage and resolve civic complaints.

### Key Features

#### 👥 Department-wise Authentication
- Separate login portals for each department (Water, Sanitation, Electrical, Roads & Infrastructure, Public Health).
- **Admin (Main Officer)** account with full system access.

#### 🤖 AI-based Urgency Detection
- Intelligent analysis of complaint text and images.
- Automatic flagging of critical issues for priority routing.

#### 🗺️ Map Visualization
- View all complaint locations on an interactive city map.
- Filter by department, status, and urgency.

#### 📊 Data Analytics
- Ward-wise complaint trends and comparisons.
- Resolution time metrics and heatmaps for identifying problem zones.
- Export capabilities for official documentation.

---

## 🛠️ Tech Stack

### Mobile Application
| Technology | Purpose |
|------------|---------|
| **Flutter** | Cross-platform mobile framework |
| **Firebase Auth** | Google Sign-in authentication |
| **Geolocator** | GPS location services |
| **Google Maps API** | Map integration |
| **Provider** | State management |

### Web Dashboard
| Technology | Purpose |
|------------|---------|
| **React / Tailwind CSS / Vite** | Web App Stack |
| **Axios** | REST API client |
| **Google Maps API** | Interactive maps |
| **Recharts** | Data visualization |

### Backend & Infrastructure
| Technology | Purpose |
|------------|---------|
| **Node.js / Express** | Custom REST API framework |
| **MongoDB Atlas** | Database storing users, complaints, and notifications |
| **Firebase Admin (FCM)** | Push notifications & auth token verification |
| **Cloudinary** | Image and Voice audio storage |
| **Groq API** | LLaMA-3.1 for urgency classification & Whisper for voice transcription |

---

## 📂 Repository Structure
```
civicProject/
├── civicApp/
│   ├── lib/
│   │   ├── core/
│   │   │   └── network/
│   │   │       └── api_client.dart
│   │   ├── models/
│   │   │   ├── complaint.dart
│   │   │   └── user.dart
│   │   ├── providers/
│   │   │   ├── auth_provider.dart
│   │   │   ├── complaint_provider.dart
│   │   │   └── notification_provider.dart
│   │   ├── repositories/
│   │   │   ├── auth_repository.dart
│   │   │   ├── complaint_repository.dart
│   │   │   └── notification_repository.dart
│   │   ├── screens/
│   │   │   ├── complaint_status.dart
│   │   │   ├── home_screen.dart
│   │   │   ├── loginpage.dart
│   │   │   ├── map_screen.dart
│   │   │   ├── notifications_screen.dart
│   │   │   ├── settings_screen.dart
│   │   │   ├── submit_complaint.dart
│   │   │   └── wrapper.dart
│   │   ├── services/
│   │   │   ├── location_service.dart
│   │   │   └── voice_note_service.dart
│   │   ├── widgets/
│   │   │   ├── category_card.dart
│   │   │   ├── complaint_card.dart
│   │   │   └── upvote_button.dart
│   │   └── main.dart
│   └── pubspec.yaml
│
├── civicWeb/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   └── ui.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx
│   │   ├── pages/
│   │   │   ├── Analytics.jsx
│   │   │   ├── ComplaintDetail.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DepartmentDashboard.jsx
│   │   │   └── Departments.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
│
├── civicBackend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   ├── firebase.js
│   │   │   └── cloudinary.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Complaint.js
│   │   │   └── Notification.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── controllers/
│   │   │   ├── userController.js
│   │   │   └── complaintController.js
│   │   ├── services/
│   │   │   ├── notificationService.js
│   │   │   └── urgencyService.js
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
└── README.md
```

---

## 🚀 Installation

Refer to the respective README files inside `civicApp`, `civicBackend`, and `civicWeb` for project-specific setup and configuration guides.

---

<div align="center">

**Made with ❤️ for better civic governance**

</div>
