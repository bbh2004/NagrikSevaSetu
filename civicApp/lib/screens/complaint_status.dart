// lib/screens/complaint_status.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/complaint_provider.dart';
import '../widgets/complaint_card.dart';

class ComplaintStatusScreen extends StatefulWidget {
  const ComplaintStatusScreen({super.key});

  @override
  State<ComplaintStatusScreen> createState() => _ComplaintStatusScreenState();
}

class _ComplaintStatusScreenState extends State<ComplaintStatusScreen> {
  @override
  void initState() {
    super.initState();
    // Load user's own complaints when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ComplaintProvider>().loadMyComplaints();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Complaints')),
      body: Consumer<ComplaintProvider>(
        builder: (context, provider, _) {
          if (provider.isLoadingMine) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    provider.errorMessage!,
                    style: Theme.of(context)
                        .textTheme
                        .bodyLarge
                        ?.copyWith(color: Colors.red.shade600),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => provider.loadMyComplaints(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final complaints = provider.myComplaints;
          if (complaints.isEmpty) {
            return const Center(child: Text('No complaints yet'));
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadMyComplaints(),
            child: ListView(
              children: complaints
                  .map((c) => ComplaintCard(complaint: c))
                  .toList(),
            ),
          );
        },
      ),
    );
  }
}
