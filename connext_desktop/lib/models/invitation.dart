// lib/models/invitation.dart
class Invitation {
  final int id;
  final String inviteeEmail;
  final String? inviteeName;
  final String status;
  final String token;
  final DateTime createdAt;
  
  Invitation({
    required this.id,
    required this.inviteeEmail,
    this.inviteeName,
    required this.status,
    required this.token,
    required this.createdAt,
  });
  
  factory Invitation.fromJson(Map<String, dynamic> json) {
    return Invitation(
      id: json['id'] as int,
      inviteeEmail: json['invitee_email'] as String,
      inviteeName: json['invitee_name'] as String?,
      status: json['status'] as String,
      token: json['token'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}