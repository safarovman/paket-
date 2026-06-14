import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/gboost_button.dart';
import '../../widgets/gboost_text_field.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  void _login() async {
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
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 50),
                // Logo + Title
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [AppColors.purple, AppColors.cyan],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.cyan.withOpacity(0.3),
                              blurRadius: 20,
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Text(
                            'G',
                            style: TextStyle(
                              fontSize: 38,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ShaderMask(
                        shaderCallback: (b) =>
                            AppColors.primaryGradient.createShader(b),
                        child: const Text(
                          'GBoost',
                          style: TextStyle(
                            fontSize: 30,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Hisobingizga kiring',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.textGray,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 48),

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
                const SizedBox(height: 16),

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
                    if (v == null || v.isEmpty) return 'Parolni kiriting';
                    if (v.length < 6) return 'Parol kamida 6 ta belgi';
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                // Forgot password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {},
                    child: const Text(
                      'Parolni unutdingizmi?',
                      style: TextStyle(color: AppColors.cyan, fontSize: 13),
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                // Login button
                GBoostButton(
                  label: 'Kirish',
                  isLoading: _isLoading,
                  onPressed: _login,
                  gradient: AppColors.primaryGradient,
                ),
                const SizedBox(height: 16),

                // Divider
                Row(
                  children: [
                    Expanded(
                        child: Divider(color: AppColors.cardBorder, height: 1)),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Text('yoki', style: TextStyle(color: AppColors.textGray, fontSize: 12)),
                    ),
                    Expanded(
                        child: Divider(color: AppColors.cardBorder, height: 1)),
                  ],
                ),
                const SizedBox(height: 16),

                // Telegram login
                OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Text('✈️', style: TextStyle(fontSize: 18)),
                  label: const Text(
                    'Telegram orqali kirish',
                    style: TextStyle(color: AppColors.textLight),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.cardBorder),
                    minimumSize: const Size(double.infinity, 52),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                ),
                const SizedBox(height: 32),

                // Register link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "Hisobingiz yo'qmi? ",
                      style: TextStyle(color: AppColors.textGray),
                    ),
                    GestureDetector(
                      onTap: () =>
                          Navigator.pushReplacementNamed(context, '/register'),
                      child: const Text(
                        "Ro'yxatdan o'ting",
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
