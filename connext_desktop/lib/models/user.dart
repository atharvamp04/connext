// lib/models/user.dart
class User {
  final int id;
  final String name;
  final String email;
  final String headscaleUser;
  final DateTime createdAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.headscaleUser,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      headscaleUser: json['headscale_user'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
