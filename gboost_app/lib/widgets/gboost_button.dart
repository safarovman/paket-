import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class GBoostButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final LinearGradient? gradient;
  final Color? color;
  final IconData? icon;
  final double height;

  const GBoostButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.gradient,
    this.color,
    this.icon,
    this.height = 52,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onPressed,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        height: height,
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: gradient,
          color: gradient == null ? (color ?? AppColors.cyan) : null,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: (gradient != null ? AppColors.cyan : (color ?? AppColors.cyan))
                  .withOpacity(0.25),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Colors.white,
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (icon != null) ...[
                      Icon(icon, color: Colors.white, size: 18),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class GBoostOutlinedButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color borderColor;
  final Color textColor;
  final IconData? icon;

  const GBoostOutlinedButton({
    super.key,
    required this.label,
    this.onPressed,
    this.borderColor = AppColors.cyan,
    this.textColor = AppColors.cyan,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 48,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: 1.5),
          color: borderColor.withOpacity(0.08),
        ),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, color: textColor, size: 18),
                const SizedBox(width: 8),
              ],
              Text(
                label,
                style: TextStyle(
                  color: textColor,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
