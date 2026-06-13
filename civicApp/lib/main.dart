// lib/main.dart
// ─────────────────────────────────────────────────────────────
// App Entry Point — Dependency Injection & Provider Setup
//
// This is the COMPOSITION ROOT of the application.
// All dependencies are created here, once, and injected
// down the widget tree via MultiProvider.
//
// Dependency graph (bottom to top):
//   Firebase.initializeApp()
//     └─ ApiClient (Dio + Firebase token interceptor)
//         ├─ AuthRepository → AuthProvider
//         ├─ ComplaintRepository → ComplaintProvider
//         └─ NotificationRepository → NotificationProvider
//
// No class in the app creates its own dependencies.
// They are all injected from here. This makes testing trivial.
// ─────────────────────────────────────────────────────────────

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:get/get_navigation/src/root/get_material_app.dart';
import 'package:provider/provider.dart';

import 'core/network/api_client.dart';
import 'providers/auth_provider.dart' as app_auth;
import 'providers/complaint_provider.dart';
import 'providers/notification_provider.dart';
import 'repositories/auth_repository.dart';
import 'repositories/complaint_repository.dart';
import 'repositories/notification_repository.dart';
import 'screens/wrapper.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase (Auth only — Firestore removed)
  await Firebase.initializeApp();

  // ── Build the dependency graph ────────────────────────────────
  // Create the single ApiClient instance. It attaches Firebase
  // tokens automatically via its internal AuthInterceptor.
  final apiClient = ApiClient();

  // Build repositories (data access layer)
  final authRepository    = AuthRepository(apiClient: apiClient);
  final complaintRepository = ComplaintRepository(apiClient: apiClient);
  final notificationRepository = NotificationRepository(apiClient: apiClient);

  runApp(
    MultiProvider(
      providers: [
        // AuthProvider: listen to Firebase Auth state + sync to backend
        ChangeNotifierProvider(
          create: (_) => app_auth.AuthProvider(
            firebaseAuth: FirebaseAuth.instance,
            authRepository: authRepository,
          ),
        ),

        // ComplaintProvider: manages complaint list state
        ChangeNotifierProvider(
          create: (_) => ComplaintProvider(repository: complaintRepository),
        ),

        // NotificationProvider: manages notification state
        ChangeNotifierProvider(
          create: (_) => NotificationProvider(repository: notificationRepository),
        ),
      ],
      child: const CivicApp(),
    ),
  );
}

class CivicApp extends StatelessWidget {
  const CivicApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Nagarik Seva Setu',
      theme: _buildModernTheme(),
      home: const Wrapper(),
    );
  }

  ThemeData _buildModernTheme() {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF6366F1),
        brightness: Brightness.light,
      ).copyWith(
        primary: const Color(0xFF6366F1),
        secondary: const Color(0xFF8B5CF6),
        surface: const Color(0xFFFAFAFA),
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: const Color(0xFF1F2937),
      ),
      fontFamily: 'SF Pro Display',
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
        ),
        displayMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.3,
        ),
        headlineLarge: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.2,
        ),
        headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w500),
        bodyLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          height: 1.5,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          height: 1.4,
        ),
        labelLarge: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.1,
        ),
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Color(0xFF1F2937),
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Color(0xFF1F2937),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.grey.shade50,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
      ),
    );
  }
}
