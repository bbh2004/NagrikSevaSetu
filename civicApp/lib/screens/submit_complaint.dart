// lib/screens/submit_complaint.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../providers/complaint_provider.dart';
import '../services/location_service.dart';

class SubmitComplaintScreen extends StatefulWidget {
  final String initialCategory;
  const SubmitComplaintScreen({super.key, required this.initialCategory});

  @override
  State<SubmitComplaintScreen> createState() => _SubmitComplaintScreenState();
}

class _SubmitComplaintScreenState extends State<SubmitComplaintScreen> {
  final _descController = TextEditingController();
  final LocationService _locationService = LocationService();
  File? _image;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked =
        await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    if (picked != null) setState(() => _image = File(picked.path));
  }

  Future<void> _submit() async {
    if (_descController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a description')),
      );
      return;
    }

    try {
      // Get current location
      final position = await _locationService.getCurrentLocation();

      // Delegate to ComplaintProvider — no HTTP logic in the screen
      final error = await context.read<ComplaintProvider>().submitComplaint(
            category: widget.initialCategory,
            description: _descController.text.trim(),
            lat: position.latitude,
            lng: position.longitude,
            imageFile: _image,
          );

      if (!mounted) return;

      if (error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submit failed: $error')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Complaint submitted successfully')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not get location: $e')),
      );
    }
  }

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Watch isSubmitting from the provider for loading state
    final isSubmitting = context.watch<ComplaintProvider>().isSubmitting;

    return Scaffold(
      appBar: AppBar(title: const Text('Submit Complaint')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Department: ${widget.initialCategory}',
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
                onPressed: isSubmitting ? null : _submit,
                child: isSubmitting
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