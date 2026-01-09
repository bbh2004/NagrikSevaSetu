import 'package:flutter/material.dart';
import '../services/firebase_service.dart';
import '../models/complaint.dart';
import '../widgets/complaint_card.dart';

class ComplaintStatusScreen extends StatelessWidget {
  const ComplaintStatusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final firebaseService = FirebaseService();
    final userId = firebaseService.currentUserId;

    return Scaffold(
      appBar: AppBar(title: const Text("My Complaints")),
      body: StreamBuilder<List<Complaint>>(
        stream: firebaseService.getComplaints(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final complaints = snapshot.data!.where((c) => c.userId == userId).toList();
          if (complaints.isEmpty) return const Center(child: Text("No complaints yet"));
          return ListView(children: complaints.map((c) => ComplaintCard(complaint: c)).toList());
        },
      ),
    );
  }
}
