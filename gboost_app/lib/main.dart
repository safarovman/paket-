import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'constants/app_theme.dart';
import 'routes/app_routes.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF131929),
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(const GBoostApp());
}

class GBoostApp extends StatelessWidget {
  const GBoostApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GBoost',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      initialRoute: AppRoutes.splash,
      routes: AppRoutes.routes,
      onUnknownRoute: (settings) => MaterialPageRoute(
        builder: (_) => const Scaffold(
          body: Center(
            child: Text('Sahifa topilmadi',
                style: TextStyle(color: Colors.white)),
          ),
        ),
      ),
    );
  }
}
