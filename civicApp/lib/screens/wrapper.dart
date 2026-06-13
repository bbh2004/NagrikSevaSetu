// lib/screens/wrapper.dart
// ─────────────────────────────────────────────────────────────
// Wrapper — Root Navigator Guard
//
// This widget listens to AuthProvider and decides which screen
// to show. It no longer directly accesses FirebaseAuth.
//
// Navigation logic:
//   AuthStatus.unknown       → Loading spinner (app is initializing)
//   AuthStatus.unauthenticated → LoginPage
//   AuthStatus.authenticated   → HomeScreen
//
// The emailVerified check is preserved: if Firebase says the user
// is signed in but email is not verified, they go to VerifyScreen.
// ─────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'loginpage.dart';
import 'home_screen.dart';
import 'verify.dart';

class Wrapper extends StatelessWidget {
  const Wrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    // While Firebase is initializing or syncing to backend
    if (authProvider.status == AuthStatus.unknown || authProvider.isSyncing) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    // Unauthenticated → Show login
    if (authProvider.status == AuthStatus.unauthenticated) {
      // Check if a Firebase user exists but email is not verified
      final firebaseUser = authProvider.firebaseUser;
      if (firebaseUser != null && !firebaseUser.emailVerified) {
        return const Verify();
      }
      return const Loginpage();
    }

    // Authenticated → Show main app
    return const HomeScreen();
  }
}
