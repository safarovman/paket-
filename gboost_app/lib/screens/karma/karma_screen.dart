import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../widgets/gboost_card.dart';

class KarmaScreen extends StatefulWidget {
  const KarmaScreen({super.key});

  @override
  State<KarmaScreen> createState() => _KarmaScreenState();
}

class _KarmaScreenState extends State<KarmaScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final int _myKarma = 78;

  final List<Map<String, dynamic>> _history = [
    {
      'type': 'gain',
      'points': 5,
      'reason': "Buyurtma muvaffaqiyatli bajarildi",
      'date': '2 kun oldin',
    },
    {
      'type': 'gain',
      'points': 3,
      'reason': "5 yulduzli sharh olindi",
      'date': '5 kun oldin',
    },
    {
      'type': 'loss',
      'points': -5,
      'reason': "Kechikish — shikoyat tasdiqlandi",
      'date': '1 hafta oldin',
    },
    {
      'type': 'gain',
      'points': 5,
      'reason': "Buyurtma muvaffaqiyatli bajarildi",
      'date': '2 hafta oldin',
    },
    {
      'type': 'loss',
      'points': -20,
      'reason': "Takroriy shikoyat — Soft Ban",
      'date': '3 hafta oldin',
    },
  ];

  final List<Map<String, dynamic>> _penalties = [
    {
      'icon': '⚠️',
      'level': 'Ogohlantirish',
      'desc': "Birinchi qoidabuzarlik — xabar yuboriladi",
      'karmaChange': '-5',
      'color': 0xFFFFD600,
      'action': 'Xabar',
    },
    {
      'icon': '🔒',
      'level': 'Soft Ban (vaqtincha)',
      'desc': "Takroriy buzarlik — 7-30 kunlik bloklash",
      'karmaChange': '-20',
      'color': 0xFFFF8C00,
      'action': '7-30 kun',
    },
    {
      'icon': '🚫',
      'level': 'Hard Ban (umrbod)',
      'desc': "Jiddiy firibgarlik — akkaunt va pul doimiy muzlatiladi",
      'karmaChange': '∞',
      'color': 0xFFFF3D3D,
      'action': 'Doimiy',
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

  Color get _karmaColor {
    if (_myKarma >= 80) return AppColors.green;
    if (_myKarma >= 40) return AppColors.gold;
    return AppColors.red;
  }

  String get _karmaLabel {
    if (_myKarma >= 80) return 'Yuqori';
    if (_myKarma >= 40) return "O'rtacha";
    return 'Past';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Karma Tizimi'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Mening Karma'),
            Tab(text: 'Tarix'),
            Tab(text: 'Jazo tizimi'),
          ],
          indicatorColor: AppColors.red,
          labelColor: AppColors.cyan,
          unselectedLabelColor: AppColors.textGray,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _MyKarmaTab(karma: _myKarma, karmaColor: _karmaColor, karmaLabel: _karmaLabel),
          _KarmaHistoryTab(history: _history),
          _PenaltyTab(penalties: _penalties),
        ],
      ),
    );
  }
}

// ---- My Karma Tab ----
class _MyKarmaTab extends StatelessWidget {
  final int karma;
  final Color karmaColor;
  final String karmaLabel;

