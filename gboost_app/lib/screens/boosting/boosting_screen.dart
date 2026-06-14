import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_constants.dart';
import '../../widgets/gboost_card.dart';
import 'order_form_screen.dart';

class BoostingScreen extends StatefulWidget {
  const BoostingScreen({super.key});

  @override
  State<BoostingScreen> createState() => _BoostingScreenState();
}

class _BoostingScreenState extends State<BoostingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _selectedGame = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
        length: AppConstants.serviceTypes.length, vsync: this);
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
      appBar: AppBar(
        title: const Text('Boosting Xizmati'),
        bottom: TabBar(
          controller: _tabController,
          tabs: AppConstants.serviceTypes
              .map((s) => Tab(text: s['name']))
              .toList(),
          labelStyle: const TextStyle(
              fontSize: 12, fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontSize: 12),
          indicatorColor: AppColors.cyan,
          labelColor: AppColors.cyan,
          unselectedLabelColor: AppColors.textGray,
          tabAlignment: TabAlignment.fill,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: AppConstants.serviceTypes.map((service) {
          return _ServiceTab(
            service: service,
            selectedGame: _selectedGame,
            onGameSelected: (i) => setState(() => _selectedGame = i),
          );
        }).toList(),
      ),
    );
  }
}

class _ServiceTab extends StatelessWidget {
  final Map<String, String> service;
  final int selectedGame;
  final ValueChanged<int> onGameSelected;

  const _ServiceTab({
    required this.service,
    required this.selectedGame,
    required this.onGameSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Service info banner
          GBoostCard(
            borderColor: AppColors.cyan.withOpacity(0.3),
            child: Row(
              children: [
                Text(service['icon']!,
                    style: const TextStyle(fontSize: 32)),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        service['name']!,
                        style: const TextStyle(
                          color: AppColors.cyan,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        service['desc']!,
                        style: const TextStyle(
                          color: AppColors.textGray,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // Game selection
          const Text(
            "O'yin tanlang",
            style: TextStyle(
              color: AppColors.textWhite,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ...List.generate(AppConstants.games.length, (i) {
            final game = AppConstants.games[i];
            final color = Color(game['color'] as int);
            final isSelected = selectedGame == i;
            return GestureDetector(
              onTap: () => onGameSelected(i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isSelected
                      ? color.withOpacity(0.12)
                      : AppColors.cardBackground,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected
                        ? color
                        : AppColors.cardBorder,
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Text(game['icon']!,
                        style: const TextStyle(fontSize: 28)),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            game['name'],
                            style: TextStyle(
                              color: isSelected
                                  ? color
                                  : AppColors.textWhite,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            '${(game['ranks'] as List).length} rank darajasi',
                            style: const TextStyle(
                              color: AppColors.textGray,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isSelected)
                      Icon(Icons.check_circle_rounded,
                          color: color, size: 22)
                    else
                      const Icon(Icons.arrow_forward_ios,
                          color: AppColors.textGray, size: 14),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 20),

          // Continue button
          GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => OrderFormScreen(
                  gameIndex: selectedGame,
                  serviceType: service['id']!,
                ),
              ),
            ),
            child: Container(
              height: 52,
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.cyan.withOpacity(0.25),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Center(
                child: Text(
                  'Davom etish →',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }
}
