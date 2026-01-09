class Complaint {
  final String id;
  final String userId;
  final String category;
  final String description;
  final String? imageUrl;
  final String? voiceNoteUrl;
  final String status;
  final int upvotes;
  final double lat;
  final double lng;
  final DateTime createdAt;

  Complaint({
    required this.id,
    required this.userId,
    required this.category,
    required this.description,
    this.imageUrl,
    this.voiceNoteUrl,
    required this.status,
    required this.upvotes,
    required this.lat,
    required this.lng,
    required this.createdAt,
  });

  /// Convert the Complaint object into a Map for Firebase storage
  Map<String, dynamic> toMap() {
    return {
      "userId": userId,
      "category": category,
      "description": description,
      "imageUrl": imageUrl,
      "voiceNoteUrl": voiceNoteUrl,
      "status": status,
      "upvotes": upvotes,
      "location": {"lat": lat, "lng": lng},
      "createdAt": createdAt.toIso8601String(),
    };
  }

  /// Factory constructor to create a Complaint object from Firebase map
  factory Complaint.fromMap(String id, Map<String, dynamic> map) {
    return Complaint(
      id: id,
      userId: map['userId'] ?? '',
      category: map['category'] ?? 'Others',
      description: map['description'] ?? '',
      imageUrl: map['imageUrl'],
      voiceNoteUrl: map['voiceNoteUrl'],
      status: map['status'] ?? 'Pending',
      upvotes: map['upvotes'] ?? 0,
      lat: map['location']?['lat']?.toDouble() ?? 0.0,
      lng: map['location']?['lng']?.toDouble() ?? 0.0,
      createdAt: map['createdAt'] != null
          ? DateTime.parse(map['createdAt'])
          : DateTime.now(),
    );
  }
}
