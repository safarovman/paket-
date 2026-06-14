import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../widgets/gboost_card.dart';
import '../../widgets/gboost_button.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedFilter = 'all';

  final List<Map<String, dynamic>> _accounts = [
    {
      'id': '1',
      'game': 'MLBB',
      'icon': '🗡️',
      'rank': 'Mythic Glory',
      'winRate': 68,
      'matches': 1240,
      'price': 850000,
      'type': 'sale',
      'seller': 'StarPlayer',
      'karma': 92,
      'heroes': 87,
      'color': 0xFF00E5FF,
      'verified': true,
    },
    {
      'id': '2',
      'game': 'PUBG Mobile',
      'icon': '🎯',
      'rank': 'Conqueror',
      'winRate': 72,
      'matches': 980,
      'price': 1200000,
      'type': 'sale',
      'seller': 'TopSniper',
      'karma': 88,
      'heroes': 0,
      'color': 0xFFFFD600,
      'verified': true,
    },
    {
      'id': '3',
      'game': 'MLBB',
      'icon': '🗡️',
      'rank': 'Legend',
      'winRate': 58,
      'matches': 620,
      'price': 80000,
      'type': 'rent',
      'seller': 'MLBBPro',
      'karma': 85,
      'heroes': 54,
      'color': 0xFF00E5FF,
      'verified': false,
    },
    {
      'id': '4',
      'game': 'CS2',
      'icon': '💣',
      'rank': 'Global Elite',
      'winRate': 65,
      'matches': 2100,
      'price': 2500000,
      'type': 'sale',
      'seller': 'CSMaster',
      'karma': 97,
      'heroes': 0,
      'color': 0xFF6C3FB5,
      'verified': true,
    },
    {
      'id': '5',
      'game': 'Free Fire',
      'icon': '🔥',
      'rank': 'Grandmaster',
      'winRate': 61,
      'matches': 780,
      'price': 350000,
      'type': 'sale',
      'seller': 'FireKing',
      'karma': 80,
      'heroes': 0,
      'color': 0xFFFF8C00,
      'verified': false,
    },
  ];

  List<Map<String, dynamic>> get _filtered {
    if (_selectedFilter == 'all') return _accounts;
    return _accounts
        .where((a) => a['type'] == _selectedFilter)
        .toList();
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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
        title: const Text('Akkaunt Bozori'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: AppColors.cyan),
            onPressed: () => _showSellSheet(context),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Barcha akkauntlar'),
            Tab(text: "Mening ro'yxatlarim"),
          ],
          indicatorColor: AppColors.cyan,
          labelColor: AppColors.cyan,
          unselectedLabelColor: AppColors.textGray,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // All accounts tab
          Column(
            children: [
              // Filters
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    _FilterChip(
                        label: 'Barchasi',
                        value: 'all',
                        selected: _selectedFilter,
                        onTap: () =>
                            setState(() => _selectedFilter = 'all')),
                    const SizedBox(width: 8),
                    _FilterChip(
                        label: '🛒 Sotish',
                        value: 'sale',
                        selected: _selectedFilter,
                        onTap: () =>
                            setState(() => _selectedFilter = 'sale')),
                    const SizedBox(width: 8),
                    _FilterChip(
                        label: '🔄 Ijara',
                        value: 'rent',
                        selected: _selectedFilter,
                        onTap: () =>
                            setState(() => _selectedFilter = 'rent')),
                  ],
                ),
              ),
              // List
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) => _AccountCard(
                    account: _filtered[i],
                    onTap: () => _showAccountDetail(context, _filtered[i]),
                    formatPrice: _formatPrice,
                  ),
                ),
              ),
            ],
          ),

          // My listings tab
          _MyListings(),
        ],
      ),
    );
  }

  void _showSellSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.cardBackground,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: const _SellAccountSheet(),
      ),
    );
  }

  void _showAccountDetail(
      BuildContext context, Map<String, dynamic> account) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AccountDetailScreen(account: account),
      ),
    );
  }
}

