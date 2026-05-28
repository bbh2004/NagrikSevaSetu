// lib/services/firebase_service.dart
import 'dart:io';
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:mime/mime.dart';
import 'package:http_parser/http_parser.dart';
import '../models/complaint.dart';

class FirebaseService {
  final FirebaseFirestore _fire = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // --- Cloudinary Config ---
  static const String _cloudName = 'dmecx8pcz';
  static const String _uploadPreset = 'civic_sih2025';

  // Upload image to Cloudinary
  Future<String> uploadImageToCloudinary(File file) async {
    if (_cloudName.isEmpty || _uploadPreset.isEmpty) {
      throw Exception('Cloudinary not configured in FirebaseService.');
    }

    final uri = Uri.parse(
      'https://api.cloudinary.com/v1_1/$_cloudName/image/upload',
    );
    final mimeType = lookupMimeType(file.path) ?? 'image/jpeg';
    final parts = mimeType.split('/');

    final request = http.MultipartRequest('POST', uri);
    request.fields['upload_preset'] = _uploadPreset;

    final multipartFile = await http.MultipartFile.fromPath(
      'file',
      file.path,
      contentType: MediaType(parts[0], parts[1]),
    );
    request.files.add(multipartFile);

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final Map<String, dynamic> body = json.decode(response.body);
      return body['secure_url'] as String;
    } else {
      throw Exception(
        'Cloudinary upload failed: ${response.statusCode} ${response.body}',
      );
    }
  }

  // Add complaint
  Future<String> addComplaint(Complaint complaint) async {
    final docRef = await _fire.collection('complaints').add(complaint.toMap());
    return docRef.id;
  }

  // Stream complaints
  Stream<List<Complaint>> getComplaints() {
    return _fire
        .collection('complaints')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map(
          (snap) =>
              snap.docs.map((d) => Complaint.fromMap(d.id, d.data())).toList(),
        );
  }

  // Update complaint status + automatic notification
  Future<void> updateComplaintStatus(String id, String status) async {
    await _fire.collection('complaints').doc(id).update({'status': status});

    final docSnapshot = await _fire.collection('complaints').doc(id).get();
    final complaintData = docSnapshot.data();
    if (complaintData != null &&
        complaintData['userId'] != null &&
        complaintData['userId'] != '') {
      final userId = complaintData['userId'];
      final message =
          'Your complaint "${complaintData['category'] ?? 'Unknown'}" status has been updated to "$status".';

      // Automatic notification creation
      await _fire
          .collection('notifications')
          .add({
            'userId': userId,
            'complaintId': id,
            'type': 'status_update',
            'message': message,
            'createdAt': DateTime.now().toIso8601String(),
            'read': false,
          })
          .then((docRef) {
            print('Notification created with ID: ${docRef.id}');
          })
          .catchError((error) {
            print('Failed to create notification: $error');
          });
    }
  }

  // Toggle upvote + automatic notification
  Future<void> toggleUpvote(String id, String userId) async {
    final ref = _fire
        .collection('complaints')
        .doc(id)
        .collection('upvotes')
        .doc(userId);
    final doc = await ref.get();

    final complaintDoc = await _fire.collection('complaints').doc(id).get();
    final complaintData = complaintDoc.data();
    final complaintOwnerId = complaintData?['userId'] ?? '';

    if (!doc.exists) {
      // Add upvote
      await ref.set({
        'userId': userId,
        'upvotedAt': DateTime.now().toIso8601String(),
      });
      await _fire.collection('complaints').doc(id).update({
        'upvotes': FieldValue.increment(1),
      });

      // Automatic notification for upvote
      if (complaintOwnerId != '' && complaintOwnerId != userId) {
        final message =
            'Someone upvoted your complaint "${complaintData?['category'] ?? 'Unknown'}".';
        await _fire
            .collection('notifications')
            .add({
              'userId': complaintOwnerId,
              'complaintId': id,
              'type': 'upvote',
              'message': message,
              'createdAt': DateTime.now().toIso8601String(),
              'read': false,
            })
            .then((docRef) {
              print('Upvote notification created: ${docRef.id}');
            })
            .catchError((error) {
              print('Failed to create upvote notification: $error');
            });
      }
    } else {
      // Remove upvote
      await ref.delete();
      await _fire.collection('complaints').doc(id).update({
        'upvotes': FieldValue.increment(-1),
      });
    }
  }

  // Stream notifications with docId for real-time updates
  Stream<List<Map<String, dynamic>>> getNotifications() {
    final uid = currentUserId;
    if (uid == null) return const Stream.empty();

    return _fire
        .collection('notifications')
        .where('userId', isEqualTo: uid)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map(
          (snap) => snap.docs.map((d) {
            final data = d.data();
            data['docId'] = d.id; // include docId for marking read
            return data;
          }).toList(),
        );
  }

  // Mark notification as read using docId
  Future<void> markNotificationRead(String notificationId) async {
    await _fire.collection('notifications').doc(notificationId).update({
      'read': true,
    });
  }

  // Current user ID
  String? get currentUserId => _auth.currentUser?.uid;
}
