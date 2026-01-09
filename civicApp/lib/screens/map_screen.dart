import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../services/firebase_service.dart';
import '../models/complaint.dart';
import '../widgets/upvote_button.dart';

class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final firebaseService = FirebaseService();

    return Scaffold(
      appBar: AppBar(title: const Text("Complaints Map")),
      body: StreamBuilder<List<Complaint>>(
        stream: firebaseService.getComplaints(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final complaints = snapshot.data!;
          final markers = complaints.map((c) {
            return Marker(
              markerId: MarkerId(c.id),
              position: LatLng(c.lat, c.lng),
              infoWindow: InfoWindow(
                title: c.category,
                snippet: c.description,
                onTap: () {
                  showDialog(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: Text(c.category),
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(c.description),
                          UpvoteButton(complaintId: c.id),
                        ],
                      ),
                    ),
                  );
                },
              ),
            );
          }).toSet();

          return GoogleMap(
            initialCameraPosition: const CameraPosition(target: LatLng(12.9716, 77.5946), zoom: 12),
            markers: markers,
          );
        },
      ),
    );
  }
}
