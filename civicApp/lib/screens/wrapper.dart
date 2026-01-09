import 'package:civic/screens/home_screen.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'loginpage.dart';
import 'verify.dart';
class Wrapper extends StatefulWidget {
  const Wrapper({super.key});

  @override
  State<Wrapper> createState() => _WrapperState();
}

class _WrapperState extends State<Wrapper> {
  Widget? currentScreen;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }

          final user = snapshot.data;

          if (user == null) {
            currentScreen = Loginpage();
          } else if (user.emailVerified) {
            currentScreen = HomeScreen();
          } else {
            currentScreen ??= Verify(); // Only assign once
          }

          return currentScreen!;
        },
      ),
    );
  }
}
