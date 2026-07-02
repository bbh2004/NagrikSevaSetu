// lib/screens/loginpage.dart
// ─────────────────────────────────────────────────────────────
// Login Page — Google Sign-In Only
//
// Premium landing screen with animated branding and a single
// "Sign in with Google" button. All email/password flows have
// been removed as of the Google Auth migration.
// ─────────────────────────────────────────────────────────────

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class Loginpage extends StatefulWidget {
  const Loginpage({super.key});

  @override
  State<Loginpage> createState() => _LoginpageState();
}

class _LoginpageState extends State<Loginpage> with TickerProviderStateMixin {
  bool _isLoading = false;

  late AnimationController _fadeController;
  late AnimationController _slideController;
  late AnimationController _pulseController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _startAnimations();
  }

  void _setupAnimations() {
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    )..repeat(reverse: true);

    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: Curves.easeOutCubic,
    ));
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.06).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  void _startAnimations() {
    _fadeController.forward();
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) _slideController.forward();
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _signInWithGoogle() async {
    setState(() => _isLoading = true);

    final error = await context.read<AuthProvider>().signInWithGoogle();

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (error != null) {
      Get.snackbar(
        'Sign In Failed',
        error,
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red.shade600,
        colorText: Colors.white,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        duration: const Duration(seconds: 4),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              theme.colorScheme.surface,
              theme.colorScheme.primary.withOpacity(0.04),
              theme.colorScheme.secondary.withOpacity(0.06),
            ],
            stops: const [0.0, 0.5, 1.0],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  children: [
                    const Spacer(flex: 2),

                    // ── Animated Logo ──────────────────────────────
                    AnimatedBuilder(
                      animation: _pulseAnimation,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _pulseAnimation.value,
                          child: child,
                        );
                      },
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              theme.colorScheme.primary,
                              theme.colorScheme.secondary,
                            ],
                          ),
                          borderRadius: BorderRadius.circular(32),
                          boxShadow: [
                            BoxShadow(
                              color: theme.colorScheme.primary.withOpacity(0.35),
                              blurRadius: 40,
                              offset: const Offset(0, 16),
                              spreadRadius: 0,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.location_city_rounded,
                          color: Colors.white,
                          size: 56,
                        ),
                      ),
                    ),
                    const SizedBox(height: 40),

                    // ── App Name ──────────────────────────────────
                    Text(
                      'नागरिक सेवा सेतु',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.displayMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: theme.colorScheme.onSurface,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'NagrikSevaSetu',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 2.0,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: size.width * 0.7,
                      child: Text(
                        'Report civic issues, track resolutions, and build a better community — together.',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          height: 1.6,
                        ),
                      ),
                    ),

                    const Spacer(flex: 2),

                    // ── Feature highlights row ───────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildFeatureChip(Icons.mic_rounded, 'Voice Reports'),
                        _buildFeatureChip(Icons.smart_toy_rounded, 'AI Powered'),
                        _buildFeatureChip(Icons.map_rounded, 'Live Map'),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // ── Google Sign-In Button ─────────────────────
                    _isLoading
                        ? Container(
                            width: double.infinity,
                            height: 58,
                            decoration: BoxDecoration(
                              color: theme.colorScheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.08),
                                  blurRadius: 16,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Center(
                              child: SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                            ),
                          )
                        : Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: _signInWithGoogle,
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                width: double.infinity,
                                height: 58,
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.surfaceContainerHighest,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: theme.dividerColor.withOpacity(0.1),
                                    width: 1.5,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.08),
                                      blurRadius: 16,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    // Google original logo via base64 to avoid missing asset exceptions
                                    Image.memory(
                                      base64Decode('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'),
                                      width: 24,
                                      height: 24,
                                    ),
                                    const SizedBox(width: 14),
                                    Text(
                                      'Sign in with Google',
                                      style: TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w600,
                                        color: theme.colorScheme.onSurface,
                                        letterSpacing: 0.2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),

                    const SizedBox(height: 24),

                    // ── Footer ────────────────────────────────────
                    Text(
                      'Powered by AI · Built for India',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        letterSpacing: 0.5,
                      ),
                    ),

                    const Spacer(flex: 1),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureChip(IconData icon, String label) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            size: 20,
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

