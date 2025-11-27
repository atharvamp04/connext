// lib/screens/node_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../models/node.dart';
import '../models/owner.dart';

class NodeScreen extends StatefulWidget {
  const NodeScreen({Key? key}) : super(key: key);

  @override
  State<NodeScreen> createState() => _NodeScreenState();
}

class _NodeScreenState extends State<NodeScreen> {
  List<Node> nodes = [];
  Owner? owner;
  bool loading = true;
  bool refreshing = false;
  String? error;
  bool useMockData = false;
  int? deletingId;
  String? copiedId;

  @override
  void initState() {
    super.initState();
    loadNodes();
  }

  Future<void> loadNodes({bool isRefresh = false}) async {
    if (!mounted) return;
    
    setState(() {
      if (isRefresh) {
        refreshing = true;
      } else {
        loading = true;
      }
      error = null;
    });

    try {
      Map<String, dynamic> data;
      
      if (useMockData) {
        await Future.delayed(const Duration(milliseconds: 500));
        data = _getMockData();
      } else {
        data = await ApiService.getNodes();
      }
      
      if (!mounted) return;
      setState(() {
        nodes = (data['nodes'] as List)
            .map((json) => Node.fromJson(json))
            .toList();
        if (data['owner'] != null) {
          owner = Owner.fromJson(data['owner']);
        }
        loading = false;
        refreshing = false;
      });
    } catch (e) {
      if (!mounted) return;
      
      String errorMsg = e.toString();
      if (errorMsg.contains('Failed to load nodes')) {
        errorMsg = 'Backend returned error 500 - Check if Headscale is configured';
      }
      
      setState(() {
        error = errorMsg;
        loading = false;
        refreshing = false;
      });
    }
  }

