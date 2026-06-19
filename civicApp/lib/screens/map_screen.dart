// lib/screens/map_screen.dart
// ─────────────────────────────────────────────────────────────
// Map Screen — Shows all civic complaints as Google Maps markers
//
// Change 3 (Phase 2.3):
//   - Default center changed from Ranchi to Bangalore (12.9716, 77.5946).
//   - After complaints load, the map auto-pans to the geographic centroid
//     of all loaded complaints. This means a user in Gujarat sees their
//     state's complaints centered on screen, not Bangalore.
//   - Falls back to Bangalore when no complaints are loaded yet.
// ─────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../providers/complaint_provider.dart';
import '../widgets/upvote_button.dart';

// ── Bangalore city center — default starting position
const _kBangaloreLatLng = LatLng(12.9716, 77.5946);
const _kDefaultZoom = 12.0; // City-wide view

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  GoogleMapController? _mapController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ComplaintProvider>();
      if (provider.allComplaints.isEmpty) {
        provider.loadAllComplaints().then((_) => _panToCentroid());
      } else {
        _panToCentroid();
      }
    });
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  /// Computes the geographic centroid of all loaded complaints and pans there.
  ///
  /// If there are no complaints, the map stays at the Bangalore default.
  /// This ensures officers/citizens in any Indian state see their region
  /// without having to manually scroll.
  void _panToCentroid() {
    if (_mapController == null) return;
    final complaints = context.read<ComplaintProvider>().allComplaints;
    if (complaints.isEmpty) return;

    // Filter out any complaints with zero coordinates (data issue safety)
    final valid = complaints.where((c) => c.lat != 0 || c.lng != 0).toList();
    if (valid.isEmpty) return;

    final avgLat = valid.map((c) => c.lat).reduce((a, b) => a + b) / valid.length;
    final avgLng = valid.map((c) => c.lng).reduce((a, b) => a + b) / valid.length;

    _mapController!.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(
          target: LatLng(avgLat, avgLng),
          zoom: _kDefaultZoom,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Complaints Map'),
        centerTitle: true,
        actions: [
          // Re-center button
          IconButton(
            icon: const Icon(Icons.my_location),
            tooltip: 'Re-center to complaints',
            onPressed: _panToCentroid,
          ),
        ],
      ),
      body: Consumer<ComplaintProvider>(
        builder: (context, provider, _) {
          if (provider.isLoadingAll) {
            return const Center(child: CircularProgressIndicator());
          }

          final complaints = provider.allComplaints;

          // Build map markers from complaints
          final markers = complaints.map((c) {
            return Marker(
              markerId: MarkerId(c.id),
              position: LatLng(c.lat, c.lng),
              // Color-code by urgency: red = high, orange = medium, green = low
              icon: c.urgency == 'High'
                  ? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed)
                  : c.urgency == 'Medium'
                      ? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange)
                      : BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
              infoWindow: InfoWindow(
                title: '${c.category} — ${c.urgency}',
                snippet: c.description.length > 80
                    ? '${c.description.substring(0, 77)}...'
                    : c.description,
                onTap: () {
                  showDialog(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: Text(c.category),
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(c.description),
                          const SizedBox(height: 8),
                          Text(
                            'Urgency: ${c.urgency}  •  Status: ${c.status}',
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
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
              target: _kBangaloreLatLng,
              zoom: _kDefaultZoom,
            ),
            markers: markers,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: true,
            onMapCreated: (controller) {
              _mapController = controller;
              // If complaints are already loaded, pan now
              if (complaints.isNotEmpty) {
                _panToCentroid();
              }
            },
          );
        },
      ),
    );
  }
}
