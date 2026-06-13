// lib/providers/notification_provider.dart
// ─────────────────────────────────────────────────────────────
// NotificationProvider — Manages Notification State
//
// Note on real-time vs polling:
//   The backend uses REST (not WebSockets), so notifications
//   are not pushed in real-time. This provider fetches them
//   when the notifications screen is opened (pull-to-refresh pattern).
//
//   Future: can be upgraded to polling or WebSocket push without
//   changing any screen code — only this provider changes.
// ─────────────────────────────────────────────────────────────

import 'package:flutter/foundation.dart';
import '../repositories/notification_repository.dart';
import '../models/notification_item.dart';
import '../core/errors/app_exception.dart';

class NotificationProvider extends ChangeNotifier {
  final NotificationRepository _repository;

  // ── State ─────────────────────────────────────────────────────
  List<NotificationItem> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  String? _errorMessage;

  NotificationProvider({required NotificationRepository repository})
      : _repository = repository;

  // ── Getters ───────────────────────────────────────────────────
  List<NotificationItem> get notifications => List.unmodifiable(_notifications);
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // ── Actions ───────────────────────────────────────────────────

  /// Loads notifications from the backend.
  Future<void> loadNotifications() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _repository.getMyNotifications();
      _notifications = result.notifications;
      _unreadCount = result.unreadCount;
    } on AppException catch (e) {
      _errorMessage = e.message;
      debugPrint('[NotificationProvider] load error: ${e.message}');
    } catch (e) {
      _errorMessage = 'Failed to load notifications.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Marks a single notification as read.
  /// Applies an optimistic update immediately, then confirms with backend.
  Future<void> markAsRead(String notificationId) async {
    // Optimistic update
    final idx = _notifications.indexWhere((n) => n.id == notificationId);
    if (idx == -1 || _notifications[idx].read) return;

    _notifications = List.from(_notifications)..[idx] = _notifications[idx].markRead();
    _unreadCount = _unreadCount > 0 ? _unreadCount - 1 : 0;
    notifyListeners();

    try {
      await _repository.markAsRead(notificationId);
    } on AppException catch (e) {
      debugPrint('[NotificationProvider] markAsRead error: ${e.message}');
      // If it fails, re-load to get consistent state
      await loadNotifications();
    }
  }

  /// Marks all notifications as read.
  Future<void> markAllAsRead() async {
    // Optimistic update
    _notifications = _notifications.map((n) => n.markRead()).toList();
    _unreadCount = 0;
    notifyListeners();

    try {
      await _repository.markAllAsRead();
    } on AppException catch (e) {
      debugPrint('[NotificationProvider] markAllAsRead error: ${e.message}');
      await loadNotifications();
    }
  }

  /// Clears notification data on sign-out.
  void clearAll() {
    _notifications = [];
    _unreadCount = 0;
    _errorMessage = null;
    notifyListeners();
  }
}
