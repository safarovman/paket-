import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../widgets/gboost_button.dart';
import '../../widgets/gboost_text_field.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;
  String _selectedRole = 'client'; // 'client' or 'booster'

  void _register() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        setState(() => _isLoading = false);
        Navigator.pushReplacementNamed(context, '/home');
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: AppColors.cyan),
          onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
        ),
        title: const Text("Ro'yxatdan o'tish"),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),

                // Role selector
                const Text(
                  'Siz kimSiz?',
                  style: TextStyle(
                    color: AppColors.textWhite,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _RoleCard(
                        icon: '🎮',
                        title: 'Mijoz',
                        subtitle: "Boosting sotib olish",
                        isSelected: _selectedRole == 'client',
                        onTap: () =>
                            setState(() => _selectedRole = 'client'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _RoleCard(
                        icon: '⚔️',
                        title: 'Booster',
                        subtitle: "Boosting xizmat berish",
                        isSelected: _selectedRole == 'booster',
                        onTap: () =>
                            setState(() => _selectedRole = 'booster'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                // Name field
                GBoostTextField(
                  controller: _nameController,
                  label: 'Ism va familiya',
                  hint: 'Abdulloh Karimov',
                  prefixIcon: Icons.person_outline,
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Ismingizni kiriting';
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                // Phone field
                GBoostTextField(
                  controller: _phoneController,
                  label: 'Telefon raqam',
                  hint: '+998 90 123 45 67',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Telefon raqamni kiriting';
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                // Password field
                GBoostTextField(
                  controller: _passwordController,
                  label: 'Parol',
                  hint: '••••••••',
                  prefixIcon: Icons.lock_outline,
                  obscureText: _obscurePassword,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: AppColors.textGray,
                    ),
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                  ),
                  validator: (v) {
                    if (v == null || v.length < 6) {
                      return 'Parol kamida 6 ta belgi bo\'lishi kerak';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                // Confirm password
                GBoostTextField(
                  controller: _confirmController,
                  label: 'Parolni tasdiqlang',
                  hint: '••••••••',
                  prefixIcon: Icons.lock_outline,
                  obscureText: _obscureConfirm,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureConfirm
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: AppColors.textGray,
                    ),
                    onPressed: () =>
                        setState(() => _obscureConfirm = !_obscureConfirm),
                  ),
                  validator: (v) {
                    if (v != _passwordController.text) {
                      return 'Parollar mos emas';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                // Booster-specific: game selection
                if (_selectedRole == 'booster') ...[
                  const Text(
                    "Qaysi o'yinlarda ixtisoslashgansiz?",
                    style: TextStyle(
                      color: AppColors.textLight,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: ['MLBB', 'PUBG', 'Free Fire', 'CS2'].map((g) {
                      return FilterChip(
                        label: Text(g),
                        selected: false,
                        onSelected: (_) {},
                        backgroundColor: AppColors.cardBackground,
                        selectedColor: AppColors.purple.withOpacity(0.4),
                        side: const BorderSide(color: AppColors.cardBorder),
                        labelStyle: const TextStyle(color: AppColors.textLight),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),
                ],

                // Terms
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Checkbox(
                      value: true,
                      onChanged: (_) {},
                      activeColor: AppColors.cyan,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4)),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: RichText(
                          text: const TextSpan(
                            style: TextStyle(
                                color: AppColors.textGray, fontSize: 12),
                            children: [
                              TextSpan(text: 'Men '),
                              TextSpan(
                                text: 'foydalanish shartlari',
                                style: TextStyle(color: AppColors.cyan),
                              ),
                              TextSpan(text: ' va '),
                              TextSpan(
                                text: 'maxfiylik siyosati',
                                style: TextStyle(color: AppColors.cyan),
                              ),
                              TextSpan(text: 'ga roziman'),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                GBoostButton(
                  label: "Ro'yxatdan o'tish",
                  isLoading: _isLoading,
                  onPressed: _register,
                  gradient: AppColors.primaryGradient,
                ),
                const SizedBox(height: 24),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Hisobingiz bormi? ',
                      style: TextStyle(color: AppColors.textGray),
                    ),
                    GestureDetector(
                      onTap: () =>
                          Navigator.pushReplacementNamed(context, '/login'),
                      child: const Text(
                        'Kirish',
                        style: TextStyle(
                          color: AppColors.cyan,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String icon;
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: isSelected
              ? AppColors.purple.withOpacity(0.2)
              : AppColors.cardBackground,
          border: Border.all(
            color: isSelected ? AppColors.cyan : AppColors.cardBorder,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 6),
            Text(
              title,
              style: TextStyle(
                color: isSelected ? AppColors.cyan : AppColors.textWhite,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textGray, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}
