import 'package:flutter/material.dart';

class AppColors {
  // Background
  static const Color background = Color(0xFF0D0D1A);
  static const Color cardBackground = Color(0xFF161D38);
  static const Color cardBorder = Color(0xFF1A2245);
  static const Color darkNavy = Color(0xFF1A2245);

  // Primary
  static const Color cyan = Color(0xFF00E5FF);
  static const Color purple = Color(0xFF6C3FB5);
  static const Color purpleLight = Color(0xFF9B59B6);

  // Accent
  static const Color gold = Color(0xFFFFD600);
  static const Color green = Color(0xFF00C853);
  static const Color red = Color(0xFFFF3D3D);
  static const Color orange = Color(0xFFFF8C00);

  // Text
  static const Color textWhite = Color(0xFFFFFFFF);
  static const Color textLight = Color(0xFFE8EAF6);
  static const Color textGray = Color(0xFF90A4AE);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [purple, cyan],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [cardBackground, darkNavy],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFFFFD600), Color(0xFFFF8C00)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
