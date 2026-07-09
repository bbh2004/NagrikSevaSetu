// lib/core/config/app_config.dart
// ─────────────────────────────────────────────────────────────
// Environment Configuration — injected via --dart-define flags.
//
// HOW TO RUN:
//   Emulator (dev):
//     flutter run --dart-define=ENV=dev
//
//   Physical phone on hotspot (dev):
//     flutter run --dart-define=ENV=dev --dart-define=API_URL=http://10.198.210.242:5000
//
//   Production build:
//     flutter build apk --dart-define=ENV=prod
//
// Priority: API_URL flag → ENV-based default (emulator/prod)
// ─────────────────────────────────────────────────────────────

class AppConfig {
  AppConfig._(); // Private constructor — no instantiation allowed.

  // Raw injected URL — only set when running on a physical device with a hotspot IP.
  static const String _injectedApiUrl = String.fromEnvironment('API_URL', defaultValue: '');

  /// The base URL of the civicBackend Express API.
  ///
  /// Priority:
  ///   1. If --dart-define=API_URL=... is passed → use it (physical device / hotspot)
  ///   2. If ENV=dev → emulator default (10.0.2.2:5000)
  ///   3. If ENV=prod → Render production URL
  static String get apiUrl {
    if (_injectedApiUrl.isNotEmpty) return _injectedApiUrl; // Physical device override
    if (isDev) return 'http://10.0.2.2:5000';               // Android emulator
    return 'https://civic-api.onrender.com';                 // Production (Render)
  }

  /// Current environment name. Defaults to 'dev' if not injected.
  static const String env = String.fromEnvironment(
    'ENV',
    defaultValue: 'dev',
  );

  /// Convenience getter: true when running in development mode.
  static bool get isDev => env == 'dev';

  /// Convenience getter: true when running in production mode.
  static bool get isProd => env == 'prod';

  /// Cloudinary cloud name for direct image uploads.
  static const String cloudinaryCloudName = String.fromEnvironment(
    'CLOUDINARY_CLOUD_NAME',
    defaultValue: 'dmecx8pcz', // fallback so validate() doesn't crash in dev
  );

  /// Cloudinary unsigned upload preset name.
  static const String cloudinaryUploadPreset = String.fromEnvironment(
    'CLOUDINARY_UPLOAD_PRESET',
    defaultValue: 'civic_sih2025',
  );

  static void validate() {
    assert(cloudinaryCloudName.isNotEmpty, 'CLOUDINARY_CLOUD_NAME must be set via --dart-define');
  }
}
