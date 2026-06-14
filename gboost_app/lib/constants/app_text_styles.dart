import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTextStyles {
  static const String fontFamily = 'Calibri';

  static const TextStyle heading1 = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: AppColors.textWhite,
    letterSpacing: 0.5,
  );

  static const TextStyle heading2 = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: AppColors.textWhite,
  );

  static const TextStyle heading3 = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: AppColors.textWhite,
  );

  static const TextStyle body1 = TextStyle(
    fontSize: 15,
    color: AppColors.textLight,
    height: 1.5,
  );

  static const TextStyle body2 = TextStyle(
    fontSize: 13,
    color: AppColors.textGray,
    height: 1.4,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 11,
    color: AppColors.textGray,
  );

  static const TextStyle buttonText = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: AppColors.textWhite,
    letterSpacing: 0.8,
  );

  static const TextStyle cyanText = TextStyle(
    fontSize: 15,
    color: AppColors.cyan,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle goldText = TextStyle(
    fontSize: 15,
    color: AppColors.gold,
    fontWeight: FontWeight.bold,
  );

  static const TextStyle greenText = TextStyle(
    fontSize: 13,
    color: AppColors.green,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle redText = TextStyle(
    fontSize: 13,
    color: AppColors.red,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle priceText = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: AppColors.gold,
    letterSpacing: 1,
  );
}
