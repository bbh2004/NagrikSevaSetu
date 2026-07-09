// lib/core/config/app_config.dart
// ─────────────────────────────────────────────────────────────
// Environment Configuration — injected via --dart-define flags.
//
// Usage:
//   flutter run --dart-define=API_URL=http://10.0.2.2:5000 --dart-define=ENV=dev
//   flutter run --dart-define=API_URL=https://your-backend.onrender.com --dart-define=ENV=prod
//
// 10.0.2.2 is the Android emulator's alias for the host machine's localhost.
// On a physical device, replace with your machine's local IP (e.g. 192.168.1.5:5000).
//
// NEVER hardcode API keys or URLs in Dart source files.
// ─────────────────────────────────────────────────────────────

class AppConfig {
  AppConfig._(); // Private constructor — no instantiation allowed.

  /// The base URL of the civicBackend Express API.
  /// Injected at build time via: --dart-define=API_URL=http://...
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:5000', // Default: Android emulator → localhost
  );

  /// Current environment name.
  static const String env = String.fromEnvironment(
    'ENV',
    defaultValue: 'dev',
  );

  /// Convenience getter: true when running in development mode.
  static bool get isDev => env == 'dev';

  /// Convenience getter: true when running in production mode.
  static bool get isProd => env == 'prod';

  /// Cloudinary cloud name for direct image uploads.
  static const String cloudinaryCloudName = String.fromEnvironment('CLOUDINARY_CLOUD_NAME');

  /// Cloudinary unsigned upload preset name.
  static const String cloudinaryUploadPreset = String.fromEnvironment('CLOUDINARY_UPLOAD_PRESET');

  static void validate() {
    assert(cloudinaryCloudName.isNotEmpty, 'CLOUDINARY_CLOUD_NAME must be set via --dart-define');
  }
}
