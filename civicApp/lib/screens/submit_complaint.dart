import 'dart:io';
import 'package:firebase_auth/firebase_auth.dart'; // It's good practice to import this directly
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/complaint.dart';

// prefix the imports so Dart never confuses the symbols
import '../services/firebase_service.dart' as fb;
import '../services/location_service.dart' as loc;

class SubmitComplaintScreen extends StatefulWidget {
  final String initialCategory;
  const SubmitComplaintScreen({super.key, required this.initialCategory});

  @override
  State<SubmitComplaintScreen> createState() => _SubmitComplaintScreenState();
}

class _SubmitComplaintScreenState extends State<SubmitComplaintScreen> {
  final _descController = TextEditingController();
  File? _image;
  bool _loading = false;

  final fb.FirebaseService _firebaseService = fb.FirebaseService();
  final loc.LocationService _locationService = loc.LocationService();

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked =
    await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    if (picked != null) setState(() => _image = File(picked.path));
  }

  // =======================================================================
  // === THIS IS THE UPDATED FUNCTION WITH THE FIX =========================
  // =======================================================================
  Future<void> _submit() async {
    if (_descController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter a description')));
      return;
    }

    // === FIX START: VALIDATE THE USER IS LOGGED IN ===
    // 1) Get the user ID and ensure it is not null before proceeding.
    final String? currentUserId = _firebaseService.currentUserId;

    if (currentUserId == null) {
      // If user is not logged in or auth state is not ready, show an error and stop.
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not submit: User not signed in.')),
      );
      return; // Stop the function here.
    }
    // === FIX END ===

    setState(() => _loading = true);

    try {
      // 2) Get location
      final position = await _locationService.getCurrentLocation();

      // 3) Upload image (if any)
      String? imageUrl;
      if (_image != null) {
        imageUrl = await _firebaseService.uploadImageToCloudinary(_image!);
      }

      // 4) Build the complaint with the VALIDATED user ID
      final complaint = Complaint(
        id: '',
        userId: currentUserId, // 🔹 Use the validated ID. No more '?? anonymous'
        category: widget.initialCategory,
        description: _descController.text.trim(),
        imageUrl: imageUrl,
        voiceNoteUrl: null,
        status: 'Pending',
        upvotes: 0,
        lat: position.latitude,
        lng: position.longitude,
        createdAt: DateTime.now(),
      );

      // 5) Save to Firestore
      await _firebaseService.addComplaint(complaint);

      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Complaint submitted successfully')));

      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      debugPrint('Submit error: $e');
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Submit failed: $e')));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Submit Complaint')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Department: ${widget.initialCategory}",
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _descController,
              decoration: const InputDecoration(
                  labelText: 'Description', border: OutlineInputBorder()),
              maxLines: 4,
            ),
            const SizedBox(height: 20),
            Center(
              child: _image == null
                  ? const Text('No image selected')
                  : ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.file(_image!, height: 200, fit: BoxFit.cover),
              ),
            ),
            const SizedBox(height: 10),
            Center(
              child: ElevatedButton.icon(
                onPressed: _pickImage,
                icon: const Icon(Icons.camera_alt),
                label: const Text('Capture Photo'),
              ),
            ),
            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Submit Complaint'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}