  Future<void> deleteNode(Node node) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF222222),
        title: const Text('Delete Node'),
        content: Text(
          'Are you sure you want to delete "${node.displayName}"? '
          'This action cannot be undone and will disconnect the device.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => deletingId = node.id);
      
      try {
        await ApiService.deleteNode(node.id);
        if (!mounted) return;
        
        setState(() {
          nodes.removeWhere((n) => n.id == node.id);
          deletingId = null;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Node deleted successfully')),
        );
      } catch (e) {
        if (!mounted) return;
        setState(() => deletingId = null);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete node: $e')),
        );
      }
    }
  }

  Future<void> copyIP(String ip, int nodeId) async {
    await Clipboard.setData(ClipboardData(text: ip));
    setState(() => copiedId = '$nodeId-$ip');
    
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => copiedId = null);
    });
  }

  String formatLastSeen(DateTime? lastSeen) {
    if (lastSeen == null) return 'Never';
    
    final diff = DateTime.now().difference(lastSeen);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  Map<String, dynamic> _getMockData() {
    return {
      'nodes': [
        {
          'id': 1,
          'name': 'desktop-work',
          'given_name': 'Work Desktop',
          'hostname': 'DESKTOP-WORK',
          'ip_addresses': ['100.64.0.1'],
          'online': true,
          'last_seen': {
            'seconds': DateTime.now().millisecondsSinceEpoch ~/ 1000,
          },
          'user': {'name': 'admin'},
        },
        {
          'id': 2,
          'name': 'laptop-home',
          'given_name': 'Home Laptop',
          'hostname': 'LAPTOP-HOME',
          'ip_addresses': ['100.64.0.2'],
          'online': true,
          'last_seen': {
            'seconds': DateTime.now().subtract(const Duration(minutes: 5)).millisecondsSinceEpoch ~/ 1000,
          },
          'user': {'name': 'admin'},
        },
        {
          'id': 3,
          'name': 'phone-mobile',
          'given_name': 'Mobile Phone',
          'hostname': 'ANDROID',
          'ip_addresses': ['100.64.0.3'],
          'online': false,
          'last_seen': {
            'seconds': DateTime.now().subtract(const Duration(hours: 2)).millisecondsSinceEpoch ~/ 1000,
          },
          'user': {'name': 'admin'},
        },
      ],
      'owner': {
        'name': 'Admin User',
        'email': 'admin@example.com',
        'headscale_user': 'default',
        'is_owner': true,
      },
    };
  }

  @override
  Widget build(BuildContext context) {
    final onlineCount = nodes.where((n) => n.online).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        _buildHeader(),
        const SizedBox(height: 8),
        const Text(
          'All devices connected to your mesh network.',
          style: TextStyle(color: Colors.white60),
        ),
        const SizedBox(height: 24),
        
        // Network Owner Banner
        if (owner != null && !owner!.isOwner) ...[
          _buildOwnerBanner(),
          const SizedBox(height: 24),
        ],
        
        // Stats Cards
        _buildStatsCards(onlineCount),
        const SizedBox(height: 24),
        
        // Nodes Table
        Expanded(
          child: _buildNodesTable(),
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        const Text(
          'Nodes',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        ),
        const SizedBox(width: 16),
        Chip(
          label: Text(
            useMockData ? 'Mock Data' : 'Live Data',
            style: const TextStyle(fontSize: 11),
          ),
          backgroundColor: useMockData ? Colors.orange : Colors.green,
          avatar: Icon(
            useMockData ? Icons.science : Icons.cloud,
            size: 14,
            color: Colors.white,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 8),
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
        if (owner != null && owner!.isOwner) ...[
          const SizedBox(width: 8),
          Chip(
            label: const Text(
              'Network Owner',
              style: TextStyle(fontSize: 11, color: Color(0xFFFFC0CB)),
            ),
            backgroundColor: Colors.pink.withOpacity(0.2),
            padding: const EdgeInsets.symmetric(horizontal: 8),
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ],
        const Spacer(),
        TextButton.icon(
          icon: const Icon(Icons.swap_horiz, size: 16),
          label: Text(useMockData ? 'Use Live API' : 'Use Mock Data'),
          onPressed: () {
            setState(() => useMockData = !useMockData);
            loadNodes();
          },
        ),
        const SizedBox(width: 8),
        IconButton(
          icon: refreshing
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.refresh),
          onPressed: refreshing ? null : () => loadNodes(isRefresh: true),
          tooltip: 'Refresh',
        ),
      ],
    );
  }

  Widget _buildOwnerBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: Colors.blue, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Shared Network Access',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "You're viewing nodes from ${owner!.name}'s network (${owner!.email}). "
                  "All devices are in the ${owner!.headscaleUser} namespace. "
                  "You can add your own devices using PreAuth Keys.",
                  style: const TextStyle(fontSize: 12, color: Colors.white70),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsCards(int onlineCount) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            title: 'Total Nodes',
            value: nodes.length.toString(),
            icon: Icons.computer,
            color: Colors.blue,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _StatCard(
            title: 'Online',
            value: onlineCount.toString(),
            icon: Icons.wifi,
            color: Colors.green,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _StatCard(
            title: 'Offline',
            value: (nodes.length - onlineCount).toString(),
            icon: Icons.wifi_off,
            color: Colors.red,
          ),
        ),
      ],
    );
  }

  Widget _buildNodesTable() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          // Table Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Colors.white.withOpacity(0.1)),
              ),
            ),
            child: const Row(
              children: [
                Text(
                  'Connected Devices',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          
          // Table Content
          Expanded(
            child: loading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text(
                          'Loading nodes...',
                          style: TextStyle(color: Colors.white60),
                        ),
                      ],
                    ),
                  )
                : error != null
                    ? _buildErrorState()
                    : nodes.isEmpty
                        ? _buildEmptyState()
                        : _buildTableRows(),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Failed to load nodes',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error!,
              style: const TextStyle(color: Colors.white60),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => loadNodes(),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.computer, size: 48, color: Colors.white.withOpacity(0.2)),
            const SizedBox(height: 16),
            const Text(
              'No nodes connected yet.',
              style: TextStyle(color: Colors.white60, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              owner != null && !owner!.isOwner
                  ? "Generate a pre-auth key to add your devices to ${owner!.name}'s network."
                  : 'Generate a pre-auth key and use it to connect your first device.',
              style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTableRows() {
    return ListView(
      children: [
        // Header Row
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
          ),
          child: const Row(
            children: [
              SizedBox(width: 100, child: Text('Status', style: TextStyle(color: Colors.white70, fontSize: 13))),
              Expanded(flex: 2, child: Text('Name', style: TextStyle(color: Colors.white70, fontSize: 13))),
              Expanded(flex: 2, child: Text('IP Address', style: TextStyle(color: Colors.white70, fontSize: 13))),
              SizedBox(width: 120, child: Text('User', style: TextStyle(color: Colors.white70, fontSize: 13))),
              SizedBox(width: 120, child: Text('Last Seen', style: TextStyle(color: Colors.white70, fontSize: 13))),
              SizedBox(width: 120, child: Text('Actions', style: TextStyle(color: Colors.white70, fontSize: 13))),
            ],
          ),
        ),
        
        // Data Rows
        ...nodes.map((node) => _buildNodeRow(node)),
      ],
    );
  }

  Widget _buildNodeRow(Node node) {
    final isDeleting = deletingId == node.id;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
      ),
      child: Row(
        children: [
          // Status
          SizedBox(
            width: 100,
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: node.online ? Colors.green : Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: node.online
                        ? Colors.green.withOpacity(0.2)
                        : Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    node.online ? 'Online' : 'Offline',
                    style: TextStyle(
                      color: node.online ? Colors.green : Colors.red,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Name
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  node.displayName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (node.givenName != null && node.name != node.givenName)
                  Text(
                    node.name,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.4),
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),
          
          // IP Address
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: node.ipAddresses.map((ip) {
                final isCopied = copiedId == '${node.id}-$ip';
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          ip,
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 13,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () => copyIP(ip, node.id),
                        child: Icon(
                          isCopied ? Icons.check : Icons.copy,
                          size: 16,
                          color: isCopied ? Colors.green : Colors.white.withOpacity(0.4),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          
          // User
          SizedBox(
            width: 120,
            child: Text(
              node.userName ?? owner?.headscaleUser ?? '—',
              style: const TextStyle(color: Colors.white60, fontSize: 13),
            ),
          ),
          
          // Last Seen
          SizedBox(
            width: 120,
            child: Text(
              formatLastSeen(node.lastSeen),
              style: const TextStyle(color: Colors.white60, fontSize: 13),
            ),
          ),
          
          // Actions
          SizedBox(
            width: 120,
            child: TextButton.icon(
              onPressed: isDeleting ? null : () => deleteNode(node),
              icon: isDeleting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.delete_outline, size: 16),
              label: Text(isDeleting ? 'Deleting...' : 'Delete'),
              style: TextButton.styleFrom(
                foregroundColor: Colors.red,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(color: Colors.white60, fontSize: 13),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  color: color,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}