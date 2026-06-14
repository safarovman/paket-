import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_constants.dart';
import '../../widgets/gboost_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final List<Map<String, dynamic>> _recentOrders = [
    {
      'game': 'MLBB',
      'service': 'Solo Boosting',
      'from': 'Epic',
      'to': 'Legend',
      'price': 120000,
      'status': 'active',
      'booster': 'ProGamer99',
    },
    {
      'game': 'PUBG',
      'service': 'Duo Boosting',
      'from': 'Gold',
      'to': 'Platinum',
      'price': 80000,
      'status': 'completed',
      'booster': 'SniperKing',
    },
  ];

  final List<Map<String, dynamic>> _topBoosters = [
    {'name': 'ProGamer99', 'game': 'MLBB', 'karma': 95, 'orders': 142},
    {'name': 'SniperKing', 'game': 'PUBG', 'karma': 88, 'orders': 97},
    {'name': 'FireLord', 'game': 'Free Fire', 'karma': 92, 'orders': 115},
    {'name': 'CSPro', 'game': 'CS2', 'karma': 85, 'orders': 63},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 120,
            floating: true,
            pinned: true,
            backgroundColor: AppColors.background,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                padding: const EdgeInsets.fromLTRB(20, 50, 20, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Salom, Abdulloh! 👋',
                          style: TextStyle(
                            color: AppColors.textGray,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 2),
                        ShaderMask(
                          shaderCallback: (b) =>
                              AppColors.primaryGradient.createShader(b),
                          child: const Text(
                            'GBoost',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        // Notifications
                        Stack(
                          children: [
                            IconButton(
                              icon: const Icon(
                                Icons.notifications_outlined,
                                color: AppColors.textLight,
                                size: 26,
                              ),
                              onPressed: () {},
                            ),
                            Positioned(
                              right: 8,
                              top: 8,
                              child: Container(
                                width: 9,
                                height: 9,
                                decoration: const BoxDecoration(
                                  color: AppColors.red,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          ],
                        ),
                        // Avatar
                        GestureDetector(
                          onTap: () =>
                              Navigator.pushNamed(context, '/profile'),
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: AppColors.primaryGradient,
                              border: Border.all(
                                  color: AppColors.cyan.withOpacity(0.4),
                                  width: 2),
                            ),
                            child: const Center(
                              child: Text(
                                'A',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),

                  // Stats banner
                  _StatsBanner(),
                  const SizedBox(height: 24),

                  // Quick actions
                  _QuickActions(),
                  const SizedBox(height: 24),

                  // Games section
                  _SectionHeader(
                    title: "O'yinlar",
                    onSeeAll: () =>
                        Navigator.pushNamed(context, '/boosting'),
                  ),
                  const SizedBox(height: 12),
                  _GamesGrid(),
                  const SizedBox(height: 24),

                  // Active orders
                  _SectionHeader(
                    title: 'Faol buyurtmalar',
                    onSeeAll: () {},
                  ),
                  const SizedBox(height: 12),
                  ..._recentOrders.map((o) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _OrderCard(order: o),
                      )),
                  const SizedBox(height: 24),

                  // Top boosters
                  _SectionHeader(
                    title: 'Top Boosterlar',
                    onSeeAll: () {},
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 130,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _topBoosters.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 10),
                      itemBuilder: (_, i) =>
                          _BoosterCard(booster: _topBoosters[i]),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Banner: Escrow
                  _EscrowBanner(),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---- Stats Banner ----
class _StatsBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GBoostGradientCard(
      gradient: const LinearGradient(
        colors: [Color(0xFF1A1040), Color(0xFF0D2040)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      child: Row(
        children: [
          Expanded(
            child: _StatItem(
              label: "O'zbek geymerlari",
              value: '4.5M+',
              color: AppColors.cyan,
            ),
          ),
          Container(width: 1, height: 40, color: AppColors.cardBorder),
          Expanded(
            child: _StatItem(
              label: 'Xavfsiz tranzaksiya',
              value: '10K+',
              color: AppColors.green,
            ),
          ),
          Container(width: 1, height: 40, color: AppColors.cardBorder),
          Expanded(
            child: _StatItem(
              label: 'Faol boosterlar',
              value: '500+',
              color: AppColors.gold,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatItem(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: AppColors.textGray,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}

// ---- Quick Actions ----
class _QuickActions extends StatelessWidget {
  final List<Map<String, dynamic>> actions = const [
    {'icon': '⚔️', 'label': 'Boosting', 'route': '/boosting', 'color': 0xFF00E5FF},
    {'icon': '🏪', 'label': 'Bozor', 'route': '/marketplace', 'color': 0xFFFFD600},
    {'icon': '🛡️', 'label': 'Escrow', 'route': '/escrow', 'color': 0xFF00C853},
    {'icon': '⭐', 'label': 'Karma', 'route': '/karma', 'color': 0xFFFF3D3D},
  ];

  const _QuickActions();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: actions
          .map(
            (a) => GestureDetector(
              onTap: () => Navigator.pushNamed(context, a['route']),
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: Color(a['color'] as int).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: Color(a['color'] as int).withOpacity(0.35),
                      ),
                    ),
                    child: Center(
                      child: Text(
                        a['icon'],
                        style: const TextStyle(fontSize: 28),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    a['label'],
                    style: const TextStyle(
                      color: AppColors.textLight,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

// ---- Section Header ----
class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onSeeAll;

  const _SectionHeader({required this.title, this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: AppColors.textWhite,
            fontSize: 17,
            fontWeight: FontWeight.bold,
          ),
        ),
        if (onSeeAll != null)
          GestureDetector(
            onTap: onSeeAll,
            child: const Text(
              "Barchasi →",
              style: TextStyle(color: AppColors.cyan, fontSize: 13),
            ),
          ),
      ],
    );
  }
}

// ---- Games Grid ----
class _GamesGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 2.2,
      children: AppConstants.games.map((game) {
        final color = Color(game['color'] as int);
        return GestureDetector(
          onTap: () => Navigator.pushNamed(context, '/boosting'),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Text(game['icon'], style: const TextStyle(fontSize: 22)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        game['shortName'],
                        style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        'Boosting',
                        style: const TextStyle(
                          color: AppColors.textGray,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ---- Order Card ----
class _OrderCard extends StatelessWidget {
  final Map<String, dynamic> order;

  const _OrderCard({required this.order});

  Color get _statusColor {
    switch (order['status']) {
      case 'active':
        return AppColors.cyan;
      case 'completed':
        return AppColors.green;
      case 'pending':
        return AppColors.gold;
      default:
        return AppColors.textGray;
    }
  }

  String get _statusLabel {
    switch (order['status']) {
      case 'active':
        return 'Faol';
      case 'completed':
        return 'Tugadi';
      case 'pending':
        return 'Kutilmoqda';
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return GBoostCard(
      borderColor: _statusColor.withOpacity(0.3),
      child: Row(
        children: [
          // Game icon
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: _statusColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                _gameIcon(order['game']),
                style: const TextStyle(fontSize: 22),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${order['game']} • ${order['service']}',
                      style: const TextStyle(
                        color: AppColors.textWhite,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: _statusColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _statusLabel,
                        style: TextStyle(
                          color: _statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  "${order['from']} → ${order['to']}",
                  style: const TextStyle(
                    color: AppColors.textGray,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Booster: ${order['booster']}',
                      style: const TextStyle(
                        color: AppColors.cyan,
                        fontSize: 11,
                      ),
                    ),
                    Text(
                      '${_formatPrice(order['price'])} so\'m',
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _gameIcon(String game) {
    switch (game) {
      case 'MLBB':
        return '🗡️';
      case 'PUBG':
        return '🎯';
      case 'Free Fire':
        return '🔥';
      case 'CS2':
        return '💣';
      default:
        return '🎮';
    }
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
  }
}

// ---- Booster Card ----
class _BoosterCard extends StatelessWidget {
  final Map<String, dynamic> booster;

  const _BoosterCard({required this.booster});

  @override
  Widget build(BuildContext context) {
    return GBoostCard(
      padding: const EdgeInsets.all(12),
      child: SizedBox(
        width: 110,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.primaryGradient,
              ),
              child: Center(
                child: Text(
                  booster['name'][0],
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              booster['name'],
              style: const TextStyle(
                color: AppColors.textWhite,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 3),
            Text(
              booster['game'],
              style: const TextStyle(
                color: AppColors.textGray,
                fontSize: 10,
              ),
            ),
            const SizedBox(height: 6),
            KarmaBadge(karma: booster['karma']),
          ],
        ),
      ),
    );
  }
}

// ---- Escrow Banner ----
class _EscrowBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GBoostGradientCard(
      gradient: const LinearGradient(
        colors: [Color(0xFF0D2A1A), Color(0xFF0D1A2A)],
      ),
      child: Row(
        children: [
          const Text('🛡️', style: TextStyle(fontSize: 36)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '3 Kunlik Escrow Himoyasi',
                  style: TextStyle(
                    color: AppColors.green,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  "Pulingiz xavfsiz - ikki tomon kelishgandagina o'tkaziladi",
                  style: TextStyle(
                    color: AppColors.textGray,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios,
              color: AppColors.green, size: 16),
        ],
      ),
    );
  }
}
