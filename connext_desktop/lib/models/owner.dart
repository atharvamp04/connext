// lib/models/owner.dart
class Owner {
  final String name;
  final String email;
  final String headscaleUser;
  final bool isOwner;
  
  Owner({
    required this.name,
    required this.email,
    required this.headscaleUser,
    required this.isOwner,
  });
  
  factory Owner.fromJson(Map<String, dynamic> json) {
    return Owner(
      name: json['name'] as String? ?? 'Unknown',
      email: json['email'] as String? ?? '',
      headscaleUser: json['headscale_user'] as String? ?? '',
      isOwner: json['is_owner'] as bool? ?? false,
    );
  }
}