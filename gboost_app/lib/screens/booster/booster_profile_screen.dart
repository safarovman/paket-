import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../widgets/gboost_card.dart';
import '../../widgets/gboost_button.dart';

class BoosterProfileScreen extends StatefulWidget {
  final String? boosterName;
  const BoosterProfileScreen({super.key, this.boosterName});

  @override
  State<BoosterProfileScreen> createState() => _BoosterProfileScreenState();
}

class _BoosterProfileScreenState extends State<BoosterProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final Map<String, dynamic> _booster = {
    'name': 'ProGamer99',
    'game': 'MLBB',
    'karma': 95,
    'orders': 142,
    'rating': 4.9,
    'winRate': 78,
    'avgTime': '8 soat',
    'joined': '2024-yil',
    'bio': "O'zbekistonning top MLBB boosteri. 3 yillik tajriba. Mythic Glory darajasidaman.",
    'games': ['MLBB', 'PUBG'],
    'speciality': 'Solo & Duo Boosting',
    'completedOrders': 142,
    'cancelRate': 2,
    'responseTime': '< 10 daqiqa',
  };

  final List<Map<String, dynamic>> _reviews = [
    {
      'user': 'Jasur M.',
      'rating': 5,
      'text': "Juda tez va professional! Epic dan Legend ga 6 soatda chiqdi.",
      'date': '2 kun oldin',
      'game': 'MLBB',
    },
    {
      'user': 'Bobur K.',
      'rating': 5,
      'text': "Tavsiya qilaman! Hech qanday muammo bo'lmadi.",
      'date': '1 hafta oldin',
      'game': 'MLBB',
    },
    {
      'user': 'Dilshod A.',
      'rating': 4,
      'text': "Yaxshi xizmat, biroz kech boshladi lekin natija ajoyib.",
      'date': '2 hafta oldin',
      'game': 'PUBG',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: AppColors.background,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios, color: AppColors.cyan),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.share_outlined, color: AppColors.cyan),
                onPressed: () {},
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF1A1040), AppColors.background],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      // Avatar
                      Stack(
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: AppColors.primaryGradient,
                              border: Border.all(
                                  color: AppColors.cyan.withOpacity(0.5),
                                  width: 3),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.cyan.withOpacity(0.3),
                                  blurRadius: 20,
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                _booster['name'][0],
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 36,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
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
                      const SizedBox(height: 10),
                      Text(
                        _booster['name'],
                        style: const TextStyle(
                          color: AppColors.textWhite,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _booster['speciality'],
                        style: const TextStyle(
                          color: AppColors.cyan,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 10),
                      KarmaBadge(karma: _booster['karma']),
                    ],
                  ),
                ),
              ),
            ),
            bottom: TabBar(
              controller: _tabController,
              tabs: const [
                Tab(text: 'Profil'),
                Tab(text: 'Statistika'),
                Tab(text: 'Sharhlar'),
              ],
              indicatorColor: AppColors.cyan,
              labelColor: AppColors.cyan,
              unselectedLabelColor: AppColors.textGray,
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _ProfileTab(booster: _booster),
            _StatsTab(booster: _booster),
            _ReviewsTab(reviews: _reviews),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        decoration: const BoxDecoration(
          color: AppColors.cardBackground,
          border: Border(top: BorderSide(color: AppColors.cardBorder)),
        ),
        child: GBoostButton(
          label: 'Buyurtma berish',
          gradient: AppColors.primaryGradient,
          icon: Icons.rocket_launch_outlined,
          onPressed: () => Navigator.pushNamed(context, '/boosting'),
        ),
      ),
    );
  }
}

