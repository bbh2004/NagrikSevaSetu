// lib/services/voice_note_service.dart
// ─────────────────────────────────────────────────────────────
// VoiceNoteService — Audio Recording & Cloudinary Upload (Phase 2.3)
//
// Responsibilities:
//   1. Start / stop audio recording via the 'record' package.
//   2. Manage the lifecycle of the recorder (permissions, path, cleanup).
//   3. Upload the recorded audio file to Cloudinary using a secure
//      signed upload obtained from the civicBackend.
//
// Architecture:
//   SubmitComplaintScreen
//     → calls VoiceNoteService.startRecording()
//     → calls VoiceNoteService.stopRecording() → returns File
//     → passes File to ComplaintRepository.uploadVoiceNote()
//     → passes returned URL to submitComplaint(voiceNoteUrl: ...)
//
// WHY a separate service (not inside the repository)?
//   Recording is a DEVICE-side concern (microphone hardware, temp files).
//   Uploading is a NETWORK concern (Cloudinary).
//   Keeping them separate follows the single-responsibility principle.
//   The repository handles the Cloudinary upload; the service only records.
//
// PERMISSIONS:
//   Android: Requires RECORD_AUDIO permission in AndroidManifest.xml.
//   iOS:     Requires NSMicrophoneUsageDescription in Info.plist.
//   The 'record' package surfaces these as part of its hasPermission check.
// ─────────────────────────────────────────────────────────────

import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

/// Manages audio recording using the 'record' package.
///
/// Lifecycle:
///   1. Create a single instance per screen (StatefulWidget).
///   2. Call [initialize] once (checks microphone permission).
///   3. Call [startRecording] to begin capturing.
///   4. Call [stopRecording] → get the recorded [File].
///   5. Call [dispose] in the widget's [State.dispose()] method.
class VoiceNoteService {
  // Internal AudioRecorder instance from the 'record' package.
  final AudioRecorder _recorder = AudioRecorder();

  // Tracks whether a recording is currently active.
  bool _isRecording = false;

  // Path of the last completed recording.
  String? _lastRecordingPath;

  bool get isRecording => _isRecording;
  String? get lastRecordingPath => _lastRecordingPath;

  // ── Initialization ─────────────────────────────────────────

  /// Checks whether the app has microphone permission.
  ///
  /// Returns `true` if permission is granted, `false` if denied.
  /// On Android/iOS, the OS will show the permission dialog the
  /// first time this is called (handled internally by the plugin).
  Future<bool> hasPermission() async {
    try {
      return await _recorder.hasPermission();
    } catch (e) {
      debugPrint('[VoiceNoteService] Permission check failed: $e');
      return false;
    }
  }

  // ── Recording Control ──────────────────────────────────────

  /// Starts a new audio recording.
  ///
  /// Saves the file to the system's temp directory with an m4a extension.
  /// m4a (AAC) is natively supported on both Android and iOS with smaller
  /// file sizes than wav/mp3 and is fully supported by Cloudinary and Groq.
  ///
  /// Returns `true` on success, `false` on failure (permission denied, etc).
  Future<bool> startRecording() async {
    try {
      // Ensure no recording is already active
      if (_isRecording) {
        debugPrint('[VoiceNoteService] Already recording. Stop first.');
        return false;
      }

      // Check microphone permission before attempting to record
      final permitted = await hasPermission();
      if (!permitted) {
        debugPrint('[VoiceNoteService] Microphone permission denied.');
        return false;
      }

      // Build a unique file path in the temp directory
      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final path = '${tempDir.path}/voice_note_$timestamp.m4a';

      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,   // AAC-LC: excellent quality/size ratio
          bitRate: 128000,               // 128 kbps — good quality for voice
          sampleRate: 44100,             // CD-quality sample rate
          numChannels: 1,                // Mono — sufficient for voice
        ),
        path: path,
      );

      _isRecording = true;
      _lastRecordingPath = path;
      debugPrint('[VoiceNoteService] Recording started → $path');
      return true;
    } catch (e) {
      debugPrint('[VoiceNoteService] Failed to start recording: $e');
      _isRecording = false;
      return false;
    }
  }

  /// Stops the current recording and returns the audio [File].
  ///
  /// Returns `null` if no recording is active or if the stop fails.
  /// The caller is responsible for deleting the file after upload.
  Future<File?> stopRecording() async {
    try {
      if (!_isRecording) {
        debugPrint('[VoiceNoteService] No active recording to stop.');
        return null;
      }

      final path = await _recorder.stop();
      _isRecording = false;

      if (path == null) {
        debugPrint('[VoiceNoteService] Recorder returned null path.');
        return null;
      }

      final file = File(path);
      final exists = await file.exists();
      if (!exists) {
        debugPrint('[VoiceNoteService] Recording file not found at $path');
        return null;
      }

      final fileSizeBytes = await file.length();
      debugPrint(
        '[VoiceNoteService] Recording stopped. '
        'File: $path (${(fileSizeBytes / 1024).toStringAsFixed(1)} KB)',
      );

      return file;
    } catch (e) {
      debugPrint('[VoiceNoteService] Failed to stop recording: $e');
      _isRecording = false;
      return null;
    }
  }

  /// Cancels the current recording and discards any data.
  /// Use when the user dismisses the recording without wanting to keep it.
  Future<void> cancelRecording() async {
    try {
      if (_isRecording) {
        await _recorder.cancel();
        _isRecording = false;
        debugPrint('[VoiceNoteService] Recording cancelled.');
      }
    } catch (e) {
      debugPrint('[VoiceNoteService] Failed to cancel recording: $e');
    }
  }

  /// Deletes a local recording file after a successful upload.
  ///
  /// Silently ignores errors (e.g., file already deleted).
  Future<void> deleteLocalFile(File file) async {
    try {
      if (await file.exists()) {
        await file.delete();
        debugPrint('[VoiceNoteService] Deleted local file: ${file.path}');
      }
    } catch (e) {
      debugPrint('[VoiceNoteService] Could not delete local file: $e');
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────

  /// Must be called in [State.dispose()] to release microphone resources.
  Future<void> dispose() async {
    try {
      if (_isRecording) {
        await _recorder.cancel();
      }
      await _recorder.dispose();
      debugPrint('[VoiceNoteService] Disposed.');
    } catch (e) {
      debugPrint('[VoiceNoteService] Error during dispose: $e');
    }
  }
}
