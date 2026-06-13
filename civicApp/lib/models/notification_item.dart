// lib/models/notification_item.dart
// ─────────────────────────────────────────────────────────────
// NotificationItem Model — maps to MongoDB Notification document
// returned by GET /api/notifications
// ─────────────────────────────────────────────────────────────

class NotificationItem {
  final String id; // MongoDB _id
  final String userId;
  final String? complaintId;
  final String type; // 'status_update' | 'upvote'
  final String message;
  final bool read;
  final DateTime createdAt;

  const NotificationItem({
    required this.id,
    required this.userId,
    this.complaintId,
    required this.type,
    required this.message,
    required this.read,
    required this.createdAt,
  });

  /// Creates a [NotificationItem] from the backend's JSON response.
  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    // complaintId may be populated (full object) or a raw string
    final rawComplaintId = json['complaintId'];
    final String? complaintId = rawComplaintId is Map
        ? rawComplaintId['_id']?.toString()
        : rawComplaintId?.toString();

    return NotificationItem(
      id: json['_id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      complaintId: complaintId,
      type: json['type']?.toString() ?? 'status_update',
      message: json['message']?.toString() ?? '',
      read: json['read'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  /// Creates a copy with the read field set to true.
  NotificationItem markRead() => NotificationItem(
        id: id,
        userId: userId,
        complaintId: complaintId,
        type: type,
        message: message,
        read: true,
        createdAt: createdAt,
      );
}
