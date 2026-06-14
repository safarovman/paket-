import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../widgets/gboost_card.dart';
import '../../widgets/gboost_button.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Profil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppColors.cyan),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Avatar & name
            GBoostGradientCard(
              gradient: const LinearGradient(
                colors: [Color(0xFF1A1040), AppColors.cardBackground],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              child: Column(
                children: [
                  Stack(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.primaryGradient,
                          border: Border.all(
                              color: AppColors.cyan.withOpacity(0.5), width: 3),
                        ),
                        child: const Center(
                          child: Text('A',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 36,
                                  fontWeight: FontWeight.bold)),
                        ),
                      ),
                      Positioned(
                        bottom: 2,
                        right: 2,
                        child: Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: AppColors.green,
                            shape: BoxShape.circle,
                            border: Border.all(
                                color: AppColors.background, width: 2),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text('Abdulloh Karimov',
                      style: TextStyle(
                          color: AppColors.textWhite,
                          fontSize: 18,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('+998 90 123 45 67',
                      style: TextStyle(
                          color: AppColors.textGray, fontSize: 13)),
                  const SizedBox(height: 10),
                  KarmaBadge(karma: 78),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Stats
            Row(
              children: [
                _StatBox(label: 'Buyurtmalar', value: '12', color: AppColors.cyan),
                const SizedBox(width: 10),
                _StatBox(label: 'Muvaffaqiyat', value: '11', color: AppColors.green),
                const SizedBox(width: 10),
                _StatBox(label: 'Karma', value: '78', color: AppColors.gold),
              ],
            ),
            const SizedBox(height: 16),

            // Menu items
            GBoostCard(
              child: Column(
                children: [
                  _MenuItem(icon: Icons.history_outlined, label: 'Buyurtmalar tarixi', onTap: () {}),
                  const Divider(color: AppColors.cardBorder, height: 1),
                  _MenuItem(icon: Icons.account_balance_wallet_outlined, label: 'Hamyon va to\'lovlar', onTap: () {}),
                  const Divider(color: AppColors.cardBorder, height: 1),
                  _MenuItem(icon: Icons.shield_outlined, label: 'Escrow tarixi', onTap: () => Navigator.pushNamed(context, '/escrow')),
                  const Divider(color: AppColors.cardBorder, height: 1),
                  _MenuItem(icon: Icons.star_outline, label: 'Karma tarixi', onTap: () => Navigator.pushNamed(context, '/karma')),
                  const Divider(color: AppColors.cardBorder, height: 1),
                  _MenuItem(icon: Icons.notifications_outlined, label: 'Bildirishnomalar', onTap: () {}),
                  const Divider(color: AppColors.cardBorder, height: 1),
                  _MenuItem(icon: Icons.help_outline, label: 'Yordam va qo\'llab-quvvatlash', onTap: () {}),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Contact info
            GBoostCard(
              child: Column(
                children: [
                  _MenuItem(icon: Icons.email_outlined, label: 'gboost.uz@gmail.com', onTap: () {}, isExternal: true),
                  const Divider(color: AppColors.cardBorder, height: 1),
                  _MenuItem(icon: Icons.send_outlined, label: 'Telegram: @gboost_uz', onTap: () {}, isExternal: true),
                  const Divider(color: AppColors.cardBorder, height: 1),
                  _MenuItem(icon: Icons.language_outlined, label: 'gboost.uz', onTap: () {}, isExternal: true),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Logout
            GBoostButton(
              label: 'Chiqish',
              color: AppColors.red.withOpacity(0.8),
              icon: Icons.logout_rounded,
              onPressed: () => Navigator.pushNamedAndRemoveUntil(
                  context, '/login', (_) => false),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatBox(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.25)),
        ),
        child: Column(
          children: [
            Text(value,
                style: TextStyle(
                    color: color,
                    fontSize: 20,
                    fontWeight: FontWeight.bold)),
            const SizedBox(height: 3),
            Text(label,
                style: const TextStyle(
                    color: AppColors.textGray, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isExternal;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isExternal = false,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textGray, size: 20),
      title: Text(label,
          style: const TextStyle(color: AppColors.textLight, fontSize: 14)),
      trailing: Icon(
        isExternal
            ? Icons.open_in_new_rounded
            : Icons.arrow_forward_ios_rounded,
        color: AppColors.textGray,
        size: 14,
      ),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      dense: true,
    );
  }
}
