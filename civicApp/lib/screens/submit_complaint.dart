// lib/screens/submit_complaint.dart
// ─────────────────────────────────────────────────────────────
// Submit Complaint Screen (Phase 2.3 — Voice Note Support)
//
// What's new in Phase 2.3:
//   - A voice note recorder section below the image picker.
//   - Citizens can record a voice note (up to 2 minutes) instead
//     of (or in addition to) typing a long description.
//   - The recorded audio is uploaded to Cloudinary via the backend
//     signed-upload pipeline, then the secure URL is attached to
//     the complaint submission payload.
//   - On the backend, Groq Whisper transcribes the audio and the
//     transcript is used (combined with the text description) for
//     more accurate AI urgency classification.
//
// Screen flow:
//   1. User fills description + optionally captures an image.
//   2. User taps "Start Recording" → microphone opens.
//   3. Waveform/timer shows recording progress.
//   4. User taps "Stop Recording" → audio saved locally.
//   5. On submit: image uploaded first (if any), then audio,
//      then complaint POST to backend.
//   6. Success → pop back to home screen.
// ─────────────────────────────────────────────────────────────

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/complaint_provider.dart';
import '../services/location_service.dart';
import '../services/voice_note_service.dart';

class SubmitComplaintScreen extends StatefulWidget {
  final String initialCategory;
  final File? recoveredImage;
  final String? recoveredDesc;

  const SubmitComplaintScreen({
    super.key, 
    required this.initialCategory,
    this.recoveredImage,
    this.recoveredDesc,
  });

  @override
  State<SubmitComplaintScreen> createState() => _SubmitComplaintScreenState();
}

