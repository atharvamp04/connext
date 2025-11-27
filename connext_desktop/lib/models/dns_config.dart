// lib/models/dns_config.dart
class DNSConfig {
  final String baseDomain;
  final List<String> nameservers;
  final bool magicDNSEnabled;

  DNSConfig({
    required this.baseDomain,
    required this.nameservers,
    required this.magicDNSEnabled,
  });

  factory DNSConfig.fromJson(Map<String, dynamic> json) {
    return DNSConfig(
      baseDomain: json['baseDomain'] as String? ?? '',
      nameservers: List<String>.from(json['nameservers'] ?? []),
      magicDNSEnabled: json['magicDNSEnabled'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'baseDomain': baseDomain,
      'nameservers': nameservers,
      'magicDNSEnabled': magicDNSEnabled,
    };
  }
}