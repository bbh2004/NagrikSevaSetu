// lib/screens/map_screen.dart
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../providers/complaint_provider.dart';
import '../widgets/upvote_button.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  @override
  void initState() {
    super.initState();
    // Reload complaints if not already loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ComplaintProvider>();
      if (provider.allComplaints.isEmpty) {
        provider.loadAllComplaints();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Complaints Map')),
      body: Consumer<ComplaintProvider>(
        builder: (context, provider, _) {
          if (provider.isLoadingAll) {
            return const Center(child: CircularProgressIndicator());
          }

          final complaints = provider.allComplaints;
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
            initialCameraPosition: const CameraPosition(
                target: LatLng(23.3441, 85.3096), zoom: 13),
            markers: markers,
          );
        },
      ),
    );
  }
}