class _SubmitComplaintScreenState extends State<SubmitComplaintScreen>
    with SingleTickerProviderStateMixin {
  // ── Form state ────────────────────────────────────────────────
  final _descController = TextEditingController();
  final LocationService _locationService = LocationService();
  File? _imageFile;

  // ── Voice note state (Phase 2.3) ─────────────────────────────
  final VoiceNoteService _voiceService = VoiceNoteService();
  File? _recordedAudioFile;
  bool _isRecording = false;
  bool _isUploadingAudio = false;
  Duration _recordingDuration = Duration.zero;

  // Timer for showing recording duration on screen
  late AnimationController _recordingPulseController;

  // Max recording duration — prevents huge files
  static const Duration _maxRecordingDuration = Duration(minutes: 2);

  @override
  void initState() {
    super.initState();
    _recordingPulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )..repeat(reverse: true);

    if (widget.recoveredDesc != null) {
      _descController.text = widget.recoveredDesc!;
    }
    if (widget.recoveredImage != null) {
      _imageFile = widget.recoveredImage;
    }

    _descController.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _descController.dispose();
    _voiceService.dispose();
    _recordingPulseController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final source = await showDialog<ImageSource>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Choose Photo Source'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Camera'),
              subtitle: const Text('May restart app on some devices'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Gallery'),
              subtitle: const Text('More stable, recommended'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    if (source == ImageSource.camera) {
      // Option 2: Save state before opening camera to recover it if OS kills app
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('pending_complaint', true);
        await prefs.setString('pending_category', widget.initialCategory);
        await prefs.setString('pending_desc', _descController.text);
      } catch (e) {
        debugPrint('Failed to save state: $e');
      }
    }

    final picker = ImagePicker();
    try {
      final picked = await picker.pickImage(
        source: source,
        imageQuality: 70, // Slightly reduced to save memory
        maxWidth: 1200,   // Prevent 48MP raw images from crashing the app
        maxHeight: 1200,
      );
      if (picked != null && mounted) {
        setState(() => _imageFile = File(picked.path));
      }
    } catch (e) {
      debugPrint("Image picker error: $e");
      if (mounted) {
        _showSnack("Could not capture image. Try again.", isError: true);
      }
    }
  }

  // ── Voice recording handling (Phase 2.3) ──────────────────
  Future<void> _toggleRecording() async {
    if (_isRecording) {
      // STOP recording
      setState(() => _isRecording = false);
      _recordingPulseController.stop();

      final audioFile = await _voiceService.stopRecording();
      if (audioFile != null && mounted) {
        setState(() => _recordedAudioFile = audioFile);
        _showSnack('Voice note recorded successfully ✅', isError: false);
      } else {
        _showSnack('Recording failed — please try again', isError: true);
      }
    } else {
      // START recording
      // Enforce max duration — stop automatically after 2 minutes
      if (_recordedAudioFile != null) {
        // Ask user if they want to re-record
        final confirmed = await _showReplaceRecordingDialog();
        if (!confirmed || !mounted) return;
        await _voiceService.deleteLocalFile(_recordedAudioFile!);
        setState(() => _recordedAudioFile = null);
      }

      final started = await _voiceService.startRecording();
      if (!mounted) return;
      if (!started) {
        _showSnack(
          'Microphone permission denied. Please allow access in Settings.',
          isError: true,
        );
        return;
      }

      setState(() {
        _isRecording = true;
        _recordingDuration = Duration.zero;
      });
      _recordingPulseController.repeat(reverse: true);

      // Auto-stop after max duration using a Stopwatch + periodic check
      _startDurationTracker();
    }
  }

  void _startDurationTracker() {
    final stopwatch = Stopwatch()..start();
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted || !_isRecording) return false;

      setState(() => _recordingDuration = stopwatch.elapsed);

      if (stopwatch.elapsed >= _maxRecordingDuration) {
        // Auto-stop when max duration reached
        _showSnack('Max recording time (2 min) reached. Recording stopped.');
        await _toggleRecording();
        return false;
      }
      return _isRecording; // continue looping while still recording
    });
  }

  Future<void> _clearRecording() async {
    if (_recordedAudioFile != null) {
      await _voiceService.deleteLocalFile(_recordedAudioFile!);
    }
    setState(() {
      _recordedAudioFile = null;
      _recordingDuration = Duration.zero;
    });
  }

  Future<bool> _showReplaceRecordingDialog() async {
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Replace Recording?'),
            content: const Text(
              'You already have a voice note recorded. '
              'Do you want to discard it and record a new one?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text(
                  'Replace',
                  style: TextStyle(color: Colors.red),
                ),
              ),
            ],
          ),
        ) ??
        false;
  }

  // ── Form submission ────────────────────────────────────────
  Future<void> _submit() async {
    final descriptionText = _descController.text.trim();
    final hasVoiceNote = _recordedAudioFile != null;
    final hasText = descriptionText.isNotEmpty;

    if (_imageFile == null) {
      _showSnack('Please capture a photo. A photo is compulsory.');
      return;
    }

    // Strict XOR: User must provide text OR voice, not both.
    if (!hasVoiceNote && (!hasText || descriptionText.length < 10)) {
      _showSnack(
        'Please either write a description (min 10 characters) or record a voice note.',
      );
      return;
    }

    if (hasVoiceNote && hasText) {
      _showSnack(
        'Please provide EITHER a text description OR a voice note, not both. Clear the text or delete the voice note.',
      );
      return;
    }

    // Can't submit while still recording
    if (_isRecording) {
      _showSnack('Please stop the recording before submitting.');
      return;
    }


    try {
      // Cache provider reference BEFORE any await to avoid BuildContext
      // across async gap lint warning (use_build_context_synchronously).
      final provider = context.read<ComplaintProvider>();

      final position = await _locationService.getCurrentLocation();
      if (!mounted) return;

      String? voiceNoteUrl;

      // Step 1: Upload voice note to Cloudinary (if recorded)
      if (_recordedAudioFile != null) {
        setState(() => _isUploadingAudio = true);

        try {
          voiceNoteUrl = await provider.uploadVoiceNote(_recordedAudioFile!);

          // Clean up local file after successful upload
          await _voiceService.deleteLocalFile(_recordedAudioFile!);
          if (mounted) setState(() => _recordedAudioFile = null);
        } catch (uploadError) {
          if (!mounted) return;
          setState(() => _isUploadingAudio = false);
          // Don't block submission — just skip the voice note
          debugPrint('[SubmitComplaint] Voice upload failed: $uploadError');
          final proceed = await _showVoiceUploadFailureDialog();
          if (!proceed || !mounted) return;
          voiceNoteUrl = null; // Submit without voice note
        } finally {
          if (mounted) setState(() => _isUploadingAudio = false);
        }
      }

      // Step 2: Submit complaint (image upload happens inside the provider)
      final error = await provider.submitComplaint(
            category: widget.initialCategory,
            description: descriptionText,
            lat: position.latitude,
            lng: position.longitude,
            imageFile: _imageFile,
            voiceNoteUrl: voiceNoteUrl,
          );

      if (!mounted) return;

      if (error != null) {
        _showSnack('Submit failed: $error', isError: true);
      } else {
        _showSnack(
          voiceNoteUrl != null
              ? 'Complaint submitted with voice note ✅ AI will transcribe it shortly'
              : 'Complaint submitted successfully ✅',
          isError: false,
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (!mounted) return;
      _showSnack('Could not get location: $e', isError: true);
    }
  }

  Future<bool> _showVoiceUploadFailureDialog() async {
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Voice Upload Failed'),
            content: const Text(
              'Your voice note could not be uploaded. '
              'Would you like to submit the complaint without it?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Submit Without Voice Note'),
              ),
            ],
          ),
        ) ??
        false;
  }

  void _showSnack(String message, {bool isError = true}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red.shade700 : Colors.green.shade700,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final isSubmitting = context.watch<ComplaintProvider>().isSubmitting;
    final isBusy = isSubmitting || _isUploadingAudio;
    final bool hasVoice = _recordedAudioFile != null;
    final bool hasText = _descController.text.trim().isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Submit Complaint'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Department label
            _buildSectionLabel('Department'),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.category_outlined, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    widget.initialCategory,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Description field — disabled if voice note exists
            _buildSectionLabel(
              hasVoice
                  ? 'Description (Disabled — using voice note)'
                  : 'Description *',
            ),
            TextField(
              controller: _descController,
              enabled: !hasVoice,
              maxLength: 1000,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: hasVoice
                    ? 'Clear your voice note to type a description'
                    : 'Describe the issue in detail — or record a voice note instead',
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),

            // ── Voice Note Section (Phase 2.3) ─────────────────
            _buildSectionLabel('Voice Note * (Or provide a text description)'),
            _buildVoiceNoteSection(),
            const SizedBox(height: 20),

            // ── Photo Section ──────────────────────────────────
            _buildSectionLabel('Photo * (Compulsory)'),
            _buildImageSection(),
            const SizedBox(height: 32),

            // Submit button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: isBusy ? null : _submit,
                icon: isBusy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send_rounded),
                label: Text(
                  _isUploadingAudio
                      ? 'Uploading voice note...'
                      : isSubmitting
                          ? 'Submitting...'
                          : 'Submit Complaint',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    );
  }

  Widget _buildImageSection() {
    return Column(
      children: [
        if (_imageFile != null) ...[
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.file(_imageFile!, height: 180, width: double.infinity, fit: BoxFit.cover),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickImage,
                  icon: const Icon(Icons.cameraswitch),
                  label: const Text('Retake'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => setState(() => _imageFile = null),
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  label: const Text('Remove', style: TextStyle(color: Colors.red)),
                ),
              ),
            ],
          ),
        ] else
          OutlinedButton.icon(
            onPressed: _pickImage,
            icon: const Icon(Icons.camera_alt_outlined),
            label: const Text('Capture Photo'),
          ),
      ],
    );
  }

  Widget _buildVoiceNoteSection() {
    final bool hasText = _descController.text.trim().isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(
          color: _isRecording
              ? Colors.red
              : Theme.of(context).colorScheme.outline,
        ),
        borderRadius: BorderRadius.circular(12),
        color: _isRecording
            ? Colors.red.withValues(alpha: 0.04)
            : null,
      ),
      child: Column(
        children: [
          // Status row
          Row(
            children: [
              // Animated record icon
              AnimatedBuilder(
                animation: _recordingPulseController,
                builder: (context, child) {
                  return Icon(
                    _isRecording ? Icons.mic : Icons.mic_none,
                    color: _isRecording
                        ? Colors.red.withValues(alpha: 0.4 + 0.6 * _recordingPulseController.value)
                        : Theme.of(context).colorScheme.primary,
                    size: 28,
                  );
                },
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _isRecording
                          ? 'Recording...'
                          : _recordedAudioFile != null
                              ? 'Voice note recorded'
                              : 'No voice note',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: _isRecording ? Colors.red : null,
                      ),
                    ),
                    if (_isRecording)
                      Text(
                        _formatDuration(_recordingDuration),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.red.shade700,
                        ),
                      )
                    else if (_recordedAudioFile != null)
                      const Text(
                        'Will be transcribed by AI on submission',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      )
                    else
                      const Text(
                        'Tap to record (max 2 min)',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                  ],
                ),
              ),

              // Clear button (only when recording done)
              if (_recordedAudioFile != null && !_isRecording)
                IconButton(
                  onPressed: _clearRecording,
                  icon: const Icon(Icons.close, color: Colors.red),
                  tooltip: 'Delete recording',
                ),
            ],
          ),

          const SizedBox(height: 12),

          // Record/Stop button
          SizedBox(
            width: double.infinity,
            child: _isRecording
                ? ElevatedButton.icon(
                    onPressed: _toggleRecording,
                    icon: const Icon(Icons.stop_circle_outlined),
                    label: const Text('Stop Recording'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                    ),
                  )
                : OutlinedButton.icon(
                    onPressed: hasText ? null : _toggleRecording,
                    icon: const Icon(Icons.mic),
                    label: Text(
                      hasText 
                          ? 'Clear text to record voice'
                          : _recordedAudioFile != null
                              ? 'Re-record Voice Note'
                              : 'Start Recording',
                    ),
                  ),
          ),

          // Hint text about voice note benefit
          if (!_isRecording && _recordedAudioFile == null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Voice notes are transcribed by AI to improve urgency detection',
                style: TextStyle(
                  fontSize: 11,
                  color: Theme.of(context).colorScheme.outline,
                ),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }

  String _formatDuration(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s / 02:00';
  }
}