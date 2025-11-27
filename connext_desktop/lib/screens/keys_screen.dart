// lib/screens/keys_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../models/preauth_key.dart';
import '../models/owner.dart';

class KeysScreen extends StatefulWidget {
  const KeysScreen({Key? key}) : super(key: key);

  @override
  State<KeysScreen> createState() => _KeysScreenState();
}

class _KeysScreenState extends State<KeysScreen> {
  List<PreAuthKey> keys = [];
  Owner? owner;
  bool loading = true;
  bool generating = false;
  String? newKey;
  int? copiedId;
  int? deletingId;

  @override
  void initState() {
    super.initState();
    loadKeys();
  }

  Future<void> loadKeys() async {
    if (!mounted) return;
    
    setState(() {
      loading = true;
    });

    try {
      final data = await ApiService.getKeys();
      
      // Filter out expired keys
      final activeKeys = (data['keys'] as List)
          .map((json) => PreAuthKey.fromJson(json))
          .where((k) => !k.isExpired)
          .toList();
      
      if (!mounted) return;
      setState(() {
        keys = activeKeys;
        if (data['owner'] != null) {
          owner = Owner.fromJson(data['owner']);
        }
        loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        loading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load keys: $e')),
      );
    }
  }

  Future<void> generateKey() async {
    setState(() {
      generating = true;
      newKey = null;
    });

    try {
      final data = await ApiService.createKey();
      
      if (!mounted) return;
      setState(() {
        newKey = data['key'];
        generating = false;
      });
      
      await loadKeys();
    } catch (e) {
      if (!mounted) return;
      setState(() => generating = false);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to generate key: $e')),
      );
    }
  }

