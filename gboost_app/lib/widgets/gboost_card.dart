import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class GBoostCard extends StatelessWidget {
  final Widget child;
  final Color? borderColor;
  final EdgeInsets? padding;
  final VoidCallback? onTap;
  final double borderRadius;

  const GBoostCard({
    super.key,
    required this.child,
    this.borderColor,
    this.padding,
    this.onTap,
    this.borderRadius = 16,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding ?? const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(borderRadius),
          border: Border.all(
            color: borderColor ?? AppColors.cardBorder,
            width: borderColor != null ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}

class GBoostGradientCard extends StatelessWidget {
  final Widget child;
  final LinearGradient gradient;
  final EdgeInsets? padding;
  final double borderRadius;

  const GBoostGradientCard({
    super.key,
    required this.child,
    required this.gradient,
    this.padding,
    this.borderRadius = 16,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}

class KarmaBadge extends StatelessWidget {
  final int karma;

  const KarmaBadge({super.key, required this.karma});

  Color get _color {
    if (karma >= 80) return AppColors.green;
    if (karma >= 40) return AppColors.gold;
    return AppColors.red;
  }

  String get _label {
    if (karma >= 80) return 'Yuqori';
    if (karma >= 40) return "O'rtacha";
    return 'Past';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _color.withOpacity(0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.star_rounded, color: _color, size: 14),
          const SizedBox(width: 4),
          Text(
            '$karma • $_label',
            style: TextStyle(
              color: _color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
