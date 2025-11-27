// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://localhost:8081/api';
  
  // In-memory token storage (for testing/development)
  static String? _token;
  
  // Public method to get token (for auth check)
  static Future<String?> getToken() async {
    return _token;
  }
  
  // Get auth token from memory
  static Future<String?> _getToken() async {
    return _token;
  }
  
  // Save auth token in memory
  static Future<void> _saveToken(String token) async {
    _token = token;
  }
  
  // Get headers with auth token
  static Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ==================== AUTH ====================
  
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _saveToken(data['token']);
      return data;
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Login failed');
    }
  }
  
  static Future<Map<String, dynamic>> register(
    String name, String email, String password
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Registration failed');
    }
  }
  
  static Future<Map<String, dynamic>> getCurrentUser() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to get user info');
    }
  }
  
  static Future<void> logout() async {
    _token = null;
  }

  // ==================== NODES ====================
  
  static Future<Map<String, dynamic>> getNodes() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/headscale/nodes'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load nodes');
    }
  }
  
  static Future<void> deleteNode(int nodeId) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$baseUrl/headscale/nodes/$nodeId'),
      headers: headers,
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to delete node');
    }
  }

  // ==================== PREAUTH KEYS ====================
  
  static Future<Map<String, dynamic>> getKeys() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/headscale/keys'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load keys');
    }
  }
  
  static Future<Map<String, dynamic>> createKey({
    bool reusable = true,
    bool ephemeral = false,
    String? expiration,
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/headscale/keys'),
      headers: headers,
      body: jsonEncode({
        'reusable': reusable,
        'ephemeral': ephemeral,
        if (expiration != null) 'expiration': expiration,
      }),
    );
    
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create key');
    }
  }
  
  static Future<void> deleteKey(int keyId) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$baseUrl/headscale/keys/$keyId'),
      headers: headers,
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to delete key');
    }
  }

  // ==================== USERS ====================
  
  static Future<Map<String, dynamic>> getUsers() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/users'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load users');
    }
  }
  
  static Future<void> deleteUser(int userId) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$baseUrl/users/$userId'),
      headers: headers,
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to delete user');
    }
  }

  // ==================== INVITATIONS ====================
  
  static Future<Map<String, dynamic>> getInvitations() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/invitations'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load invitations');
    }
  }
  
  static Future<Map<String, dynamic>> createInvitation(
    String email, {
    String? name,
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/invitations'),
      headers: headers,
      body: jsonEncode({
        'email': email,
        if (name != null) 'name': name,
      }),
    );
    
    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Failed to create invitation');
    }
  }
  
  static Future<void> cancelInvitation(int invitationId) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$baseUrl/invitations/$invitationId'),
      headers: headers,
    );
    
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to cancel invitation');
    }
  }
}