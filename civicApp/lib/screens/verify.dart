import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'loginpage.dart';
import 'wrapper.dart';


class Verify extends StatefulWidget {
  const Verify({super.key});

  @override
  State<Verify> createState() => _VerifyState();
}

class _VerifyState extends State<Verify> {
  bool _linkSent = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 500), () {
      if (!_linkSent) {
        sendVerifyLink();
        _linkSent = true;
      }
    });
  }

  Future<void> sendVerifyLink() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        debugPrint('[Verify] sendVerifyLink: currentUser is null.');
        return;
      }
      if (!user.emailVerified) {
        await user.sendEmailVerification();
        if (mounted) {
          Get.snackbar(
            'Link Sent',
            'A link has been sent to your email.',
            margin: const EdgeInsets.all(30),
            snackPosition: SnackPosition.BOTTOM,
          );
        }
      }
    } catch (e) {
      debugPrint("[Verify] Error sending verification link: $e");
      if (mounted) {
        String errorMsg = "Failed to send verification link.";
        if (e.toString().contains("too-many-requests")) {
          errorMsg = "Verification email already sent. Please check your inbox or try again later.";
        }
        Get.snackbar(
          "Verification Status",
          errorMsg,
          margin: const EdgeInsets.all(30),
          snackPosition: SnackPosition.BOTTOM,
        );
      }
    }
  }

  Future<void> reload() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.reloadUser();
    if (authProvider.firebaseUser?.emailVerified == true) {
      Get.offAll(() => const Wrapper());
    } else {
      Get.snackbar(
        'Not Verified',
        'Please verify email before reloading.',
        margin: const EdgeInsets.all(30),
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Verification"),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign Out',
            onPressed: () async {
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              await authProvider.signOut();
              Get.offAll(() => const Loginpage());
            },
          ),
        ],
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.0),
          child: Text(
            "Open your mail and click on the link to verify email, then tap the reload button below.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: reload,
        child: const Icon(Icons.refresh),
      ),
    );
  }
}
