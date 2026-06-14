import 'package:flutter/material.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/boosting/boosting_screen.dart';
import '../screens/marketplace/marketplace_screen.dart';
import '../screens/escrow/escrow_screen.dart';
import '../screens/karma/karma_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/booster/booster_profile_screen.dart';

class AppRoutes {
  static const String splash    = '/';
  static const String login     = '/login';
  static const String register  = '/register';
  static const String home      = '/home';
  static const String boosting  = '/boosting';
  static const String marketplace = '/marketplace';
  static const String escrow    = '/escrow';
  static const String karma     = '/karma';
  static const String profile   = '/profile';
  static const String booster   = '/booster';

  static Map<String, WidgetBuilder> get routes => {
    splash:      (_) => const SplashScreen(),
    login:       (_) => const LoginScreen(),
    register:    (_) => const RegisterScreen(),
    home:        (_) => const MainNavScreen(),
    boosting:    (_) => const BoostingScreen(),
    marketplace: (_) => const MarketplaceScreen(),
    escrow:      (_) => const EscrowScreen(),
    karma:       (_) => const KarmaScreen(),
    profile:     (_) => const ProfileScreen(),
    booster:     (_) => const BoosterProfileScreen(),
  };
}

// ==========================================
//  MAIN NAVIGATION SCREEN (Bottom Nav)
// ==========================================
class MainNavScreen extends StatefulWidget {
  const MainNavScreen({super.key});

  @override
  State<MainNavScreen> createState() => _MainNavScreenState();
}

class _MainNavScreenState extends State<MainNavScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    BoostingScreen(),
    MarketplaceScreen(),
    EscrowScreen(),
    ProfileScreen(),
  ];

  final List<_NavItem> _navItems = const [
    _NavItem(icon: Icons.home_outlined,      activeIcon: Icons.home_rounded,           label: 'Bosh sahifa'),
    _NavItem(icon: Icons.rocket_outlined,    activeIcon: Icons.rocket_rounded,          label: 'Boosting'),
    _NavItem(icon: Icons.storefront_outlined,activeIcon: Icons.storefront_rounded,      label: 'Bozor'),
    _NavItem(icon: Icons.shield_outlined,    activeIcon: Icons.shield_rounded,          label: 'Escrow'),
    _NavItem(icon: Icons.person_outline,     activeIcon: Icons.person_rounded,          label: 'Profil'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: _GBoostBottomNav(
        currentIndex: _currentIndex,
        items: _navItems,
        onTap: (i) => setState(() => _currentIndex = i),
      ),
    );
  }
}

// ==========================================
//  CUSTOM BOTTOM NAV BAR
// ==========================================
class _GBoostBottomNav extends StatelessWidget {
  final int currentIndex;
  final List<_NavItem> items;
  final ValueChanged<int> onTap;

  const _GBoostBottomNav({
    required this.currentIndex,
    required this.items,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 72,
      decoration: const BoxDecoration(
        color: Color(0xFF131929),
        border: Border(top: BorderSide(color: Color(0xFF1A2245), width: 1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black38,
            blurRadius: 12,
            offset: Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        children: items.asMap().entries.map((e) {
          final i = e.key;
          final item = e.value;
          final isSelected = i == currentIndex;
          // Middle item (Bozor) gets special treatment
          final isMid = i == 2;

          return Expanded(
            child: GestureDetector(
              onTap: () => onTap(i),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Special center button
                    if (isMid)
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          gradient: isSelected
                              ? AppColors.primaryGradient
                              : const LinearGradient(
                                  colors: [
                                    Color(0xFF1A2245),
                                    Color(0xFF1A2245)
                                  ],
                                ),
                          shape: BoxShape.circle,
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color:
                                        AppColors.cyan.withOpacity(0.3),
                                    blurRadius: 14,
                                  )
                                ]
                              : [],
                        ),
                        child: Icon(
                          isSelected ? item.activeIcon : item.icon,
                          color: Colors.white,
                          size: 22,
                        ),
                      )
                    else
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.cyan.withOpacity(0.12)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          isSelected ? item.activeIcon : item.icon,
                          color: isSelected
                              ? AppColors.cyan
                              : AppColors.textGray,
                          size: 22,
                        ),
                      ),
                    if (!isMid) ...[
                      const SizedBox(height: 3),
                      AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 200),
                        style: TextStyle(
                          color: isSelected
                              ? AppColors.cyan
                              : AppColors.textGray,
                          fontSize: 10,
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                        child: Text(item.label),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}
