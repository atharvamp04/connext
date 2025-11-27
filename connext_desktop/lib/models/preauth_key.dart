// lib/models/preauth_key.dart
class PreAuthKey {
  final int id;
  final String key;
  final bool reusable;
  final DateTime expiration;
  final DateTime createdAt;
  final bool used;
  
  PreAuthKey({
    required this.id,
    required this.key,
    required this.reusable,
    required this.expiration,
    required this.createdAt,
    required this.used,
  });
  
  factory PreAuthKey.fromJson(Map<String, dynamic> json) {
    return PreAuthKey(
      id: json['id'] as int,
      key: json['key'] as String,
      reusable: json['reusable'] as bool? ?? false,
      expiration: DateTime.fromMillisecondsSinceEpoch(
        (json['expiration']['seconds'] as int) * 1000
      ),
      createdAt: DateTime.fromMillisecondsSinceEpoch(
        (json['created_at']['seconds'] as int) * 1000
      ),
      used: json['used'] as bool? ?? false,
    );
  }
  
  bool get isExpired => DateTime.now().isAfter(expiration);
}