// ---- Profile Tab ----
class _ProfileTab extends StatelessWidget {
  final Map<String, dynamic> booster;
  const _ProfileTab({required this.booster});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Bio
          GBoostCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Haqida',
                    style: TextStyle(
                        color: AppColors.cyan,
                        fontWeight: FontWeight.bold,
                        fontSize: 14)),
                const SizedBox(height: 8),
                Text(
                  booster['bio'],
                  style: const TextStyle(
                      color: AppColors.textLight, fontSize: 13, height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Games
          GBoostCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("O'yinlar",
                    style: TextStyle(
                        color: AppColors.cyan,
                        fontWeight: FontWeight.bold,
                        fontSize: 14)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  children: (booster['games'] as List).map((g) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.purple.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: AppColors.purple.withOpacity(0.4)),
                      ),
                      child: Text(g,
                          style: const TextStyle(
                              color: AppColors.textLight, fontSize: 12)),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Info rows
          GBoostCard(
            child: Column(
              children: [
                _InfoRow(icon: Icons.schedule_outlined,
                    label: "O'rtacha bajarish vaqti",
                    value: booster['avgTime']),
                const Divider(color: AppColors.cardBorder, height: 16),
                _InfoRow(icon: Icons.timer_outlined,
                    label: "Javob vaqti",
                    value: booster['responseTime']),
                const Divider(color: AppColors.cardBorder, height: 16),
                _InfoRow(icon: Icons.calendar_today_outlined,
                    label: "A'zo bo'lgan",
                    value: booster['joined']),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---- Stats Tab ----
class _StatsTab extends StatelessWidget {
  final Map<String, dynamic> booster;
  const _StatsTab({required this.booster});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Main stats grid
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.6,
            children: [
              _StatCard(
                  label: 'Buyurtmalar',
                  value: '${booster['completedOrders']}',
                  icon: '📦',
                  color: AppColors.cyan),
              _StatCard(
                  label: 'Reyting',
                  value: '${booster['rating']} ⭐',
                  icon: '⭐',
                  color: AppColors.gold),
              _StatCard(
                  label: 'Win Rate',
                  value: '${booster['winRate']}%',
                  icon: '🏆',
                  color: AppColors.green),
              _StatCard(
                  label: 'Bekor qilish',
                  value: '${booster['cancelRate']}%',
                  icon: '❌',
                  color: AppColors.red),
            ],
          ),
          const SizedBox(height: 16),

          // Win rate bar
          GBoostCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Win Rate ko\'rsatkichi',
                    style: TextStyle(
                        color: AppColors.textWhite,
                        fontWeight: FontWeight.bold,
                        fontSize: 14)),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: booster['winRate'] / 100,
                          backgroundColor: AppColors.cardBorder,
                          color: AppColors.green,
                          minHeight: 10,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      '${booster['winRate']}%',
                      style: const TextStyle(
                          color: AppColors.green,
                          fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text('Karma ko\'rsatkichi',
                    style: TextStyle(
                        color: AppColors.textWhite,
                        fontWeight: FontWeight.bold,
                        fontSize: 14)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: booster['karma'] / 100,
                          backgroundColor: AppColors.cardBorder,
                          color: AppColors.cyan,
                          minHeight: 10,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      '${booster['karma']}/100',
                      style: const TextStyle(
                          color: AppColors.cyan,
                          fontWeight: FontWeight.bold),
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
}

// ---- Reviews Tab ----
class _ReviewsTab extends StatelessWidget {
  final List<Map<String, dynamic>> reviews;
  const _ReviewsTab({required this.reviews});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: reviews.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final r = reviews[i];
        return GBoostCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.purple.withOpacity(0.3),
                        ),
                        child: Center(
                          child: Text(
                            r['user'][0],
                            style: const TextStyle(
                                color: AppColors.textWhite,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(r['user'],
                              style: const TextStyle(
                                  color: AppColors.textWhite,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13)),
                          Text(r['game'],
                              style: const TextStyle(
                                  color: AppColors.textGray,
                                  fontSize: 11)),
                        ],
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Row(
                        children: List.generate(
                          5,
                          (si) => Icon(
                            Icons.star_rounded,
                            size: 14,
                            color: si < r['rating']
                                ? AppColors.gold
                                : AppColors.cardBorder,
                          ),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(r['date'],
                          style: const TextStyle(
                              color: AppColors.textGray, fontSize: 10)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                r['text'],
                style: const TextStyle(
                    color: AppColors.textLight,
                    fontSize: 13,
                    height: 1.4),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ---- Helpers ----
class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final String icon;
  final Color color;

  const _StatCard(
      {required this.label,
      required this.value,
      required this.icon,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value,
                  style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.bold,
                      fontSize: 18)),
              Text(label,
                  style: const TextStyle(
                      color: AppColors.textGray, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, color: AppColors.textGray, size: 16),
            const SizedBox(width: 8),
            Text(label,
                style: const TextStyle(
                    color: AppColors.textGray, fontSize: 13)),
          ],
        ),
        Text(value,
            style: const TextStyle(
                color: AppColors.textLight,
                fontSize: 13,
                fontWeight: FontWeight.w600)),
      ],
    );
  }
}
