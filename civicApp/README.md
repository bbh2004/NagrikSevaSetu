# civicApp - Nagrik Seva Setu (Citizen App)

A Flutter application designed for citizens to report and track civic complaints in their locality.

## Features

- **Google Sign-In Authentication:** Simplified onboarding via Google Login. Removes legacy email/password authentication entirely.
- **Complaint Submission:** Add text descriptions (minimum 10 characters) OR record **Voice Notes** (max 2 minutes) along with mandatory photo evidence.
- **Auto GPS Logging:** Captures accurate location using `geolocator` when filing complaints.
- **Live Maps:** Integrated Google Maps view of all complaints in the city, using custom status-colored markers (Orange: Pending, Blue: In Progress, Green: Resolved, Red: Rejected), an interactive detail bottom sheet, and an on-screen legend.
- **Instant Upvoting:** Users can upvote existing complaints to prevent duplicate issues. The app utilizes optimistic UI state management to update upvote badges and button colors instantly without lagging.
- **Real-time Push Notifications:** Firebase Cloud Messaging (FCM) integration for live status updates on your reported issues.
- **Premium UI/UX:** Material 3 design featuring custom animations on the login page, custom greetings on the home dashboard, and grouped, clean list layouts on the settings and notifications screens.

## Tech Stack

- **Framework:** Flutter (v3.0+)
- **State Management:** Provider
- **Auth & Notifications:** `firebase_auth`, `firebase_messaging`
- **Location & Maps:** `geolocator`, `google_maps_flutter`
- **Media Uploads:** `image_picker`, `record` (for voice notes), Cloudinary signed uploads via backend
- **API Client:** Clean Architecture implementation with a central `ApiClient` handling request-response interceptors and repository-level state sync.

## Getting Started

### 1. Prerequisites
- Flutter SDK installed.
- Android Studio / Xcode for emulators or physical device testing.

### 2. Install Packages
```bash
flutter pub get
```

### 3. Firebase Configuration
Link your Firebase project to support Google Sign-In and FCM:
- For Android: Place your generated `google-services.json` inside `android/app/`. Make sure Google Sign-In is enabled in the Firebase Console, and your debug/release SHA fingerprints are added.
- For iOS: Place `GoogleService-Info.plist` inside `ios/Runner/`.

### 4. Google Maps Configuration
- Open `android/app/src/main/AndroidManifest.xml` and insert your API key:
```xml
<meta-data android:name="com.google.android.geo.API_KEY" android:value="YOUR_KEY_HERE"/>
```

### 5. API Base URL
The app communicates with `civicBackend`. Define the base URL at run-time or configure it in `lib/core/network/api_client.dart` to match your local network address (e.g. `http://10.0.2.2:5000/api` for Android Emulator or your local IP address).

Example for launching with a custom defined API URL:
```bash
flutter run --dart-define=API_URL=http://<YOUR_IP>:5000
```

### 6. Run the App
```bash
flutter run
```