// ---- Account Card ----
class _AccountCard extends StatelessWidget {
  final Map<String, dynamic> account;
  final VoidCallback onTap;
  final String Function(int) formatPrice;

  const _AccountCard(
      {required this.account,
      required this.onTap,
      required this.formatPrice});

  @override
  Widget build(BuildContext context) {
    final color = Color(account['color'] as int);
    final isRent = account['type'] == 'rent';

    return GestureDetector(
      onTap: onTap,
      child: GBoostCard(
        borderColor: color.withOpacity(0.3),
        child: Column(
          children: [
            Row(
              children: [
                // Icon
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(account['icon'],
                        style: const TextStyle(fontSize: 26)),
                  ),
                ),
                const SizedBox(width: 12),
                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            account['game'],
                            style: TextStyle(
                                color: color,
                                fontWeight: FontWeight.bold,
                                fontSize: 14),
                          ),
                          const SizedBox(width: 6),
                          if (account['verified'])
                            const Icon(Icons.verified,
                                color: AppColors.cyan, size: 14),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        account['rank'],
                        style: const TextStyle(
                            color: AppColors.textWhite,
                            fontWeight: FontWeight.w600,
                            fontSize: 13),
                      ),
                    ],
                  ),
                ),
                // Price + Type
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isRent
                            ? AppColors.gold.withOpacity(0.15)
                            : AppColors.green.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isRent ? '🔄 Ijara' : '🛒 Sotish',
                        style: TextStyle(
                          color:
                              isRent ? AppColors.gold : AppColors.green,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${formatPrice(account['price'])} so\'m',
                      style: const TextStyle(
                          color: AppColors.gold,
                          fontWeight: FontWeight.bold,
                          fontSize: 13),
                    ),
                    if (isRent)
                      const Text('/kun',
                          style: TextStyle(
                              color: AppColors.textGray, fontSize: 10)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 10),
            const Divider(color: AppColors.cardBorder, height: 1),
            const SizedBox(height: 10),
            // Stats row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _MiniStat(
                    label: 'Win Rate',
                    value: '${account['winRate']}%',
                    color: AppColors.green),
                _MiniStat(
                    label: "O'yinlar",
                    value: '${account['matches']}',
                    color: AppColors.textLight),
                if (account['heroes'] > 0)
                  _MiniStat(
                      label: 'Qahramonlar',
                      value: '${account['heroes']}',
                      color: AppColors.purple),
                Row(
                  children: [
                    const Icon(Icons.star_rounded,
                        color: AppColors.gold, size: 14),
                    const SizedBox(width: 3),
                    Text(
                      '${account['karma']} karma',
                      style: const TextStyle(
                          color: AppColors.gold, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MiniStat(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 13)),
        Text(label,
            style: const TextStyle(
                color: AppColors.textGray, fontSize: 10)),
      ],
    );
  }
}

// ---- Filter Chip ----
class _FilterChip extends StatelessWidget {
  final String label;
  final String value;
  final String selected;
  final VoidCallback onTap;

  const _FilterChip(
      {required this.label,
      required this.value,
      required this.selected,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isSelected = value == selected;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.cyan.withOpacity(0.15)
              : AppColors.cardBackground,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color:
                isSelected ? AppColors.cyan : AppColors.cardBorder,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? AppColors.cyan : AppColors.textGray,
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

// ---- My Listings ----
class _MyListings extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('🏪', style: TextStyle(fontSize: 52)),
          const SizedBox(height: 16),
          const Text(
            "Hozircha ro'yxatingiz yo'q",
            style: TextStyle(
                color: AppColors.textWhite,
                fontSize: 16,
                fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            "Akkauntingizni sotish yoki ijaraga qo'yish uchun quyidagi tugmani bosing",
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textGray, fontSize: 13),
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: GBoostButton(
              label: "Akkaunt qo'shish",
              gradient: AppColors.primaryGradient,
              icon: Icons.add,
              onPressed: () {},
            ),
          ),
        ],
      ),
    );
  }
}

