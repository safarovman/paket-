import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../widgets/gboost_card.dart';
import '../../widgets/gboost_button.dart';

class EscrowScreen extends StatefulWidget {
  const EscrowScreen({super.key});

  @override
  State<EscrowScreen> createState() => _EscrowScreenState();
}

class _EscrowScreenState extends State<EscrowScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<Map<String, dynamic>> _activeEscrows = [
    {
      'id': 'ESC-001',
      'type': 'boosting',
      'title': 'MLBB Solo Boosting',
      'from': 'Epic',
      'to': 'Legend',
      'amount': 138000,
      'status': 'in_progress',
      'daysLeft': 2,
      'buyer': 'Abdulloh K.',
      'seller': 'ProGamer99',
      'startDate': '2024-01-15',
    },
    {
      'id': 'ESC-002',
      'type': 'account',
      'title': 'PUBG Mobile Akkaunt',
      'from': 'Conqueror',
      'to': '',
      'amount': 1200000,
      'status': 'waiting',
      'daysLeft': 3,
      'buyer': 'Jasur M.',
      'seller': 'TopSniper',
      'startDate': '2024-01-14',
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

  String _formatPrice(int p) => p
      .toString()
      .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Escrow Tizimi'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Faol'),
            Tab(text: 'Tarix'),
            Tab(text: "Qanday ishlaydi?"),
          ],
          indicatorColor: AppColors.green,
          labelColor: AppColors.green,
          unselectedLabelColor: AppColors.textGray,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Active escrows
          _activeEscrows.isEmpty
              ? _EmptyEscrow()
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _activeEscrows.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) => _EscrowCard(
                    escrow: _activeEscrows[i],
                    formatPrice: _formatPrice,
                    onApprove: () => _showApproveDialog(context, _activeEscrows[i]),
                    onDispute: () => _showDisputeDialog(context, _activeEscrows[i]),
                  ),
                ),

          // History
          _HistoryTab(formatPrice: _formatPrice),

          // How it works
          _HowItWorks(),
        ],
      ),
    );
  }

  void _showApproveDialog(BuildContext ctx, Map<String, dynamic> escrow) {
    showDialog(
      context: ctx,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.cardBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text("Tasdiqlash",
            style: TextStyle(color: AppColors.textWhite)),
        content: Text(
          "Haqiqatan ham ${_formatPrice(escrow['amount'])} so'mni sotuvchiga o'tkazmoqchimisiz?",
          style: const TextStyle(color: AppColors.textGray),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Yo'q",
                style: TextStyle(color: AppColors.textGray)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(ctx).showSnackBar(
                const SnackBar(
                  content: Text("✅ Pul muvaffaqiyatli o'tkazildi!"),
                  backgroundColor: AppColors.green,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.green),
            child: const Text("Ha, tasdiqlash"),
          ),
        ],
      ),
    );
  }

  void _showDisputeDialog(BuildContext ctx, Map<String, dynamic> escrow) {
    showDialog(
      context: ctx,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.cardBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text("Shikoyat berish",
            style: TextStyle(color: AppColors.textWhite)),
        content: const Text(
          "Moderator tekshiradi va qaror qiladi. Muammo tasdiqlansa pul qaytariladi.",
          style: TextStyle(color: AppColors.textGray),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Bekor qilish",
                style: TextStyle(color: AppColors.textGray)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(ctx).showSnackBar(
                const SnackBar(
                  content: Text("⚠️ Shikoyat moderatorga yuborildi!"),
                  backgroundColor: AppColors.gold,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.red),
            child: const Text("Shikoyat berish"),
          ),
        ],
      ),
    );
  }
}

// ---- Escrow Card ----
class _EscrowCard extends StatelessWidget {
  final Map<String, dynamic> escrow;
  final String Function(int) formatPrice;
  final VoidCallback onApprove;
  final VoidCallback onDispute;

  const _EscrowCard({
    required this.escrow,
    required this.formatPrice,
    required this.onApprove,
    required this.onDispute,
  });

  Color get _statusColor {
    switch (escrow['status']) {
      case 'in_progress': return AppColors.cyan;
      case 'waiting':     return AppColors.gold;
      case 'completed':   return AppColors.green;
      default:            return AppColors.textGray;
    }
  }

