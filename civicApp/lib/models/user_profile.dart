// lib/models/user_profile.dart
// ─────────────────────────────────────────────────────────────
// UserProfile Model — maps to the MongoDB User document
// returned by GET /api/users/me and POST /api/users/sync
// ─────────────────────────────────────────────────────────────

class UserProfile {
  final String id; // MongoDB _id
  final String firebaseUid;
  final String name;
  final String email;
  final String? phone;
  final String role; // 'citizen' | 'admin' | 'main_officer' | 'department_staff'
  final String? department; // Only set for department_staff
  final DateTime? createdAt;

  const UserProfile({
    required this.id,
    required this.firebaseUid,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    this.department,
    this.createdAt,
  });

  /// Creates a [UserProfile] from the backend's sync/profile JSON response.
  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      firebaseUid: json['firebaseUid']?.toString() ?? '',
      name: json['name']?.toString() ?? 'User',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      role: json['role']?.toString() ?? 'citizen',
      department: json['department']?.toString() ?? json['deptCategory']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  /// Serializes user data for POST /api/users/sync.
  Map<String, dynamic> toSyncJson() {
    return {
      'name': name,
      'email': email,
      if (phone != null) 'phone': phone,
    };
  }

  /// Whether this user has an elevated role (not a regular citizen).
  bool get isStaff =>
      role == 'admin' || role == 'main_officer' || role == 'department_staff';

  bool get isAdmin => role == 'admin';
}
