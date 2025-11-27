// lib/models/node.dart
class Node {
  final int id;
  final String name;
  final String? givenName;
  final String? hostname;
  final List<String> ipAddresses;
  final bool online;
  final DateTime? lastSeen;
  final String? userName;
  
  Node({
    required this.id,
    required this.name,
    this.givenName,
    this.hostname,
    required this.ipAddresses,
    required this.online,
    this.lastSeen,
    this.userName,
  });
  
  factory Node.fromJson(Map<String, dynamic> json) {
    return Node(
      id: json['id'] as int,
      name: json['name'] as String,
      givenName: json['given_name'] as String?,
      hostname: json['hostname'] as String?,
      ipAddresses: List<String>.from(json['ip_addresses'] ?? []),
      online: json['online'] as bool? ?? false,
      lastSeen: json['last_seen'] != null 
          ? DateTime.fromMillisecondsSinceEpoch(
              (json['last_seen']['seconds'] as int) * 1000
            )
          : null,
      userName: json['user']?['name'] as String?,
    );
  }
  
  String get displayName => givenName ?? name;
}