class AppConstants {
  // App info
  static const String appName = 'GBoost';
  static const String appTagline = "O'zbekistonning Birinchi Xavfsiz Geyming Ekotizimi";
  static const String appVersion = '1.0.0';

  // Contact
  static const String email = 'gboost.uz@gmail.com';
  static const String telegram = '@gboost_uz';
  static const String website = 'gboost.uz';

  // Commission
  static const double commissionRate = 0.13; // 13%
  static const int escrowDays = 3;

  // Games
  static const List<Map<String, dynamic>> games = [
    {
      'id': 'mlbb',
      'name': 'Mobile Legends: Bang Bang',
      'shortName': 'MLBB',
      'icon': '🗡️',
      'color': 0xFF00E5FF,
      'ranks': ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythic Glory'],
    },
    {
      'id': 'pubg',
      'name': 'PUBG Mobile',
      'shortName': 'PUBG',
      'icon': '🎯',
      'color': 0xFFFFD600,
      'ranks': ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'],
    },
    {
      'id': 'freefire',
      'name': 'Free Fire',
      'shortName': 'FF',
      'icon': '🔥',
      'color': 0xFFFF8C00,
      'ranks': ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Heroic', 'Grandmaster'],
    },
    {
      'id': 'cs2',
      'name': 'Counter-Strike 2',
      'shortName': 'CS2',
      'icon': '💣',
      'color': 0xFF6C3FB5,
      'ranks': ['Silver I', 'Silver II', 'Silver III', 'Silver IV', 'Gold Nova I', 'Gold Nova II',
                'Gold Nova III', 'Gold Nova Master', 'Master Guardian I', 'Master Guardian II',
                'Master Guardian Elite', 'Distinguished Master Guardian', 'Legendary Eagle',
                'Legendary Eagle Master', 'Supreme Master First Class', 'Global Elite'],
    },
  ];

  // Service types
  static const List<Map<String, String>> serviceTypes = [
    {'id': 'solo', 'name': 'Solo Boosting', 'desc': "Booster sizning akkauntingizga kiradi va o'yinlaydi", 'icon': '⚔️'},
    {'id': 'duo', 'name': 'Duo Boosting', 'desc': "Booster siz bilan birga o'yinlaydi", 'icon': '🤝'},
    {'id': 'coaching', 'name': 'Coaching', 'desc': "Professional o'yinchi sizga dars beradi", 'icon': '🎓'},
  ];

  // Karma levels
  static const Map<String, dynamic> karmaLevels = {
    'high': {'min': 80, 'max': 100, 'label': 'Yuqori', 'color': 0xFF00C853},
    'medium': {'min': 40, 'max': 79, 'label': "O'rtacha", 'color': 0xFFFFD600},
    'low': {'min': 0, 'max': 39, 'label': 'Past', 'color': 0xFFFF3D3D},
  };

  // Pricing (UZS)
  static const Map<String, double> basePrices = {
    'mlbb': 50000,
    'pubg': 60000,
    'freefire': 40000,
    'cs2': 80000,
  };
}