  String get _statusLabel {
    switch (escrow['status']) {
      case 'in_progress': return '⚔️ Jarayonda';
      case 'waiting':     return '⏳ Kutilmoqda';
      case 'completed':   return '✅ Tugadi';
      default:            return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return GBoostCard(
      borderColor: _statusColor.withOpacity(0.4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    escrow['title'],
                    style: const TextStyle(
                        color: AppColors.textWhite,
                        fontWeight: FontWeight.bold,
                        fontSize: 14),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    escrow['id'],
                    style: const TextStyle(
                        color: AppColors.textGray, fontSize: 11),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _statusLabel,
                  style: TextStyle(
                      color: _statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: AppColors.cardBorder, height: 1),
          const SizedBox(height: 12),

          // Escrow progress
          Row(
            children: [
              _EscrowParty(
                  label: 'Xaridor', name: escrow['buyer'], icon: '👤'),
              Expanded(
                child: Column(
                  children: [
                    const Icon(Icons.arrow_forward_rounded,
                        color: AppColors.green, size: 20),
                    Text(
                      "${escrow['daysLeft']} kun qoldi",
                      style: const TextStyle(
                          color: AppColors.gold, fontSize: 10),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.green.withOpacity(0.15),
                  border: Border.all(color: AppColors.green.withOpacity(0.4)),
                ),
                child: const Text('🛡️', style: TextStyle(fontSize: 18)),
              ),
              Expanded(
                child: Column(
                  children: [
                    const Icon(Icons.arrow_forward_rounded,
                        color: AppColors.green, size: 20),
                    Text(
                      "${formatPrice(escrow['amount'])} so'm",
                      style: const TextStyle(
                          color: AppColors.green, fontSize: 10),
                    ),
                  ],
                ),
              ),
              _EscrowParty(
                  label: 'Sotuvchi',
                  name: escrow['seller'],
                  icon: '⚔️'),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: AppColors.cardBorder, height: 1),
          const SizedBox(height: 12),

          // Days progress bar
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Escrow muddati',
                      style: TextStyle(
                          color: AppColors.textGray, fontSize: 12)),
                  Text(
                    "${escrow['daysLeft']}/3 kun qoldi",
                    style: const TextStyle(
                        color: AppColors.cyan, fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: (3 - escrow['daysLeft']) / 3,
                  backgroundColor: AppColors.cardBorder,
                  color: _statusColor,
                  minHeight: 6,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Action buttons
          Row(
            children: [
              Expanded(
                child: GBoostButton(
                  label: '✅ Tasdiqlash',
                  color: AppColors.green,
                  height: 42,
                  onPressed: onApprove,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GBoostButton(
                  label: '⚠️ Shikoyat',
                  color: AppColors.red,
                  height: 42,
                  onPressed: onDispute,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EscrowParty extends StatelessWidget {
  final String label;
  final String name;
  final String icon;

  const _EscrowParty(
      {required this.label, required this.name, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(icon, style: const TextStyle(fontSize: 22)),
        const SizedBox(height: 3),
        Text(name,
            style: const TextStyle(
                color: AppColors.textWhite,
                fontSize: 11,
                fontWeight: FontWeight.bold)),
        Text(label,
            style: const TextStyle(
                color: AppColors.textGray, fontSize: 10)),
      ],
    );
  }
}

// ---- History Tab ----
class _HistoryTab extends StatelessWidget {
  final String Function(int) formatPrice;

  const _HistoryTab({required this.formatPrice});

  static const List<Map<String, dynamic>> _history = [
    {
      'title': 'MLBB Duo Boosting',
      'amount': 96000,
      'status': 'completed',
      'date': '10 Yanvar 2024',
    },
    {
      'title': 'PUBG Solo Boosting',
      'amount': 72000,
      'status': 'completed',
      'date': '5 Yanvar 2024',
    },
    {
      'title': 'Free Fire Akkaunt',
      'amount': 350000,
      'status': 'refunded',
      'date': '1 Yanvar 2024',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _history.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final h = _history[i];
        final isRefunded = h['status'] == 'refunded';
        return GBoostCard(
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isRefunded
                      ? AppColors.red.withOpacity(0.12)
                      : AppColors.green.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Icon(
                    isRefunded
                        ? Icons.undo_rounded
                        : Icons.check_circle_outline,
                    color: isRefunded ? AppColors.red : AppColors.green,
                    size: 22,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(h['title'],
                        style: const TextStyle(
                            color: AppColors.textWhite,
                            fontWeight: FontWeight.bold,
                            fontSize: 13)),
                    const SizedBox(height: 3),
                    Text(h['date'],
                        style: const TextStyle(
                            color: AppColors.textGray, fontSize: 11)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    "${formatPrice(h['amount'])} so'm",
                    style: TextStyle(
                        color:
                            isRefunded ? AppColors.red : AppColors.green,
                        fontWeight: FontWeight.bold,
                        fontSize: 13),
                  ),
                  Text(
                    isRefunded ? 'Qaytarildi' : 'Tugadi',
                    style: TextStyle(
                        color: isRefunded
                            ? AppColors.red
                            : AppColors.green,
                        fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

// ---- How it works ----
class _HowItWorks extends StatelessWidget {
  static const List<Map<String, dynamic>> _steps = [
    {
      'num': '1',
      'icon': '💰',
      'title': "To'lov Muzlatiladi",
      'desc': "Xaridor to'laydi — pul GBoost tranzit hamyonida qulflangan holda saqlanadi.",
      'color': 0xFF00E5FF,
    },
    {
      'num': '2',
      'icon': '⚔️',
      'title': 'Akkaunt Topshiriladi',
      'desc': "Sotuvchi akkaunt login/parolini xaridorga darhol beradi — hech qanday kutish yo'q.",
      'color': 0xFF6C3FB5,
    },
    {
      'num': '3',
      'icon': '🔍',
      'title': '3 Kun Tekshiruv',
      'desc': "Xaridor akkauntni sinab ko'radi, shikoyat bo'lmasa pul avtomatik sotuvchiga o'tadi.",
      'color': 0xFF00C853,
    },
    {
      'num': '4',
      'icon': '⚠️',
      'title': 'Muammo Chiqqanda',
      'desc': "Shikoyat bo'lsa moderator aralashadi, kerak bo'lsa pul xaridorga qaytariladi.",
      'color': 0xFFFF3D3D,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          GBoostGradientCard(
            gradient: const LinearGradient(
              colors: [Color(0xFF0A2010), Color(0xFF0D0D1A)],
            ),
            child: Column(
              children: [
                const Text('🛡️', style: TextStyle(fontSize: 40)),
                const SizedBox(height: 10),
                const Text(
                  '3 Kunlik Xavfsiz Savdo Tizimi',
                  style: TextStyle(
                      color: AppColors.green,
                      fontSize: 18,
                      fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Escrow — Xaridor va Sotuvchini ikkalasini ham himoya qiladi',
                  style: TextStyle(
                      color: AppColors.textGray, fontSize: 13, height: 1.4),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          ..._steps.asMap().entries.map((e) {
            final step = e.value;
            final color = Color(step['color'] as int);
            final isLast = e.key == _steps.length - 1;
            return Column(
              children: [
                GBoostCard(
                  borderColor: color.withOpacity(0.3),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.12),
                          shape: BoxShape.circle,
                          border: Border.all(color: color.withOpacity(0.4)),
                        ),
                        child: Center(
                          child: Text(step['icon'],
                              style: const TextStyle(fontSize: 20)),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 20,
                                  height: 20,
                                  decoration: BoxDecoration(
                                    color: color.withOpacity(0.2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      step['num'],
                                      style: TextStyle(
                                          color: color,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  step['title'],
                                  style: TextStyle(
                                      color: color,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              step['desc'],
                              style: const TextStyle(
                                  color: AppColors.textGray,
                                  fontSize: 12,
                                  height: 1.5),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                if (!isLast)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Icon(Icons.arrow_downward,
                        color: AppColors.textGray.withOpacity(0.4), size: 20),
                  ),
              ],
            );
          }),
        ],
      ),
    );
  }
}

class _EmptyEscrow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('🛡️', style: TextStyle(fontSize: 52)),
          SizedBox(height: 16),
          Text(
            'Faol Escrow yo\'q',
            style: TextStyle(
                color: AppColors.textWhite,
                fontSize: 16,
                fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              "Yangi buyurtma bergach, Escrow avtomatik yaratiladi",
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textGray, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