  const _MyKarmaTab({
    required this.karma,
    required this.karmaColor,
    required this.karmaLabel,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Karma circle
          GBoostGradientCard(
            gradient: LinearGradient(
              colors: [
                karmaColor.withOpacity(0.15),
                AppColors.cardBackground,
              ],
            ),
            child: Column(
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 130,
                      height: 130,
                      child: CircularProgressIndicator(
                        value: karma / 100,
                        strokeWidth: 10,
                        backgroundColor: AppColors.cardBorder,
                        color: karmaColor,
                        strokeCap: StrokeCap.round,
                      ),
                    ),
                    Column(
                      children: [
                        Text(
                          '$karma',
                          style: TextStyle(
                            color: karmaColor,
                            fontSize: 38,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '/100',
                          style: const TextStyle(
                              color: AppColors.textGray, fontSize: 14),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  karmaLabel,
                  style: TextStyle(
                    color: karmaColor,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  karma >= 80
                      ? "Ajoyib! Siz ishonchli foydalanuvchisiz 🏆"
                      : karma >= 40
                          ? "Yaxshi, lekin yaxshilanish mumkin 📈"
                          : "Ehtiyot bo'ling! Tez orada ban bo'lishi mumkin ⚠️",
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: AppColors.textGray, fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Karma levels explanation
          const _SectionTitle(text: 'Karma darajalari'),
          const SizedBox(height: 12),
          ...[
            {'min': 80, 'max': 100, 'label': 'Yuqori', 'color': AppColors.green,
              'perks': ['Prioritet buyurtmalar', 'Tasdiqlanganlik belgisi', 'Past komissiya']},
            {'min': 40, 'max': 79, 'label': "O'rtacha", 'color': AppColors.gold,
              'perks': ['Standart buyurtmalar', "Oddiy ko'rinish"]},
            {'min': 0, 'max': 39, 'label': 'Past', 'color': AppColors.red,
              'perks': ['Buyurtma cheklovi', 'Ban xavfi', 'Past ko\'rinish']},
          ].map((level) {
            final color = level['color'] as Color;
            final isActive = karma >= (level['min'] as int) &&
                karma <= (level['max'] as int);
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GBoostCard(
                borderColor: isActive ? color : AppColors.cardBorder,
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          '${level['min']}-${level['max']}',
                          style: TextStyle(
                              color: color,
                              fontWeight: FontWeight.bold,
                              fontSize: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                level['label'] as String,
                                style: TextStyle(
                                    color: color,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14),
                              ),
                              if (isActive) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: color.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    'Siz',
                                    style: TextStyle(
                                        color: color, fontSize: 10),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 4),
                          Wrap(
                            spacing: 4,
                            children: (level['perks'] as List<String>)
                                .map((p) => Text(
                                      '• $p',
                                      style: const TextStyle(
                                          color: AppColors.textGray,
                                          fontSize: 11),
                                    ))
                                .toList(),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),

          const SizedBox(height: 10),

          // AI karma description
          GBoostCard(
            borderColor: AppColors.purple.withOpacity(0.3),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Row(
                  children: [
                    Text('🤖', style: TextStyle(fontSize: 20)),
                    SizedBox(width: 8),
                    Text(
                      'AI Karma Moduli',
                      style: TextStyle(
                          color: AppColors.purple,
                          fontWeight: FontWeight.bold,
                          fontSize: 14),
                    ),
                  ],
                ),
                SizedBox(height: 10),
                Text(
                  "GBoost AI tizimi har bir tranzaksiyani kuzatib boradi. Foydalanuvchi shikoyat bergach, AI xatti-harakatni tahlil qiladi, moderator qarorni tasdiqlaydi va karma avtomatik yangilanadi.",
                  style: TextStyle(
                      color: AppColors.textGray,
                      fontSize: 12,
                      height: 1.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---- Karma History ----
class _KarmaHistoryTab extends StatelessWidget {
  final List<Map<String, dynamic>> history;
  const _KarmaHistoryTab({required this.history});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: history.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final h = history[i];
        final isGain = h['type'] == 'gain';
        final color = isGain ? AppColors.green : AppColors.red;
        return GBoostCard(
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Icon(
                    isGain
                        ? Icons.trending_up_rounded
                        : Icons.trending_down_rounded,
                    color: color,
                    size: 22,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      h['reason'],
                      style: const TextStyle(
                          color: AppColors.textLight,
                          fontSize: 13,
                          fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      h['date'],
                      style: const TextStyle(
                          color: AppColors.textGray, fontSize: 11),
                    ),
                  ],
                ),
              ),
              Text(
                '${isGain ? '+' : ''}${h['points']}',
                style: TextStyle(
                    color: color,
                    fontSize: 18,
                    fontWeight: FontWeight.bold),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ---- Penalty Tab ----
class _PenaltyTab extends StatelessWidget {
  final List<Map<String, dynamic>> penalties;
  const _PenaltyTab({required this.penalties});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GBoostGradientCard(
            gradient: const LinearGradient(
              colors: [Color(0xFF200A0A), Color(0xFF0D0D1A)],
            ),
            child: Column(
              children: const [
                Text('⚠️', style: TextStyle(fontSize: 36)),
                SizedBox(height: 8),
                Text(
                  'Jazo tizimi qanday ishlaydi?',
                  style: TextStyle(
                      color: AppColors.red,
                      fontSize: 16,
                      fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 6),
                Text(
                  'Foydalanuvchi shikoyat beradi → AI tahlil qiladi → Moderator tasdiqlaydi → Jazo qo\'llaniladi',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: AppColors.textGray, fontSize: 12, height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          ...penalties.map((p) {
            final color = Color(p['color'] as int);
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: GBoostCard(
                borderColor: color.withOpacity(0.4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p['icon'],
                        style: const TextStyle(fontSize: 28)),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                p['level'],
                                style: TextStyle(
                                    color: color,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: color.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  p['action'],
                                  style: TextStyle(
                                      color: color,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            p['desc'],
                            style: const TextStyle(
                                color: AppColors.textGray,
                                fontSize: 12,
                                height: 1.4),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(Icons.star_outline,
                                  color: AppColors.textGray, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                'Karma: ${p['karmaChange']}',
                                style: TextStyle(
                                    color: color,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),

          const SizedBox(height: 8),

          // Good behavior tip
          GBoostCard(
            borderColor: AppColors.green.withOpacity(0.3),
            child: const Row(
              children: [
                Text('💡', style: TextStyle(fontSize: 22)),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    "Karma oshirish uchun: buyurtmalarni vaqtida bajaring, muloqotda hurmatli bo'ling va hech qachon firibgarlik qilmang!",
                    style: TextStyle(
                        color: AppColors.textGray,
                        fontSize: 12,
                        height: 1.5),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle({required this.text});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        text,
        style: const TextStyle(
            color: AppColors.textWhite,
            fontSize: 16,
            fontWeight: FontWeight.bold),
      ),
    );
  }
}
