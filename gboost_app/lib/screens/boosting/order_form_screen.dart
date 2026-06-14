import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_constants.dart';
import '../../widgets/gboost_card.dart';
import '../../widgets/gboost_button.dart';
import 'order_confirm_screen.dart';

class OrderFormScreen extends StatefulWidget {
  final int gameIndex;
  final String serviceType;

  const OrderFormScreen({
    super.key,
    required this.gameIndex,
    required this.serviceType,
  });

  @override
  State<OrderFormScreen> createState() => _OrderFormScreenState();
}

class _OrderFormScreenState extends State<OrderFormScreen> {
  int _fromRankIndex = 0;
  int _toRankIndex = 2;
  String _selectedPayment = 'humo';

  Map<String, dynamic> get _game =>
      AppConstants.games[widget.gameIndex];

  List<String> get _ranks =>
      (_game['ranks'] as List).cast<String>();

  double get _basePrice =>
      AppConstants.basePrices[_game['id']] ?? 50000;

  double get _calculatedPrice {
    final diff = (_toRankIndex - _fromRankIndex).clamp(0, 999);
    double price = _basePrice * diff;
    if (widget.serviceType == 'duo') price *= 0.8;
    if (widget.serviceType == 'coaching') price = _basePrice * 2;
    return price < _basePrice ? _basePrice : price;
  }

  double get _commission => _calculatedPrice * AppConstants.commissionRate;
  double get _totalPrice => _calculatedPrice + _commission;

  String _formatPrice(double p) {
    return p.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
  }

