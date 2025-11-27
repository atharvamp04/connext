import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:connext_desktop/native/native_screen.dart';
import 'package:connext_desktop/webrtc/screen_share_manager.dart';
import 'package:connext_desktop/services/host_connection.dart';
import 'package:connext_desktop/widgets/remote_screen_viewer.dart';
import 'package:connext_desktop/views/webrtc_share_view.dart';
import 'package:connext_desktop/views/webrtc_connect_view.dart';
import 'package:connext_desktop/services/api_service.dart';
import 'package:connext_desktop/screens/node_screen.dart';
import 'package:connext_desktop/screens/keys_screen.dart';
import 'package:connext_desktop/screens/users_screen.dart';

void main() {
  runApp(const ConnextDesktopApp());
}

class ConnextDesktopApp extends StatelessWidget {
  const ConnextDesktopApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Connext Desktop',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF667EEA),
          secondary: Color(0xFF764BA2),
        ),
        scaffoldBackgroundColor: const Color(0xFF1A1A1A),
        cardColor: const Color(0xFF222222),
      ),
      home: const ConnextHomePage(),
    );
  }
}

enum ConnextView { home, share, connect, nodes, keys, users, devices, login }

class ConnextHomePage extends StatefulWidget {
  const ConnextHomePage({super.key});

  @override
  State<ConnextHomePage> createState() => _ConnextHomePageState();
}

