// lib/widgets/upvote_button.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/complaint_provider.dart';
import '../models/complaint.dart';

class UpvoteButton extends StatefulWidget {
  final String complaintId;

  const UpvoteButton({super.key, required this.complaintId});

  @override
  State<UpvoteButton> createState() => _UpvoteButtonState();
}

class _UpvoteButtonState extends State<UpvoteButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    _setupAnimations();
  }

  void _setupAnimations() {
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    ));

    _rotationAnimation = Tween<double>(
      begin: 0.0,
      end: 0.1,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _toggleUpvote() async {
    HapticFeedback.lightImpact();

    // Trigger animation
    _animationController.forward().then((_) {
      _animationController.reverse();
    });

    // Delegate to ComplaintProvider — optimistic update handled there
    await context.read<ComplaintProvider>().toggleUpvote(widget.complaintId);
  }

  @override
  Widget build(BuildContext context) {
    // Read the current upvote state from the provider's complaints list
    final provider = context.watch<ComplaintProvider>();
    final Complaint? complaint = provider.allComplaints
        .cast<Complaint?>()
        .firstWhere(
          (c) => c?.id == widget.complaintId,
          orElse: () => null,
        );

    // Also check myComplaints in case user is on the status screen
    final Complaint? myComplaint = complaint ??
        provider.myComplaints
            .cast<Complaint?>()
            .firstWhere(
              (c) => c?.id == widget.complaintId,
              orElse: () => null,
            );

    final bool isUpvoted = myComplaint?.hasUpvoted ?? false;

    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Transform.rotate(
            angle: _rotationAnimation.value,
            child: GestureDetector(
              onTap: _toggleUpvote,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isUpvoted
                      ? Theme.of(context).colorScheme.primary
                      : Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isUpvoted
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).dividerColor.withOpacity(0.1),
                    width: 1,
                  ),
                  boxShadow: isUpvoted
                      ? [
                          BoxShadow(
                            color: Theme.of(context)
                                .colorScheme
                                .primary
                                .withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Icon(
                  isUpvoted ? Icons.thumb_up : Icons.thumb_up_outlined,
                  color: isUpvoted ? Theme.of(context).colorScheme.onPrimary : Theme.of(context).colorScheme.onSurfaceVariant,
                  size: 16,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

