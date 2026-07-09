// lib/core/network/api_client.dart
// ─────────────────────────────────────────────────────────────
// Centralized API Client (Dio wrapper)
//
// This is the ONLY class in the entire app that knows how to
// make raw HTTP requests. All repositories depend on this.
//
// Responsibilities:
//   1. Set base URL from AppConfig (injected via --dart-define)
//   2. Attach Firebase Auth ID token to every request as a
//      Bearer token in the Authorization header
//   3. Handle token refresh: if a request fails with 401,
//      force-refresh the token and retry once
//   4. Map DioException status codes to AppException types
//      so the UI layer never sees low-level HTTP errors
// ─────────────────────────────────────────────────────────────

import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../config/app_config.dart';
import '../errors/app_exception.dart';

class ApiClient {
  late final Dio _dio;
  final FirebaseAuth _auth;

  ApiClient({FirebaseAuth? auth}) : _auth = auth ?? FirebaseAuth.instance {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add the auth interceptor — attaches the Firebase ID token
    _dio.interceptors.add(_AuthInterceptor(_auth, _dio));

    // Add logging in dev mode only
    if (AppConfig.isDev) {
      _dio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          requestHeader: false,
          responseHeader: false,
        ),
      );
    }
  }

  // ── HTTP Methods ──────────────────────────────────────────────

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return _execute(() => _dio.get<T>(path, queryParameters: queryParameters));
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return _execute(
      () => _dio.post<T>(path, data: data, queryParameters: queryParameters),
    );
  }

  Future<Response<T>> patch<T>(String path, {dynamic data}) async {
    return _execute(() => _dio.patch<T>(path, data: data));
  }

  Future<Response<T>> delete<T>(String path) async {
    return _execute(() => _dio.delete<T>(path));
  }

  // ── Multipart (file upload) ───────────────────────────────────

  Future<Response<T>> postForm<T>(
    String path,
    FormData formData,
  ) async {
    return _execute(() => _dio.post<T>(path, data: formData));
  }

  // ── Private: Error Mapping ────────────────────────────────────

  /// Executes the Dio call and maps DioException → AppException.
  Future<Response<T>> _execute<T>(
    Future<Response<T>> Function() call,
  ) async {
    try {
      return await call();
    } on DioException catch (e) {
      throw _mapDioError(e);
    } catch (e) {
      throw const UnknownException();
    }
  }

  /// Maps a [DioException] to a semantic [AppException].
  AppException _mapDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.connectionError:
        return const NetworkException();

      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final responseData = e.response?.data;
        // Extract the backend's error message if available
        final message = responseData is Map
            ? (responseData['message'] as String?) ?? 'An error occurred.'
            : 'An error occurred.';

        final code = statusCode ?? 0;
        return switch (code) {
          401 => UnauthorizedException(message),
          403 => ForbiddenException(message),
          404 => NotFoundException(message),
          422 => ValidationException(message),
          >= 400 && < 500 => ValidationException(message),
          >= 500 => ServerException(message),
          _ => UnknownException(message),
        };

      default:
        return const UnknownException();
    }
  }
}

// ── Auth Interceptor ──────────────────────────────────────────
// Automatically attaches the Firebase ID token to every request.
// If a 401 is received, it refreshes the token and retries once.

class _AuthInterceptor extends Interceptor {
  final FirebaseAuth _auth;
  final Dio _dio;

  _AuthInterceptor(this._auth, this._dio);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final user = _auth.currentUser;
    if (user != null) {
      // forceRefresh: false — uses cached token unless it's close to expiry.
      // Firebase SDK automatically refreshes tokens that expire within 5 min.
      final token = await user.getIdToken(false);
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // If 401, the token may have just expired. Force-refresh and retry ONCE.
    if (err.response?.statusCode == 401) {
      if (err.requestOptions.extra['isRetry'] == true) {
        return handler.next(err); // Prevent recursive retry
      }
      try {
        final user = _auth.currentUser;
        if (user != null) {
          final freshToken = await user.getIdToken(true); // forceRefresh: true
          final options = err.requestOptions;
          options.extra['isRetry'] = true;
          options.headers['Authorization'] = 'Bearer $freshToken';
          // Retry the original request with the fresh token
          final response = await _dio.fetch(options);
          return handler.resolve(response);
        }
      } catch (_) {
        // If refresh also fails, let the original error propagate
      }
    }
    handler.next(err);
  }
}
