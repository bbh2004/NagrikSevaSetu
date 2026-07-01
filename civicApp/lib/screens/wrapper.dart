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
// ─────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'loginpage.dart';
import 'home_screen.dart';

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
      return const Loginpage();
    }

    // Authenticated → Show main app
    return const HomeScreen();
  }
}
