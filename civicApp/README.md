# civicApp - Nagrik Seva Setu (Citizen App)

A Flutter application designed for citizens to report and track civic complaints in their locality.

## Features

- **Authentication:** Firebase Authentication (Email/Password, Google Sign-In planned).
- **Complaint Submission:** Add text descriptions or **Voice Notes** (max 2 minutes) along with photo evidence.
- **Auto GPS Logging:** Captures accurate location using `geolocator`.
- **Live Maps:** Integrated Google Maps view of all complaints in the city, automatically centering to the user's location.
- **Smart Duplicate Prevention:** Built-in distance calculation to suggest upvoting nearby matching complaints instead of creating duplicates.
- **Real-time Push Notifications:** Firebase Cloud Messaging (FCM) integration for live status updates on your reported issues.

## Tech Stack

- **Framework:** Flutter (v3.0+)
- **State Management:** Provider
- **Auth & Notifications:** `firebase_auth`, `firebase_messaging`
- **Location & Maps:** `geolocator`, `google_maps_flutter`
- **Media Uploads:** `image_picker`, `record` (for voice notes), Cloudinary signed uploads via backend
- **API Communication:** Standard HTTP requests synchronized with `civicBackend`.

## Getting Started

### 1. Prerequisites
- Flutter SDK installed.
- Android Studio / Xcode for emulators.

### 2. Install Packages
```bash
flutter pub get
```

### 3. Firebase Configuration
You must link your own Firebase project.
- For Android: Place `google-services.json` inside `android/app/`.
- For iOS: Place `GoogleService-Info.plist` inside `ios/Runner/`.

### 4. Google Maps Configuration
- Open `android/app/src/main/AndroidManifest.xml` and insert your API key:
```xml
<meta-data android:name="com.google.android.geo.API_KEY" android:value="YOUR_KEY_HERE"/>
```

### 5. API Base URL
The app communicates with `civicBackend`. Configure the base URL in `lib/services/api_service.dart` or `firebase_service.dart` to match your local or deployed backend (e.g., `http://10.0.2.2:5000/api` for Android Emulator).

### 6. Run the App
```bash
flutter run
```