  @override
  Widget build(BuildContext context) {
    final gameColor = Color(_game['color'] as int);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('${_game['shortName']} Boosting'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Game header
            GBoostGradientCard(
              gradient: LinearGradient(
                colors: [
                  gameColor.withOpacity(0.25),
                  AppColors.cardBackground,
                ],
              ),
              child: Row(
                children: [
                  Text(_game['icon']!,
                      style: const TextStyle(fontSize: 40)),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _game['name'],
                        style: const TextStyle(
                          color: AppColors.textWhite,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _serviceLabel,
                        style: TextStyle(
                          color: gameColor,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Rank selector
            Row(
              children: [
                // FROM rank
                Expanded(
                  child: _RankSelector(
                    label: 'Hozirgi Rank',
                    labelColor: AppColors.red,
                    ranks: _ranks,
                    selectedIndex: _fromRankIndex,
                    gameColor: gameColor,
                    onChanged: (i) {
                      setState(() {
                        _fromRankIndex = i;
                        if (_toRankIndex <= i) _toRankIndex = i + 1;
                      });
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 20),
                  child: Column(
                    children: [
                      const Icon(Icons.arrow_forward_rounded,
                          color: AppColors.cyan, size: 28),
                      const SizedBox(height: 4),
                      Text(
                        '+${(_toRankIndex - _fromRankIndex)} rank',
                        style: const TextStyle(
                          color: AppColors.cyan,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                // TO rank
                Expanded(
                  child: _RankSelector(
                    label: 'Maqsad Rank',
                    labelColor: AppColors.green,
                    ranks: _ranks,
                    selectedIndex: _toRankIndex,
                    gameColor: AppColors.green,
                    onChanged: (i) {
                      if (i > _fromRankIndex) {
                        setState(() => _toRankIndex = i);
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Price calculator
            GBoostCard(
              borderColor: AppColors.gold.withOpacity(0.3),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Text('💰',
                          style: TextStyle(fontSize: 18)),
                      SizedBox(width: 8),
                      Text(
                        'Narx Kalkulyatori',
                        style: TextStyle(
                          color: AppColors.gold,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(color: AppColors.cardBorder),
                  const SizedBox(height: 10),
                  _PriceRow(
                    label: 'Boosting narxi',
                    value: '${_formatPrice(_calculatedPrice)} so\'m',
                    color: AppColors.textLight,
                  ),
                  const SizedBox(height: 8),
                  _PriceRow(
                    label:
                        'GBoost komissiyasi (${(AppConstants.commissionRate * 100).toInt()}%)',
                    value: '${_formatPrice(_commission)} so\'m',
                    color: AppColors.textGray,
                  ),
                  const SizedBox(height: 10),
                  const Divider(color: AppColors.cardBorder),
                  const SizedBox(height: 8),
                  _PriceRow(
                    label: 'Jami',
                    value: '${_formatPrice(_totalPrice)} so\'m',
                    color: AppColors.gold,
                    isBold: true,
                    fontSize: 16,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Payment method
            const Text(
              "To'lov usuli",
              style: TextStyle(
                color: AppColors.textWhite,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _PaymentMethods(
              selected: _selectedPayment,
              onChanged: (v) => setState(() => _selectedPayment = v),
            ),
            const SizedBox(height: 24),

            // Escrow notice
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.green.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: AppColors.green.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Text('🛡️', style: TextStyle(fontSize: 20)),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      "To'lov 3 kun Escrow himoyasida saqlanadi. Boosting tugagach avtomatik o'tkaziladi.",
                      style: TextStyle(
                        color: AppColors.textGray,
                        fontSize: 11,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            GBoostButton(
              label: "Buyurtma berish — ${_formatPrice(_totalPrice)} so'm",
              gradient: AppColors.primaryGradient,
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => OrderConfirmScreen(
                    game: _game,
                    fromRank: _ranks[_fromRankIndex],
                    toRank: _ranks[_toRankIndex],
                    serviceType: _serviceLabel,
                    totalPrice: _totalPrice,
                    paymentMethod: _selectedPayment,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  String get _serviceLabel {
    switch (widget.serviceType) {
      case 'solo':
        return 'Solo Boosting';
      case 'duo':
        return 'Duo Boosting';
      case 'coaching':
        return 'Coaching';
      default:
        return 'Boosting';
    }
  }
}

// ---- Rank Selector ----
class _RankSelector extends StatelessWidget {
  final String label;
  final Color labelColor;
  final List<String> ranks;
  final int selectedIndex;
  final Color gameColor;
  final ValueChanged<int> onChanged;

  const _RankSelector({
    required this.label,
    required this.labelColor,
    required this.ranks,
    required this.selectedIndex,
    required this.gameColor,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: labelColor,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () => _showRankPicker(context),
          child: Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              color: gameColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: gameColor.withOpacity(0.4)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    ranks[selectedIndex],
                    style: TextStyle(
                      color: gameColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
                Icon(Icons.expand_more,
                    color: gameColor, size: 18),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showRankPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.cardBackground,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.cardBorder,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textWhite,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 12),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: ranks.length,
              itemBuilder: (_, i) {
                final isSelected = i == selectedIndex;
                return ListTile(
                  title: Text(
                    ranks[i],
                    style: TextStyle(
                      color: isSelected
                          ? gameColor
                          : AppColors.textLight,
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                  trailing: isSelected
                      ? Icon(Icons.check, color: gameColor)
                      : null,
                  onTap: () {
                    onChanged(i);
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

// ---- Price Row ----
class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool isBold;
  final double fontSize;

  const _PriceRow({
    required this.label,
    required this.value,
    required this.color,
    this.isBold = false,
    this.fontSize = 13,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: AppColors.textGray,
            fontSize: fontSize,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: fontSize,
            fontWeight:
                isBold ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

// ---- Payment Methods ----
class _PaymentMethods extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onChanged;

  const _PaymentMethods(
      {required this.selected, required this.onChanged});

  static const List<Map<String, String>> _methods = [
    {'id': 'humo', 'name': 'Humo', 'icon': '💳'},
    {'id': 'uzcard', 'name': 'Uzcard', 'icon': '💳'},
    {'id': 'click', 'name': 'Click', 'icon': '📱'},
    {'id': 'payme', 'name': 'Payme', 'icon': '📲'},
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: _methods
          .map(
            (m) => Expanded(
              child: GestureDetector(
                onTap: () => onChanged(m['id']!),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(
                      vertical: 10, horizontal: 4),
                  decoration: BoxDecoration(
                    color: selected == m['id']
                        ? AppColors.cyan.withOpacity(0.12)
                        : AppColors.cardBackground,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: selected == m['id']
                          ? AppColors.cyan
                          : AppColors.cardBorder,
                      width: selected == m['id'] ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(m['icon']!,
                          style: const TextStyle(fontSize: 20)),
                      const SizedBox(height: 4),
                      Text(
                        m['name']!,
                        style: TextStyle(
                          color: selected == m['id']
                              ? AppColors.cyan
                              : AppColors.textGray,
                          fontSize: 10,
                          fontWeight: selected == m['id']
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}
