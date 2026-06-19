// lib/providers/complaint_provider.dart
// ─────────────────────────────────────────────────────────────
// ComplaintProvider — Manages All Complaint State
//
// This replaces the old pattern of calling FirebaseService directly
// inside widgets and passing a FirebaseService instance via build().
//
// Responsibilities:
//   - Holds the list of all complaints
//   - Holds the list of current user's complaints
//   - Tracks loading/error state for UI feedback
//   - Exposes actions: loadComplaints, submitComplaint, toggleUpvote
//
// Key architectural benefit:
//   Screens only call provider methods.
//   Provider calls repository methods.
//   Repository calls ApiClient.
//   ApiClient calls the backend.
//   No screen ever touches Dio or HTTP directly.
// ─────────────────────────────────────────────────────────────

import 'dart:io';
import 'package:flutter/foundation.dart';
import '../repositories/complaint_repository.dart';
import '../models/complaint.dart';
import '../core/errors/app_exception.dart';

class ComplaintProvider extends ChangeNotifier {
  final ComplaintRepository _repository;

  // ── State ─────────────────────────────────────────────────────
  List<Complaint> _allComplaints = [];
  List<Complaint> _myComplaints = [];
  bool _isLoadingAll = false;
  bool _isLoadingMine = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  ComplaintProvider({required ComplaintRepository repository})
      : _repository = repository;

  // ── Getters ───────────────────────────────────────────────────
  List<Complaint> get allComplaints => List.unmodifiable(_allComplaints);
  List<Complaint> get myComplaints => List.unmodifiable(_myComplaints);
  bool get isLoadingAll => _isLoadingAll;
  bool get isLoadingMine => _isLoadingMine;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;

  // ── Actions ───────────────────────────────────────────────────

  /// Fetches all public complaints from the backend.
  /// Called when the HomeScreen is first loaded or refreshed.
  Future<void> loadAllComplaints({
    String? category,
    String? status,
  }) async {
    _isLoadingAll = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _allComplaints = await _repository.getAllComplaints(
        category: category,
        status: status,
      );
    } on AppException catch (e) {
      _errorMessage = e.message;
      debugPrint('[ComplaintProvider] loadAllComplaints error: ${e.message}');
    } catch (e) {
      _errorMessage = 'Failed to load complaints.';
      debugPrint('[ComplaintProvider] Unexpected error: $e');
    } finally {
      _isLoadingAll = false;
      notifyListeners();
    }
  }

  /// Fetches only the current user's complaints.
  /// Called when ComplaintStatusScreen is opened.
  Future<void> loadMyComplaints() async {
    _isLoadingMine = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _myComplaints = await _repository.getMyComplaints();
    } on AppException catch (e) {
      _errorMessage = e.message;
    } catch (e) {
      _errorMessage = 'Failed to load your complaints.';
    } finally {
      _isLoadingMine = false;
      notifyListeners();
    }
  }

  /// Submits a new complaint. Returns null on success, error string on failure.
  Future<String?> submitComplaint({
    required String category,
    required String description,
    required double lat,
    required double lng,
    File? imageFile,
    String? voiceNoteUrl,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final newComplaint = await _repository.createComplaint(
        category: category,
        description: description,
        lat: lat,
        lng: lng,
        imageFile: imageFile,
        voiceNoteUrl: voiceNoteUrl,
      );

      // Optimistically insert the new complaint at the top of the list
      _allComplaints = [newComplaint, ..._allComplaints];
      _myComplaints = [newComplaint, ..._myComplaints];
      return null; // Success
    } on AppException catch (e) {
      _errorMessage = e.message;
      return e.message;
    } catch (e) {
      const msg = 'Failed to submit complaint.';
      _errorMessage = msg;
      return msg;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  /// Toggles upvote on a complaint. Updates state optimistically.
  ///
  /// Optimistic update: we immediately flip the UI state, then
  /// confirm with the backend. If the backend call fails, we roll back.
  Future<void> toggleUpvote(String complaintId) async {
    // 1. Find and immediately update the complaint in local state (optimistic)
    final idx = _allComplaints.indexWhere((c) => c.id == complaintId);
    if (idx == -1) return;

    final original = _allComplaints[idx];
    final optimistic = original.copyWith(
      upvotes: original.hasUpvoted
          ? original.upvotes - 1
          : original.upvotes + 1,
      hasUpvoted: !original.hasUpvoted,
    );

    _allComplaints = List.from(_allComplaints)..[idx] = optimistic;
    notifyListeners();

    // 2. Confirm with the backend
    try {
      final result = await _repository.toggleUpvote(complaintId);

      // Update with the real count from the backend
      final confirmed = original.copyWith(
        upvotes: result.upvotes,
        hasUpvoted: result.hasUpvoted,
      );
      _allComplaints = List.from(_allComplaints)..[idx] = confirmed;
      notifyListeners();
    } on AppException catch (e) {
      // Roll back on failure
      _allComplaints = List.from(_allComplaints)..[idx] = original;
      _errorMessage = e.message;
      notifyListeners();
    }
  }

  /// Uploads a voice note file to Cloudinary via the backend signed upload.
  ///
  /// Returns the secure Cloudinary URL on success, throws on failure.
  /// The UI layer should show a loading indicator while this runs.
  Future<String> uploadVoiceNote(File audioFile) async {
    // Delegate directly to repository — no local state needed.
    return _repository.uploadVoiceNote(audioFile);
  }

  /// Clears all loaded complaint data (called on sign-out).
  void clearAll() {
    _allComplaints = [];
    _myComplaints = [];
    _errorMessage = null;
    notifyListeners();
  }
}
