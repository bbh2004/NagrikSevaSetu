// lib/models/complaint.dart
// ─────────────────────────────────────────────────────────────
// Complaint Model — maps to the MongoDB Complaint document
// returned by civicBackend.
//
// Key changes from Phase 2.1:
//   - fromMap() is renamed fromJson() for clarity (it parses
//     backend JSON, not Firestore maps)
//   - toJson() is used when POSTING to backend
//   - id uses MongoDB _id field (not Firestore docId)
//   - location is now a GeoJSON object {type, coordinates:[lng,lat]}
//   - Added urgency field (set by AI on backend)
//   - hasUpvoted field is returned per-user by the backend
// ─────────────────────────────────────────────────────────────

class Complaint {
  final String id;
  final String userId;
  final String category;
  final String description;
  final String? imageUrl;
  final String? voiceNoteUrl;
  final String? voiceNoteTranscript;
  final String status;
  final String urgency; // 'Low' | 'Medium' | 'High' — set by AI backend
  final int upvotes;
  final bool hasUpvoted; // Whether current user has upvoted this complaint
  final double lat;
  final double lng;
  final DateTime createdAt;

  const Complaint({
    required this.id,
    required this.userId,
    required this.category,
    required this.description,
    this.imageUrl,
    this.voiceNoteUrl,
    this.voiceNoteTranscript,
    required this.status,
    this.urgency = 'Low',
    required this.upvotes,
    this.hasUpvoted = false,
    required this.lat,
    required this.lng,
    required this.createdAt,
  });

  /// Creates a [Complaint] from the backend's JSON response.
  ///
  /// The backend returns a MongoDB document where:
  ///   - `_id` is the MongoDB ObjectId string
  ///   - `userId` may be populated (an object with name/email) or a raw string
  ///   - `location` is GeoJSON: { type: "Point", coordinates: [lng, lat] }
  factory Complaint.fromJson(Map<String, dynamic> json) {
    // Extract location: GeoJSON coordinates are [longitude, latitude]
    double lat = 0.0;
    double lng = 0.0;
    if (json['location'] != null && json['location']['coordinates'] != null) {
      final coords = json['location']['coordinates'] as List<dynamic>;
      if (coords.length >= 2) {
        lng = (coords[0] as num).toDouble(); // GeoJSON: index 0 = longitude
        lat = (coords[1] as num).toDouble(); // GeoJSON: index 1 = latitude
      }
    }

    // Extract userId: may be a populated object or raw string
    final rawUserId = json['userId'];
    final String userId = rawUserId is Map
        ? (rawUserId['_id'] ?? rawUserId['firebaseUid'] ?? '').toString()
        : rawUserId?.toString() ?? '';

    return Complaint(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      userId: userId,
      category: json['category']?.toString() ?? 'Others',
      description: json['description']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString(),
      voiceNoteUrl: json['voiceNoteUrl']?.toString(),
      voiceNoteTranscript: json['voiceNoteTranscript']?.toString(),
      status: json['status']?.toString() ?? 'Pending',
      urgency: json['urgency']?.toString() ?? 'Low',
      upvotes: (json['upvotes'] as num?)?.toInt() ?? 0,
      hasUpvoted: json['hasUpvoted'] as bool? ?? false,
      lat: lat,
      lng: lng,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  /// Serializes the complaint for a POST /api/complaints request body.
  Map<String, dynamic> toJson() {
    return {
      'category': category,
      'description': description,
      'lat': lat,
      'lng': lng,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (voiceNoteUrl != null) 'voiceNoteUrl': voiceNoteUrl,
    };
  }

  /// Creates a copy of this complaint with updated fields.
  Complaint copyWith({
    String? status,
    int? upvotes,
    bool? hasUpvoted,
    String? urgency,
  }) {
    return Complaint(
      id: id,
      userId: userId,
      category: category,
      description: description,
      imageUrl: imageUrl,
      voiceNoteUrl: voiceNoteUrl,
      voiceNoteTranscript: voiceNoteTranscript,
      status: status ?? this.status,
      urgency: urgency ?? this.urgency,
      upvotes: upvotes ?? this.upvotes,
      hasUpvoted: hasUpvoted ?? this.hasUpvoted,
      lat: lat,
      lng: lng,
      createdAt: createdAt,
    );
  }
}
