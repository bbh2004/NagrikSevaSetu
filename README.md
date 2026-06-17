# 🏛️ Nagrik Seva Setu — Civic Grievance Redressal System

[![Smart India Hackathon 2025](https://img.shields.io/badge/SIH-2025-blue.svg)](https://www.sih.gov.in/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?logo=flutter&logoColor=white)](https://flutter.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)


> A Smart India Hackathon 2025 project developed for the **Government of Jharkhand** to streamline public grievance reporting and municipal complaint management.

---

## 📋 Table of Contents

- [Overview](#overview)
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

- **Citizens** to report complaints with images, descriptions, and GPS locations
- **Municipal officials** to view, prioritize, and resolve complaints via a dedicated web dashboard
- **City authorities** to access analytics, maps, and departmental insights for data-driven decision-making

The system intelligently reduces duplicate complaints, improves response accuracy, and enhances public participation in civic governance.

---

## ✨ Features

### 🌟 Core Capabilities

- ✅ **End-to-end complaint tracking** from submission to resolution with audit logs
- 🔄 **Duplicate prevention** via geolocation-based nearby check and upvoting system
- 🤖 **AI-driven urgency classification** for critical issues (Gemini Integration)
- 🗺️ **Interactive map visualization** using Google Maps
- 📊 **Analytics dashboard** for municipal insights
- 🔥 **REST API synchronization** across mobile app and web dashboard via a custom Express/MongoDB backend

---

## 📱 Mobile Application (Flutter)

The citizen-facing mobile application provides an intuitive interface for reporting and tracking civic issues.

### Key Features

#### 🔐 Secure Authentication
- Email-based login
- Firebase Authentication
- Google Sign-In integration (planned)

#### 📝 Complaint Submission
- 📸 Upload issue photographs
- ✍️ Add detailed descriptions
- 📍 Auto-capture GPS coordinates (latitude & longitude)
- 🏷️ Categorize by department (Water, Sanitation, Electrical, Roads, etc.)

#### 📍 Geolocation-based Upvote System
- Automatically detects nearby reported issues
- Prevents duplicate submissions
- Users can upvote existing complaints instead of creating new ones
- Increases complaint visibility and priority

#### 📊 Interactive Dashboard
- Department-wise complaint categorization
- Real-time complaint status updates
- Upvote tracking
- Resolution history

#### 🎨 UI Enhancements
- 🌓 Light/Dark mode support
- 🗺️ Integrated map view
- 📱 Responsive design
- 🔔 Push notifications for status updates

---

## 🖥️ Municipal Web Dashboard

A comprehensive, role-based dashboard for municipal authorities to efficiently manage and resolve civic complaints.

### Key Features

#### 👥 Department-wise Authentication
- Separate login portals for each department
  - Water Supply
  - Sanitation
  - Electrical
  - Roads & Infrastructure
  - Public Health
- **Admin (Main Officer)** account with full system access

#### 🤖 AI-based Urgency Detection
- Intelligent analysis of complaint text and images
- Automatic flagging of critical issues:
  - ⚡ Electrical hazards
  - 💧 Major water leakages
  - 🔥 Gas leaks
  - 🚧 Road safety concerns
- Priority-based sorting and routing

#### 🗺️ Map Visualization (Leaflet)
- View all complaint locations on an interactive city map
- Clickable markers with detailed issue information
- Filter by department, status, and urgency
- Cluster view for high-density areas

#### 📊 Data Analytics
- **Ward-wise complaint trends** and comparisons
- **Complaint type distribution** charts
- **Resolution time metrics** and performance tracking
- **Heatmaps** for identifying problem zones
- **Statistical reports** for administrative review
- Export capabilities for official documentation

#### ⚡ Real-time Updates
- Live data synchronization with Firebase
- Instant notification of new complaints
- Status update broadcasting
- Department-to-department communication

---

## 🛠️ Tech Stack

### Mobile Application
| Technology | Purpose |
|------------|---------|
| **Flutter** | Cross-platform mobile framework |
| **Firebase Auth** | User authentication |
| **Firebase Firestore** | Real-time database |
| **Geolocator** | GPS location services |
| **Google Maps API** | Map integration |

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
| **Google Firebase** | Backend as a Service (BaaS) |
| **Cloud Firestore** | NoSQL database |
| **Firebase Storage** | Image and file storage |
| **Firebase Cloud Functions** | Serverless computing |

---

## 📂 Repository Structure
```
civicProject/
├── civicApp/
│   ├── lib/
│   │   ├── models/
│   │   │   ├── complaint.dart
│   │   │   └── user.dart
│   │   ├── screens/
│   │   │   ├── auth_screen.dart
│   │   │   ├── complaint_status.dart
│   │   │   ├── forgot.dart
│   │   │   ├── home_screen.dart
│   │   │   ├── loginpage.dart
│   │   │   ├── map_screen.dart
│   │   │   ├── notifications_screen.dart
│   │   │   ├── settings_screen.dart
│   │   │   ├── signup.dart
│   │   │   ├── submit_complaint.dart
│   │   │   ├── verify.dart
│   │   │   └── wrapper.dart
│   │   ├── services/
│   │   │   ├── firebase_service.dart
│   │   │   └── location_service.dart
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
│   │   ├── assets/
│   │   │   └── react.svg
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
│   │   │   ├── cloudinary.js
│   │   │   ├── firebase.js
│   │   │   └── firebasePlaceholders.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- **Flutter SDK** (v3.0+)
- **Node.js** (v16+)
- **Firebase Account**
- **Google Maps API Key**
- **Git**

### Mobile App Setup
```bash
# Navigate to mobile app directory
cd civicApp

# Install dependencies
flutter pub get

# Configure Firebase
# Add your google-services.json (Android) and GoogleService-Info.plist (iOS)

# Run the app
flutter run
```

### Backend API Setup
```bash
# Navigate to backend directory
cd civicBackend

# Install dependencies
npm install

# Configure environment
# Copy .env.example to .env and add MongoDB/Firebase credentials

# Start development server
npm start
```

### Web Dashboard Setup
```bash
# Navigate to web directory
cd civicWeb

# Install dependencies
npm install

# Configure Firebase and API base URL in .env
# VITE_API_BASE_URL=http://localhost:5000/api

# Run development server
npm run dev

# Open browser at http://localhost:5173
```

### Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email & Google Sign-In)
3. Create Firestore Database
4. Set up Firebase Storage
5. Download configuration files and add to respective directories

---

## 💡 Usage

### For Citizens (Mobile App)

1. **Register/Login** using email or Google account
2. **Report an issue:**
   - Capture or upload a photo
   - Write a description
   - Select department category
   - Submit (GPS automatically captured)
3. **Upvote nearby issues** instead of duplicating
4. **Track complaint status** in dashboard
5. **Receive notifications** on resolution

### For Municipal Officers (Web Dashboard)

1. **Login** with department credentials
2. **View assigned complaints** on dashboard
3. **Check AI urgency flags** for critical issues
4. **Update complaint status:**
   - Acknowledged
   - In Progress
   - Resolved
5. **Analyze data** via charts and maps
6. **Generate reports** for administrative review

---



## 🤝 Contributing

We welcome contributions from the community! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.






---

<div align="center">

**Made with ❤️ for better civic governance**

[Report Bug](https://github.com/yourusername/nagrik-seva-setu/issues) · [Request Feature](https://github.com/yourusername/nagrik-seva-setu/issues)

</div>
