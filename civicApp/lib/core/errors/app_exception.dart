// lib/core/errors/app_exception.dart
// ─────────────────────────────────────────────────────────────
// Custom Exception Hierarchy
//
// Why a custom exception class?
//   The Dio HTTP client throws DioException. Our repository layer
//   catches those and converts them into these semantic exceptions.
//
//   Screens only deal with AppException — they never see DioException.
//   This is the "anti-corruption layer" pattern. If we swap Dio for
//   another HTTP library, screens never need to change.
// ─────────────────────────────────────────────────────────────

/// Base class for all application-level exceptions.
sealed class AppException implements Exception {
  final String message;
  const AppException(this.message);

  @override
  String toString() => message;
}

/// 401 — Firebase token is missing, expired, or invalid.
class UnauthorizedException extends AppException {
  const UnauthorizedException([
    super.message = 'Session expired. Please log in again.',
  ]);
}

/// 403 — Authenticated but not allowed to perform this action.
class ForbiddenException extends AppException {
  const ForbiddenException([
    super.message = 'You do not have permission to perform this action.',
  ]);
}

/// 404 — The requested resource was not found on the backend.
class NotFoundException extends AppException {
  const NotFoundException([super.message = 'Resource not found.']);
}

/// 4xx validation error — the request body failed Joi/Zod validation.
class ValidationException extends AppException {
  const ValidationException(super.message);
}

/// 5xx — Something went wrong on the server.
class ServerException extends AppException {
  const ServerException([super.message = 'Server error. Please try again later.']);
}

/// Network timeout or no internet connection.
class NetworkException extends AppException {
  const NetworkException([
    super.message = 'No internet connection. Please check your network.',
  ]);
}

/// Catch-all for unexpected errors.
class UnknownException extends AppException {
  const UnknownException([super.message = 'An unexpected error occurred.']);
}
