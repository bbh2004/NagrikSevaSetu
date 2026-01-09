import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'loginpage.dart';
import 'wrapper.dart';


class Verify extends StatefulWidget {
  const Verify({super.key});

  @override
  State<Verify> createState() => _VerifyState();
}

class _VerifyState extends State<Verify> {
  bool _linkSent = false;
  bool _deleteTimerStarted = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: 500), () {
      if (!_linkSent) {
        sendVerifyLink();
        _linkSent = true;
      }
      if (!_deleteTimerStarted) {
        startAutoDeleteTimer();
        _deleteTimerStarted = true;
      }
    });
  }

  Future<void> sendVerifyLink() async {
    try {
      final user = FirebaseAuth.instance.currentUser!;
      if (!user.emailVerified) {
        await user.sendEmailVerification();
        if (mounted) {
          Get.snackbar(
            'Link Sent',
            'A link has been sent to your email.',
            margin: EdgeInsets.all(30),
            snackPosition: SnackPosition.BOTTOM,
          );
        }
      }
    } catch (e) {
      final user = FirebaseAuth.instance.currentUser!;
      print("Error: $e");
      Get.snackbar(
        "Error",
        "Failed to send verification link. Sign up again.",
        margin: EdgeInsets.all(30),
        snackPosition: SnackPosition.BOTTOM,
      );
      await FirebaseAuth.instance.signOut();
      await user.delete();
      Get.offAll(() => Loginpage());
    }
  }

  Future<void> reload() async {
    await FirebaseAuth.instance.currentUser!.reload();
    final user = FirebaseAuth.instance.currentUser!;
    if (user.emailVerified) {
      Get.offAll(() => Wrapper());
    } else {
      Get.snackbar(
        'Not Verified',
        'Please verify email before reloading.',
        margin: EdgeInsets.all(30),
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }

  void startAutoDeleteTimer() {
    Future.delayed(Duration(seconds: 30), () async {
      final user = FirebaseAuth.instance.currentUser!;
      await user.reload();
      if (!user.emailVerified) {
        await user.delete();
        if (mounted) {
          Get.snackbar(
            "Account Deleted",
            "Email verification expired. Please sign up again.",
            margin: EdgeInsets.all(30),
            snackPosition: SnackPosition.BOTTOM,
          );
        }
        Get.offAll(() => Loginpage());
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Verification"),
      ),
      body: Center(
        child: Text(
          "Open your mail and click on the link to verify email, then tap the reload button below.",
          textAlign: TextAlign.center,
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: reload,
        child: Icon(Icons.refresh),
      ),
    );
  }
}