class _ConnextHomePageState extends State<ConnextHomePage> {
  ConnextView _currentView = ConnextView.home;
  bool _isAuthenticated = false;
  String? _currentUser;
  bool _sidebarCollapsed = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final token = await ApiService.getToken();
    setState(() {
      _isAuthenticated = token != null;
    });
  }

  void _onLoginSuccess(String userName) {
    setState(() {
      _isAuthenticated = true;
      _currentUser = userName;
      _currentView = ConnextView.home;
    });
  }

  Future<void> _logout() async {
    await ApiService.logout();
    setState(() {
      _isAuthenticated = false;
      _currentUser = null;
      _currentView = ConnextView.login;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_isAuthenticated) {
      return Scaffold(
        body: LoginView(onLoginSuccess: _onLoginSuccess),
      );
    }

    return Scaffold(
      body: Row(
        children: [
          _buildSideNav(),
          const VerticalDivider(width: 1, color: Colors.white12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: _buildView(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSideNav() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      width: _sidebarCollapsed ? 70 : 220,
      color: const Color(0xFF111111),
      child: Column(
        children: [
          const SizedBox(height: 24),
          
          // Logo and Toggle Button
          Padding(
            padding: EdgeInsets.symmetric(
              horizontal: _sidebarCollapsed ? 8 : 16,
            ),
            child: Row(
              mainAxisAlignment: _sidebarCollapsed 
                  ? MainAxisAlignment.center 
                  : MainAxisAlignment.spaceBetween,
              children: [
                if (!_sidebarCollapsed) ...[
                  const Text(
                    '🚀',
                    style: TextStyle(fontSize: 28),
                  ),
                  const Text(
                    'Connext',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
                IconButton(
                  onPressed: () {
                    setState(() {
                      _sidebarCollapsed = !_sidebarCollapsed;
                    });
                  },
                  icon: Icon(
                    _sidebarCollapsed ? Icons.keyboard_arrow_right : Icons.keyboard_arrow_left,
                    color: Colors.white,
                  ),
                  tooltip: _sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Subtitle (only when expanded)
          if (!_sidebarCollapsed)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Secure remote access',
                style: TextStyle(fontSize: 12, color: Colors.white54),
              ),
            ),
          
          const SizedBox(height: 16),
          
          // Navigation Buttons
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  _navButton(
                    icon: Icons.home_filled,
                    label: 'Home',
                    view: ConnextView.home,
                  ),
                  _navButton(
                    icon: Icons.screen_share,
                    label: 'Share Screen',
                    view: ConnextView.share,
                  ),
                  _navButton(
                    icon: Icons.computer,
                    label: 'Connect',
                    view: ConnextView.connect,
                  ),
                  _navButton(
                    icon: Icons.lan,
                    label: 'Network Nodes',
                    view: ConnextView.nodes,
                  ),
                  _navButton(
                    icon: Icons.key,
                    label: 'PreAuth Keys',
                    view: ConnextView.keys,
                  ),
                  _navButton(
                    icon: Icons.people,
                    label: 'Users',
                    view: ConnextView.users,
                  ),
                  _navButton(
                    icon: Icons.devices_other,
                    label: 'Devices',
                    view: ConnextView.devices,
                  ),
                ],
              ),
            ),
          ),
          
          // User Profile Section (bottom)
          if (_currentUser != null)
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: Colors.white.withOpacity(0.1)),
                ),
              ),
              child: Column(
                children: [
                  // User Info
                  InkWell(
                    onTap: () {
                      // Navigate to account/profile page
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white10,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: _sidebarCollapsed
                          ? Center(
                              child: CircleAvatar(
                                radius: 16,
                                backgroundColor: Colors.pink.shade600,
                                child: Text(
                                  _currentUser![0].toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            )
                          : Row(
                              children: [
                                CircleAvatar(
                                  radius: 16,
                                  backgroundColor: Colors.pink.shade600,
                                  child: Text(
                                    _currentUser![0].toUpperCase(),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _currentUser!,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Colors.white,
                                          fontWeight: FontWeight.w500,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const Text(
                                        'Account',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Colors.white60,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  // Logout Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _logout,
                      icon: const Icon(Icons.logout, size: 16),
                      label: _sidebarCollapsed 
                          ? const SizedBox.shrink() 
                          : const Text('Logout', style: TextStyle(fontSize: 12)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: BorderSide(color: Colors.red.withOpacity(0.3)),
                        padding: EdgeInsets.symmetric(
                          vertical: 8,
                          horizontal: _sidebarCollapsed ? 8 : 12,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 8),
          
          // Bottom text (only when expanded)
          if (!_sidebarCollapsed)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                'Tailscale-powered\nself-hosted remote desktop',
                style: TextStyle(fontSize: 11, color: Colors.white54),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }

  Widget _navButton({
    required IconData icon,
    required String label,
    required ConnextView view,
  }) {
    final bool isActive = _currentView == view;
    
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: _sidebarCollapsed ? 8 : 12,
        vertical: 4,
      ),
      child: Tooltip(
        message: _sidebarCollapsed ? label : '',
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () {
            setState(() {
              _currentView = view;
            });
          },
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              // Active tab: white background with black text
              // Inactive: white10
              color: isActive 
                  ? Colors.white 
                  : Colors.white.withOpacity(0.1),
            ),
            padding: EdgeInsets.symmetric(
              horizontal: _sidebarCollapsed ? 0 : 12,
              vertical: 10,
            ),
            child: _sidebarCollapsed
                ? Center(
                    child: Icon(
                      icon,
                      size: 20,
                      color: isActive ? Colors.black : Colors.white,
                    ),
                  )
                : Row(
                    children: [
                      Icon(
                        icon,
                        size: 20,
                        color: isActive ? Colors.black : Colors.white,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          label,
                          style: TextStyle(
                            fontSize: 14,
                            color: isActive ? Colors.black : Colors.white,
                            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildView() {
    switch (_currentView) {
      case ConnextView.home:
        return _HomeView();
      case ConnextView.share:
        return WebRTCShareView();
      case ConnextView.connect:
        return WebRTCConnectView();
      case ConnextView.nodes:
        return const NodeScreen();
      case ConnextView.keys:
        return const KeysScreen();
      case ConnextView.users:
        return const UsersScreen();
      case ConnextView.devices:
        return const _DevicesView();
      case ConnextView.login:
        return LoginView(onLoginSuccess: _onLoginSuccess);
    }
  }
}

/// HOME VIEW
class _HomeView extends StatelessWidget {
  _HomeView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Welcome to Connext Desktop',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Secure remote desktop and file transfer over your private Tailscale network.',
            style: TextStyle(fontSize: 14, color: Colors.white70),
          ),
          const SizedBox(height: 32),
          Wrap(
            spacing: 20,
            runSpacing: 20,
            children: [
              _FeatureCard(
                title: 'Remote Desktop',
                description: 'Access any device on your Tailscale network with low latency, high-quality screen sharing.',
              ),
              _FeatureCard(
                title: 'File Transfer',
                description: 'Send and receive files securely between all your devices with drag-and-drop simplicity.',
              ),
              _FeatureCard(
                title: 'End-to-end Private',
                description: 'All traffic stays inside your tailnet. No external relay or SaaS dependency required.',
              ),
            ],
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {
              final state = context.findAncestorStateOfType<_ConnextHomePageState>();
              if (state != null) {
                state.setState(() {
                  state._currentView = ConnextView.share;
                });
              }
            },
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            child: const Text('Start Screen Sharing'),
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final String title;
  final String description;

  _FeatureCard({
    Key? key,
    required this.title,
    required this.description,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 280,
      child: Card(
        elevation: 4,
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                description,
                style: const TextStyle(fontSize: 13, color: Colors.white70),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// LOGIN VIEW
class LoginView extends StatefulWidget {
  final Function(String) onLoginSuccess;
  
  const LoginView({Key? key, required this.onLoginSuccess}) : super(key: key);

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      setState(() {
        _error = 'Please enter email and password';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await ApiService.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
      
      final userName = response['user']?['name'] ?? _emailController.text;
      widget.onLoginSuccess(userName);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400),
        child: Card(
          elevation: 8,
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  '🚀',
                  style: TextStyle(fontSize: 48),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Connext Desktop',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Sign in to continue',
                  style: TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 32),
                TextField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Email',
                    prefixIcon: const Icon(Icons.email),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: const Color(0xFF2A2A2A),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  enabled: !_loading,
                  onSubmitted: (_) => _login(),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _passwordController,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: const Color(0xFF2A2A2A),
                  ),
                  obscureText: true,
                  enabled: !_loading,
                  onSubmitted: (_) => _login(),
                ),
                const SizedBox(height: 24),
                if (_error != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _error!,
                            style: const TextStyle(color: Colors.red),
                          ),
                        ),
                      ],
                    ),
                  ),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _login,
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _loading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text(
                            'Sign In',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Backend: http://localhost:8081',
                  style: TextStyle(fontSize: 12, color: Colors.white54),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// DEVICES VIEW
class _DevicesView extends StatefulWidget {
  const _DevicesView();

  @override
  State<_DevicesView> createState() => _DevicesViewState();
}

class _DevicesViewState extends State<_DevicesView> {
  bool _loading = true;
  String? _error;
  List<ConnextNode> _nodes = [];

  @override
  void initState() {
    super.initState();
    _loadDevices();
  }

  Future<void> _loadDevices() async {
    if (!mounted) return;
    
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final uri = Uri.parse('http://192.168.1.10:8080/api/nodes');
      final resp = await http.get(uri).timeout(const Duration(seconds: 5));

      if (resp.statusCode != 200) {
        throw Exception('Backend returned ${resp.statusCode}');
      }

      final json = jsonDecode(resp.body) as Map<String, dynamic>;
      final nodesJson = (json['nodes'] as List?) ?? [];

      _nodes = nodesJson.map((n) => ConnextNode.fromJson(n)).toList();
      
      if (!mounted) return;
      setState(() {
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not load devices: $e';
      });
    }
  }

  Future<void> _connectToNode(ConnextNode node) async {
    final ip = node.ipAddresses.isNotEmpty ? node.ipAddresses.first : 'N/A';
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Connect clicked for ${node.name} ($ip)\nImplement real connect later.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Available Devices',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const Spacer(),
            IconButton(
              onPressed: _loading ? null : _loadDevices,
              icon: _loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh),
              tooltip: 'Reload devices',
            ),
          ],
        ),
        const SizedBox(height: 8),
        const Text(
          'Devices on your Tailscale network.',
          style: TextStyle(color: Colors.white70),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(
                      child: Text(
                        _error!,
                        style: const TextStyle(color: Colors.redAccent),
                      ),
                    )
                  : _nodes.isEmpty
                      ? const Center(
                          child: Text(
                            'No devices found.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white70),
                          ),
                        )
                      : GridView.builder(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            mainAxisSpacing: 16,
                            crossAxisSpacing: 16,
                            childAspectRatio: 1.7,
                          ),
                          itemCount: _nodes.length,
                          itemBuilder: (context, index) {
                            final node = _nodes[index];
                            final ip = node.ipAddresses.isNotEmpty
                                ? node.ipAddresses.first
                                : 'N/A';
                            return Card(
                              elevation: 4,
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      node.name,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'IP: $ip',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.white70,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    _StatusChip(online: node.online),
                                    const Spacer(),
                                    Align(
                                      alignment: Alignment.bottomRight,
                                      child: ElevatedButton(
                                        onPressed: node.online
                                            ? () => _connectToNode(node)
                                            : null,
                                        child: const Text('Connect'),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
        ),
      ],
    );
  }
}

class ConnextNode {
  final String name;
  final List<String> ipAddresses;
  final bool online;

  ConnextNode({
    required this.name,
    required this.ipAddresses,
    required this.online,
  });

  factory ConnextNode.fromJson(Map<String, dynamic> json) {
    final ips = (json['ip_addresses'] as List?)?.cast<String>() ?? <String>[];
    final online = json['online'] == true || json['connected'] == true;
    return ConnextNode(
      name: json['name']?.toString() ?? 'Unknown',
      ipAddresses: ips,
      online: online,
    );
  }
}

class _StatusChip extends StatelessWidget {
  final bool online;

  const _StatusChip({required this.online});

  @override
  Widget build(BuildContext context) {
    final color = online ? Colors.greenAccent : Colors.redAccent;
    final label = online ? 'Online' : 'Offline';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.7)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}