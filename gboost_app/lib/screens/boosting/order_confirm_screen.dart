import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../widgets/gboost_button.dart';
import '../../widgets/gboost_card.dart';

class OrderConfirmScreen extends StatefulWidget {
  final Map<String, dynamic> game;
  final String fromRank;
  final String toRank;
  final String serviceType;
  final double totalPrice;
  final String paymentMethod;

  const OrderConfirmScreen({
    super.key,
    required this.game,
    required this.fromRank,
    required this.toRank,
    required this.serviceType,
    required this.totalPrice,
    required this.paymentMethod,
  });

  @override
  State<OrderConfirmScreen> createState() => _OrderConfirmScreenState();
}

class _OrderConfirmScreenState extends State<OrderConfirmScreen>
    with SingleTickerProviderStateMixin {
  bool _isPlaced = false;
  bool _isLoading = false;
  late AnimationController _checkAnim;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _checkAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _checkAnim, curve: Curves.elasticOut),
    );
  }

  @override
  void dispose() {
    _checkAnim.dispose();
    super.dispose();
  }

  String _formatPrice(double p) {
    return p.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
  }

  void _placeOrder() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      setState(() {
        _isLoading = false;
        _isPlaced = true;
      });
      _checkAnim.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isPlaced) return _SuccessScreen(animScale: _scaleAnim);

    final gameColor = Color(widget.game['color'] as int);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Buyurtmani tasdiqlash'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Order summary card
            GBoostCard(
              borderColor: gameColor.withOpacity(0.4),
              child: Column(
                children: [
                  Row(
                    children: [
                      Text(widget.game['icon']!,
                          style: const TextStyle(fontSize: 36)),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.game['name'],
                              style: const TextStyle(
                                color: AppColors.textWhite,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              widget.serviceType,
                              style: TextStyle(
                                color: gameColor,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: AppColors.cardBorder),
                  const SizedBox(height: 12),

                  // Rank progress
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _RankPill(
                          rank: widget.fromRank, color: AppColors.red),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Icon(Icons.arrow_forward_rounded,
                            color: AppColors.cyan, size: 24),
                      ),
                      _RankPill(
                          rank: widget.toRank, color: AppColors.green),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Details
                  _DetailRow(
                    icon: Icons.payment_outlined,
                    label: "To'lov usuli",
                    value: widget.paymentMethod.toUpperCase(),
                  ),
                  const SizedBox(height: 8),
                  _DetailRow(
                    icon: Icons.shield_outlined,
                    label: 'Himoya',
                    value: '3 kunlik Escrow',
                    valueColor: AppColors.green,
                  ),
                  const SizedBox(height: 8),
                  _DetailRow(
                    icon: Icons.access_time_outlined,
                    label: 'Taxminiy vaqt',
                    value: '12-24 soat',
                    valueColor: AppColors.gold,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Total price
            GBoostGradientCard(
              gradient: const LinearGradient(
                colors: [Color(0xFF1A1200), Color(0xFF1A0A00)],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Jami to\'lov:',
                    style: TextStyle(
                      color: AppColors.textGray,
                      fontSize: 15,
                    ),
                  ),
                  Text(
                    "${_formatPrice(widget.totalPrice)} so'm",
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Escrow explanation
            GBoostCard(
              borderColor: AppColors.green.withOpacity(0.3),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    '🛡️ Escrow qanday ishlaydi?',
                    style: TextStyle(
                      color: AppColors.green,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  SizedBox(height: 10),
                  _EscrowStep(
                      num: '1',
                      text: "To'lov GBoost hamyonida qulflangadi"),
                  SizedBox(height: 6),
                  _EscrowStep(
                      num: '2',
                      text: 'Booster buyurtmani bajaradi'),
                  SizedBox(height: 6),
                  _EscrowStep(
                      num: '3',
                      text:
                          "Siz 3 kun tekshirasiz — muammo bo'lmasa pul avtomatik o'tadi"),
                  SizedBox(height: 6),
                  _EscrowStep(
                      num: '4',
                      text:
                          "Muammo bo'lsa moderator aralashadi va pul qaytariladi"),
                ],
              ),
            ),
            const SizedBox(height: 28),

            GBoostButton(
              label:
                  "Buyurtmani tasdiqlash — ${_formatPrice(widget.totalPrice)} so'm",
              gradient: AppColors.primaryGradient,
              isLoading: _isLoading,
              onPressed: _placeOrder,
            ),
            const SizedBox(height: 14),
            GBoostOutlinedButton(
              label: 'Bekor qilish',
              onPressed: () =>
                  Navigator.popUntil(context, NamedRoute('/home')),
              borderColor: AppColors.red.withOpacity(0.5),
              textColor: AppColors.red,
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}

class NamedRoute extends Route {
  final String name;
  NamedRoute(this.name);

  @override
  bool get isCurrent => true;

  @override
  bool get isFirst => false;

  @override
  bool get isActive => true;
}

class _RankPill extends StatelessWidget {
  final String rank;
  final Color color;

  const _RankPill({required this.rank, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Text(
        rank,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color valueColor;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor = AppColors.textLight,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, color: AppColors.textGray, size: 16),
            const SizedBox(width: 6),
            Text(label,
                style: const TextStyle(
                    color: AppColors.textGray, fontSize: 13)),
          ],
        ),
        Text(value,
            style: TextStyle(
                color: valueColor,
                fontSize: 13,
                fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _EscrowStep extends StatelessWidget {
  final String num;
  final String text;

  const _EscrowStep({required this.num, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: AppColors.green.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              num,
              style: const TextStyle(
                  color: AppColors.green,
                  fontSize: 11,
                  fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
                color: AppColors.textGray, fontSize: 12, height: 1.4),
          ),
        ),
      ],
    );
  }
}

// ---- Success Screen ----
class _SuccessScreen extends StatelessWidget {
  final Animation<double> animScale;

  const _SuccessScreen({required this.animScale});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ScaleTransition(
                scale: animScale,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.green.withOpacity(0.15),
                    border: Border.all(
                        color: AppColors.green, width: 2),
                  ),
                  child: const Center(
                    child: Icon(Icons.check_rounded,
                        color: AppColors.green, size: 52),
                  ),
                ),
              ),
              const SizedBox(height: 28),
              const Text(
                'Buyurtma qabul qilindi! 🎉',
                style: TextStyle(
                  color: AppColors.textWhite,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                "To'lovingiz Escrow himoyasida. Booster tez orada buyurtmangizni qabul qiladi.",
                style: TextStyle(
                  color: AppColors.textGray,
                  fontSize: 14,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              GBoostButton(
                label: 'Bosh sahifaga qaytish',
                gradient: AppColors.primaryGradient,
                onPressed: () =>
                    Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/home',
                  (_) => false,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class GBoostOutlinedButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color borderColor;
  final Color textColor;

  const GBoostOutlinedButton({
    super.key,
    required this.label,
    this.onPressed,
    this.borderColor = AppColors.cyan,
    this.textColor = AppColors.cyan,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 48,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: 1.5),
          color: borderColor.withOpacity(0.06),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
