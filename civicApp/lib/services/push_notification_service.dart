import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/foundation.dart';
import '../repositories/auth_repository.dart';

// Must be top-level, independent function to handle background messages
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[PushNotificationService] Background message received: ${message.messageId}');
}

class PushNotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotificationsPlugin =
      FlutterLocalNotificationsPlugin();
  final AuthRepository _authRepository;

  PushNotificationService({required AuthRepository authRepository})
      : _authRepository = authRepository;

  Future<void> initialize() async {
    // 1. Request permissions for iOS and Android 13+
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('[PushNotificationService] User granted permission');
    } else {
      debugPrint('[PushNotificationService] User declined or has not accepted permission');
    }

    // 2. Initialize local notifications for foreground display
    const androidInitSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInitSettings);

    await _localNotificationsPlugin.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        _handleNotificationTap(response.payload);
      },
    );

    // Create a high-priority channel for Android foreground notifications
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel', // id
      'High Importance Notifications', // title
      description: 'This channel is used for important notifications.', // description
      importance: Importance.max,
    );

    await _localNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // 3. Handle Foreground Messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('[PushNotificationService] Foreground message received: ${message.messageId}');
      
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      // Show local notification if it has a title/body and is Android
      if (notification != null && android != null) {
        _localNotificationsPlugin.show(
          id: notification.hashCode,
          title: notification.title,
          body: notification.body,
          notificationDetails: NotificationDetails(
            android: AndroidNotificationDetails(
              channel.id,
              channel.name,
              channelDescription: channel.description,
              icon: android.smallIcon ?? '@mipmap/ic_launcher',
              importance: Importance.max,
              priority: Priority.high,
            ),
          ),
          payload: jsonEncode(message.data),
        );
      }
    });

    // 4. Handle Background Messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // 5. Handle App opened from notification when app was in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('[PushNotificationService] App opened from background notification');
      _handleNotificationTap(jsonEncode(message.data));
    });

    // 6. Handle App opened from notification when app was terminated
    RemoteMessage? initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      debugPrint('[PushNotificationService] App opened from terminated state notification');
      _handleNotificationTap(jsonEncode(initialMessage.data));
    }

    // 7. Get device token and send to backend
    await _registerToken();

    // 8. Listen for token refresh
    _messaging.onTokenRefresh.listen((newToken) {
      _authRepository.registerFcmToken(newToken).catchError((e) {
        debugPrint('[PushNotificationService] Failed to update refreshed token: $e');
      });
    });
  }

  Future<void> _registerToken() async {
    try {
      String? token = await _messaging.getToken();
      if (token != null) {
        debugPrint('[PushNotificationService] FCM Token: $token');
        await _authRepository.registerFcmToken(token);
      }
    } catch (e) {
      debugPrint('[PushNotificationService] Error getting/sending token: $e');
    }
  }

  void _handleNotificationTap(String? payload) {
    if (payload != null && payload.isNotEmpty) {
      try {
        final data = jsonDecode(payload);
        debugPrint('[PushNotificationService] Notification tapped with data: $data');
        // Handle navigation based on data, e.g., using GetX:
        // if (data['complaintId'] != null) {
        //   Get.toNamed('/complaint-details', arguments: data['complaintId']);
        // }
      } catch (e) {
        debugPrint('[PushNotificationService] Error parsing payload: $e');
      }
    }
  }
}
