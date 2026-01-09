import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/firebase_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class UpvoteButton extends StatefulWidget {
  final String complaintId;
  const UpvoteButton({super.key, required this.complaintId});

  @override
  State<UpvoteButton> createState() => _UpvoteButtonState();
}

class _UpvoteButtonState extends State<UpvoteButton>
    with SingleTickerProviderStateMixin {
  bool _loading = false;
  bool _isUpvoted = false;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _checkIfUpvoted();
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

  Future<void> _checkIfUpvoted() async {
    final userId = FirebaseService().currentUserId;
    if (userId == null) return;
    final ref = FirebaseFirestore.instance
        .collection("complaints")
        .doc(widget.complaintId)
        .collection("upvotes")
        .doc(userId);

    final doc = await ref.get();
    if (mounted) setState(() => _isUpvoted = doc.exists);
  }

  Future<void> _toggleUpvote() async {
    if (_loading) return;
    
    setState(() => _loading = true);
    HapticFeedback.lightImpact();
    
    // Trigger animation
    _animationController.forward().then((_) {
      _animationController.reverse();
    });
    
    final userId = FirebaseService().currentUserId;
    if (userId != null) {
      await FirebaseService().toggleUpvote(widget.complaintId, userId);
      await _checkIfUpvoted(); // refresh state
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Transform.rotate(
            angle: _rotationAnimation.value,
            child: GestureDetector(
              onTap: _loading ? null : _toggleUpvote,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _isUpvoted 
                      ? Theme.of(context).colorScheme.primary
                      : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _isUpvoted 
                        ? Theme.of(context).colorScheme.primary
                        : Colors.grey.shade300,
                    width: 1,
                  ),
                  boxShadow: _isUpvoted ? [
                    BoxShadow(
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ] : null,
                ),
                child: _loading
                    ? SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            _isUpvoted ? Colors.white : Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      )
                    : Icon(
                        _isUpvoted ? Icons.thumb_up : Icons.thumb_up_outlined,
                        color: _isUpvoted 
                            ? Colors.white 
                            : Colors.grey.shade600,
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
