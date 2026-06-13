// lib/repositories/notification_repository.dart
// ─────────────────────────────────────────────────────────────
// Notification Repository — Data Access Layer for Notifications
//
// Backend endpoints used:
//   GET   /api/notifications          → getMyNotifications
//   PATCH /api/notifications/:id/read → markAsRead
//   PATCH /api/notifications/read-all → markAllAsRead
// ─────────────────────────────────────────────────────────────

import '../core/network/api_client.dart';
import '../models/notification_item.dart';

class NotificationRepository {
  final ApiClient _apiClient;

  NotificationRepository({required ApiClient apiClient})
      : _apiClient = apiClient;

  /// GET /api/notifications — Fetch all notifications for the current user.
  ///
  /// Returns a tuple of [notifications] list and [unreadCount].
  Future<({List<NotificationItem> notifications, int unreadCount})>
      getMyNotifications() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/notifications',
    );

    final List<dynamic> rawList = response.data!['data'] as List<dynamic>;
    final int unreadCount =
        (response.data!['unreadCount'] as num?)?.toInt() ?? 0;

    final notifications = rawList
        .map((json) =>
            NotificationItem.fromJson(json as Map<String, dynamic>))
        .toList();

    return (notifications: notifications, unreadCount: unreadCount);
  }

  /// PATCH /api/notifications/:id/read — Mark one notification as read.
  Future<void> markAsRead(String notificationId) async {
    await _apiClient.patch<Map<String, dynamic>>(
      '/api/notifications/$notificationId/read',
    );
  }

  /// PATCH /api/notifications/read-all — Mark all notifications as read.
  Future<void> markAllAsRead() async {
    await _apiClient.patch<Map<String, dynamic>>(
      '/api/notifications/read-all',
    );
  }
}