// ---- Sell Account Sheet ----
class _SellAccountSheet extends StatelessWidget {
  const _SellAccountSheet();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.cardBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text("Akkaunt qo'shish",
              style: TextStyle(
                  color: AppColors.textWhite,
                  fontSize: 18,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          const Text("Akkaunt turi",
              style: TextStyle(
                  color: AppColors.textGray, fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _TypeOption(
                    icon: '🛒', label: 'Sotish', color: AppColors.green),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _TypeOption(
                    icon: '🔄', label: 'Ijara', color: AppColors.gold),
              ),
            ],
          ),
          const SizedBox(height: 20),
          GBoostButton(
            label: 'Davom etish',
            gradient: AppColors.primaryGradient,
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}

class _TypeOption extends StatelessWidget {
  final String icon;
  final String label;
  final Color color;

  const _TypeOption(
      {required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 8),
          Text(label,
              style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 14)),
        ],
      ),
    );
  }
}

// ---- Account Detail Screen ----
class AccountDetailScreen extends StatelessWidget {
  final Map<String, dynamic> account;

  const AccountDetailScreen({super.key, required this.account});

  String _formatPrice(int p) => p
      .toString()
      .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');

  @override
  Widget build(BuildContext context) {
    final color = Color(account['color'] as int);
    final isRent = account['type'] == 'rent';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('${account['game']} Akkaunt'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Header
            GBoostGradientCard(
              gradient: LinearGradient(
                colors: [color.withOpacity(0.2), AppColors.cardBackground],
              ),
              child: Row(
                children: [
                  Text(account['icon'],
                      style: const TextStyle(fontSize: 52)),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(account['game'],
                                style: TextStyle(
                                    color: color,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16)),
                            if (account['verified']) ...[
                              const SizedBox(width: 6),
                              const Icon(Icons.verified,
                                  color: AppColors.cyan, size: 16),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(account['rank'],
                            style: const TextStyle(
                                color: AppColors.textWhite,
                                fontSize: 20,
                                fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Stats
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.4,
              children: [
                _DetailStat(
                    label: 'Win Rate',
                    value: '${account['winRate']}%',
                    color: AppColors.green),
                _DetailStat(
                    label: "O'yinlar",
                    value: '${account['matches']}',
                    color: AppColors.cyan),
                _DetailStat(
                    label: 'Karma',
                    value: '${account['karma']}',
                    color: AppColors.gold),
              ],
            ),
            const SizedBox(height: 14),

            // Seller info
            GBoostCard(
              child: Row(
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
                        account['seller'][0],
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 20),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(account['seller'],
                            style: const TextStyle(
                                color: AppColors.textWhite,
                                fontWeight: FontWeight.bold)),
                        Text('Sotuvchi',
                            style: const TextStyle(
                                color: AppColors.textGray, fontSize: 12)),
                      ],
                    ),
                  ),
                  KarmaBadge(karma: account['karma']),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Price + CTA
            GBoostCard(
              borderColor: AppColors.gold.withOpacity(0.4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isRent ? 'Ijara narxi' : 'Sotish narxi',
                        style: const TextStyle(
                            color: AppColors.textGray, fontSize: 12),
                      ),
                      Text(
                        "${_formatPrice(account['price'])} so'm",
                        style: const TextStyle(
                            color: AppColors.gold,
                            fontSize: 22,
                            fontWeight: FontWeight.bold),
                      ),
                      if (isRent)
                        const Text('kunlik',
                            style: TextStyle(
                                color: AppColors.textGray, fontSize: 11)),
                    ],
                  ),
                  GBoostButton(
                    label: isRent ? 'Ijaraga olish' : 'Sotib olish',
                    gradient: AppColors.primaryGradient,
                    onPressed: () =>
                        Navigator.pushNamed(context, '/escrow'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _DetailStat(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value,
              style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 16)),
          const SizedBox(height: 3),
          Text(label,
              style: const TextStyle(
                  color: AppColors.textGray, fontSize: 10)),
        ],
      ),
    );
  }
}
