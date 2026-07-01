// lib/providers/auth_provider.dart
// ─────────────────────────────────────────────────────────────
// AuthProvider — Manages Authentication State
//
// This provider is the single source of truth for:
//   1. Firebase Auth state (is user signed in?)
//   2. MongoDB UserProfile (role, name, department)
//
// Flow:
//   Firebase Auth sign-in → AuthProvider calls AuthRepository.syncUser()
//   → MongoDB record created/updated → UserProfile stored in state
//   → Wrapper widget reacts and navigates to HomeScreen
//
// Key design: Firebase Auth is the source of authentication truth.
// MongoDB is the source of authorization truth (role/permissions).
// ─────────────────────────────────────────────────────────────

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../repositories/auth_repository.dart';
import '../models/user_profile.dart';
import '../core/errors/app_exception.dart';
import '../services/push_notification_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  final FirebaseAuth _firebaseAuth;
  final AuthRepository _authRepository;
  PushNotificationService? _pushNotificationService;

  AuthStatus _status = AuthStatus.unknown;
  UserProfile? _userProfile;
  String? _errorMessage;
  bool _isSyncing = false;

  AuthProvider({
    required FirebaseAuth firebaseAuth,
    required AuthRepository authRepository,
  })  : _firebaseAuth = firebaseAuth,
        _authRepository = authRepository {
    // Listen to Firebase Auth state changes.
    // This is the primary driver of authentication state in the app.
    _firebaseAuth.authStateChanges().listen(_onAuthStateChanged);
  }

  // ── Getters ───────────────────────────────────────────────────
  AuthStatus get status => _status;
  UserProfile? get userProfile => _userProfile;
  String? get errorMessage => _errorMessage;
  bool get isSyncing => _isSyncing;
  User? get firebaseUser => _firebaseAuth.currentUser;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  // ── Auth State Listener ───────────────────────────────────────

  Future<void> _onAuthStateChanged(User? user) async {
    debugPrint('[AuthProvider] _onAuthStateChanged triggered. User: ${user?.email}, verified: ${user?.emailVerified}');
    if (user == null) {
      debugPrint('[AuthProvider] User is null. Setting status to unauthenticated.');
      _status = AuthStatus.unauthenticated;
      _userProfile = null;
      notifyListeners();
      return;
    }

    // User is signed in — fetch/sync their MongoDB profile
    if (user.emailVerified) {
      debugPrint('[AuthProvider] User is verified. Initiating backend sync...');
      _isSyncing = true;
      notifyListeners();
      await _syncToBackend(user);
      _isSyncing = false;
      notifyListeners();
    } else {
      debugPrint('[AuthProvider] User is NOT verified. Status remains unauthenticated.');
      _status = AuthStatus.unauthenticated;
      _userProfile = null;
      notifyListeners();
    }
  }

  /// Syncs the Firebase user to MongoDB and loads their profile.
  Future<void> _syncToBackend(User user) async {
    try {
      debugPrint('[AuthProvider] Calling _authRepository.syncUser...');
      
      // Firebase sometimes returns an empty string instead of null for displayName
      final resolvedName = (user.displayName != null && user.displayName!.trim().isNotEmpty)
          ? user.displayName!
          : (user.email?.split('@').first ?? 'User');

      _userProfile = await _authRepository.syncUser(
        name: resolvedName,
        email: user.email ?? '',
      );
      debugPrint('[AuthProvider] Backend sync successful. Setting status to authenticated.');
      _status = AuthStatus.authenticated;
      _errorMessage = null;

      // Initialize Push Notifications now that user is fully authenticated
      _pushNotificationService ??= PushNotificationService(authRepository: _authRepository);
      await _pushNotificationService!.initialize();

    } on AppException catch (e) {
      // If sync fails, the user is still Firebase-authenticated but
      // we cannot confirm their backend profile. Keep them in unknown state
      // rather than crashing. The next app launch will retry.
      debugPrint('[AuthProvider] Backend sync failed: ${e.message}');
      _status = AuthStatus.unauthenticated;
      _errorMessage = e.message;
    } catch (e) {
      debugPrint('[AuthProvider] Unexpected sync error: $e');
      _status = AuthStatus.unauthenticated;
    }
  }

  /// Reloads the current Firebase user and updates the auth state.
  Future<void> reloadUser() async {
    debugPrint('[AuthProvider] Manually reloading Firebase user...');
    final user = _firebaseAuth.currentUser;
    if (user != null) {
      await user.reload();
      final updatedUser = _firebaseAuth.currentUser;
      debugPrint('[AuthProvider] Reload completed. Updated emailVerified: ${updatedUser?.emailVerified}');
      await _onAuthStateChanged(updatedUser);
    }
  }

  // ── Auth Actions ──────────────────────────────────────────────

  /// Signs in with email and password.
  /// Returns an error message string on failure, null on success.
  Future<String?> signInWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      await _firebaseAuth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      // _onAuthStateChanged will fire automatically and sync to backend.
      return null;
    } on FirebaseAuthException catch (e) {
      return _mapFirebaseAuthError(e.code);
    } catch (e) {
      return 'An unexpected error occurred.';
    }
  }

  /// Creates a new Firebase account and sends a verification email.
  /// Returns an error message string on failure, null on success.
  Future<String?> signUpWithEmail({
    required String email,
    required String password,
    String? name,
  }) async {
    try {
      final cred = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );

      // Set display name if provided
      if (name != null && name.isNotEmpty) {
        await cred.user?.updateDisplayName(name);
      }

      // Verify screen will automatically send the verification email upon loading.
      return null;
    } on FirebaseAuthException catch (e) {
      return _mapFirebaseAuthError(e.code);
    } catch (e) {
      return 'An unexpected error occurred.';
    }
  }

  /// Signs out from Firebase Auth.
  Future<void> signOut() async {
    await _firebaseAuth.signOut();
    // _onAuthStateChanged fires automatically.
  }

  /// Sends a password reset email.
  Future<String?> sendPasswordResetEmail(String email) async {
    try {
      await _firebaseAuth.sendPasswordResetEmail(email: email.trim());
      return null;
    } on FirebaseAuthException catch (e) {
      return _mapFirebaseAuthError(e.code);
    } catch (e) {
      return 'An unexpected error occurred.';
    }
  }

  /// Manually refreshes the MongoDB user profile.
  Future<void> refreshProfile() async {
    try {
      _userProfile = await _authRepository.getMyProfile();
      notifyListeners();
    } on AppException catch (e) {
      debugPrint('[AuthProvider] Profile refresh failed: ${e.message}');
    }
  }

  // ── Private: Firebase Error Code Mapping ─────────────────────

  String _mapFirebaseAuthError(String code) {
    return switch (code) {
      'user-not-found' => 'No account found with this email.',
      'wrong-password' => 'Incorrect password.',
      'invalid-credential' => 'Invalid email or password.',
      'email-already-in-use' => 'An account with this email already exists.',
      'weak-password' => 'Password must be at least 6 characters.',
      'invalid-email' => 'Please enter a valid email address.',
      'user-disabled' => 'This account has been disabled.',
      'too-many-requests' => 'Too many attempts. Please try again later.',
      'network-request-failed' => 'Network error. Check your connection.',
      _ => 'Authentication failed. Please try again.',
    };
  }
}