  Future<void> deleteKey(PreAuthKey key) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF222222),
        title: const Text('Delete Key'),
        content: const Text(
          'Are you sure you want to delete this key? This action cannot be undone.',
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
      setState(() => deletingId = key.id);
      
      try {
        await ApiService.deleteKey(key.id);
        
        if (!mounted) return;
        setState(() {
          keys.removeWhere((k) => k.id == key.id);
          deletingId = null;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Key deleted successfully')),
        );
      } catch (e) {
        if (!mounted) return;
        setState(() => deletingId = null);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete key: $e')),
        );
      }
    }
  }

  Future<void> copyToClipboard(String text, int id) async {
    await Clipboard.setData(ClipboardData(text: text));
    setState(() => copiedId = id);
    
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => copiedId = null);
    });
  }

  String formatDate(DateTime date) {
    return '${_monthName(date.month)} ${date.day}, ${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  String _monthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        const Text(
          'Pre-Auth Keys',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Text(
          'Generate reusable access keys to connect new devices to your network.',
          style: TextStyle(color: Colors.white60),
        ),
        const SizedBox(height: 24),
        
        // Owner Banner
        if (owner != null && !owner!.isOwner) ...[
          _buildOwnerBanner(),
          const SizedBox(height: 24),
        ],
        
        // Generate Key Section
        _buildGenerateSection(),
        const SizedBox(height: 24),
        
        // Keys Table
        Expanded(
          child: _buildKeysTable(),
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
                  "You're managing keys for ${owner!.name}'s network (${owner!.email}). "
                  "Keys you create will allow devices to join the ${owner!.headscaleUser} namespace.",
                  style: const TextStyle(fontSize: 12, color: Colors.white70),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGenerateSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Generate New Key',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Keys expire after 24 hours and can be reused.'
                      '${owner != null && !owner!.isOwner ? " Devices will join ${owner!.name}'s network." : ""}',
                      style: const TextStyle(fontSize: 13, color: Colors.white60),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              ElevatedButton.icon(
                onPressed: generating ? null : generateKey,
                icon: generating
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.key, size: 16),
                label: Text(generating ? 'Generating...' : 'Generate Key'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.pink.shade600,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
              ),
            ],
          ),
          
          // New Key Display
          if (newKey != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                border: Border.all(color: Colors.green.withOpacity(0.3)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green, size: 16),
                      SizedBox(width: 8),
                      Text(
                        'New key generated!',
                        style: TextStyle(
                          color: Colors.green,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            newKey!,
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 12,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: () => copyToClipboard(newKey!, -1),
                        icon: Icon(
                          copiedId == -1 ? Icons.check : Icons.copy,
                          color: copiedId == -1 ? Colors.green : Colors.white70,
                          size: 18,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Use this key with: tailscale up --login-server YOUR_SERVER --authkey ${newKey!.substring(0, 12)}...',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withOpacity(0.5),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildKeysTable() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Colors.white.withOpacity(0.1)),
              ),
            ),
            child: Row(
              children: [
                const Text(
                  'Your Keys',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                if (owner != null && owner!.isOwner) ...[
                  const SizedBox(width: 12),
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
              ],
            ),
          ),
          
          // Content
          Expanded(
            child: loading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text(
                          'Loading keys...',
                          style: TextStyle(color: Colors.white60),
                        ),
                      ],
                    ),
                  )
                : keys.isEmpty
                    ? _buildEmptyState()
                    : _buildTableContent(),
          ),
        ],
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
            Icon(Icons.key, size: 48, color: Colors.white.withOpacity(0.2)),
            const SizedBox(height: 16),
            const Text(
              'No keys found.',
              style: TextStyle(color: Colors.white60, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              owner != null && !owner!.isOwner
                  ? "Generate a key to add your devices to ${owner!.name}'s network."
                  : 'Generate a key to connect your first device.',
              style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTableContent() {
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
              Expanded(flex: 2, child: Text('Key', style: TextStyle(color: Colors.white70, fontSize: 13))),
              SizedBox(width: 100, child: Text('Reusable', style: TextStyle(color: Colors.white70, fontSize: 13))),
              Expanded(child: Text('Created', style: TextStyle(color: Colors.white70, fontSize: 13))),
              Expanded(child: Text('Expires', style: TextStyle(color: Colors.white70, fontSize: 13))),
              SizedBox(width: 100, child: Text('Status', style: TextStyle(color: Colors.white70, fontSize: 13))),
              SizedBox(width: 100, child: Text('Actions', style: TextStyle(color: Colors.white70, fontSize: 13))),
            ],
          ),
        ),
        
        // Data Rows
        ...keys.map((key) => _buildKeyRow(key)),
      ],
    );
  }

  Widget _buildKeyRow(PreAuthKey key) {
    final isDeleting = deletingId == key.id;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
      ),
      child: Row(
        children: [
          // Key
          Expanded(
            flex: 2,
            child: Text(
              '${key.key.substring(0, 12)}...',
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 13,
              ),
            ),
          ),
          
          // Reusable
          SizedBox(
            width: 100,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: key.reusable
                    ? Colors.blue.withOpacity(0.2)
                    : Colors.grey.withOpacity(0.2),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                key.reusable ? 'Yes' : 'No',
                style: TextStyle(
                  color: key.reusable ? Colors.blue : Colors.grey,
                  fontSize: 11,
                ),
              ),
            ),
          ),
          
          // Created
          Expanded(
            child: Text(
              formatDate(key.createdAt),
              style: const TextStyle(fontSize: 13, color: Colors.white60),
            ),
          ),
          
          // Expires
          Expanded(
            child: Text(
              formatDate(key.expiration),
              style: const TextStyle(fontSize: 13, color: Colors.white60),
            ),
          ),
          
          // Status
          SizedBox(
            width: 100,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: key.isExpired
                    ? Colors.red.withOpacity(0.2)
                    : Colors.green.withOpacity(0.2),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                key.isExpired ? 'Expired' : 'Active',
                style: TextStyle(
                  color: key.isExpired ? Colors.red : Colors.green,
                  fontSize: 11,
                ),
              ),
            ),
          ),
          
          // Actions
          SizedBox(
            width: 100,
            child: Row(
              children: [
                IconButton(
                  onPressed: isDeleting ? null : () => copyToClipboard(key.key, key.id),
                  icon: Icon(
                    copiedId == key.id ? Icons.check : Icons.copy,
                    size: 16,
                    color: copiedId == key.id ? Colors.green : Colors.white60,
                  ),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 12),
                IconButton(
                  onPressed: isDeleting ? null : () => deleteKey(key),
                  icon: isDeleting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.delete_outline, size: 16, color: Colors.red),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}