// lib/screens/users_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../models/user.dart';
import '../models/invitation.dart';

class UsersScreen extends StatefulWidget {
  const UsersScreen({Key? key}) : super(key: key);

  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  List<User> users = [];
  List<Invitation> invitations = [];
  bool loading = true;
  bool modalOpen = false;
  bool deleteModalOpen = false;
  User? userToDelete;
  String? copiedToken;
  
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  String? error;
  bool submitting = false;

  @override
  void initState() {
    super.initState();
    loadData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> loadData() async {
    if (!mounted) return;
    
    setState(() {
      loading = true;
    });

    try {
      final results = await Future.wait([
        ApiService.getUsers(),
        ApiService.getInvitations(),
      ]);
      
      if (!mounted) return;
      setState(() {
        users = (results[0]['users'] as List)
            .map((json) => User.fromJson(json))
            .toList();
        invitations = (results[1]['invitations'] as List)
            .map((json) => Invitation.fromJson(json))
            .toList();
        loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => loading = false);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load data: $e')),
      );
    }
  }

  Future<void> sendInvitation() async {
    if (_emailController.text.trim().isEmpty) {
      setState(() => error = 'Email is required');
      return;
    }

    setState(() {
      error = null;
      submitting = true;
    });

    try {
      await ApiService.createInvitation(
        _emailController.text.trim(),
        name: _nameController.text.trim().isNotEmpty ? _nameController.text.trim() : null,
      );
      
      if (!mounted) return;
      setState(() {
        modalOpen = false;
        submitting = false;
      });
      
      _nameController.clear();
      _emailController.clear();
      
      await loadData();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invitation sent successfully')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = e.toString().replaceAll('Exception: ', '');
        submitting = false;
      });
    }
  }

  Future<void> deleteUser(User user) async {
    try {
      await ApiService.deleteUser(user.id);
      
      if (!mounted) return;
      setState(() {
        deleteModalOpen = false;
        userToDelete = null;
      });
      
      await loadData();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User removed successfully')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete user: $e')),
      );
    }
  }

  Future<void> cancelInvitation(Invitation invitation) async {
    try {
      await ApiService.cancelInvitation(invitation.id);
      await loadData();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invitation cancelled')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to cancel invitation: $e')),
      );
    }
  }

  Future<void> copyInviteLink(String token) async {
    final link = 'YOUR_APP_URL/invite/$token'; // Replace with your actual URL
    await Clipboard.setData(ClipboardData(text: link));
    setState(() => copiedToken = token);
    
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => copiedToken = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    final pendingInvites = invitations.where((i) => i.status == 'pending').toList();
    
    return Stack(
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'Network Users',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Invite users to join your network or manage existing members.',
              style: TextStyle(color: Colors.white60),
            ),
            const SizedBox(height: 24),
            
            // Manage Users Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Manage Users',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
                ElevatedButton.icon(
                  onPressed: () => setState(() => modalOpen = true),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Invite User'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.pink.shade600,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Content
            Expanded(
              child: loading
                  ? const Center(child: CircularProgressIndicator())
                  : SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Pending Invitations
                          if (pendingInvites.isNotEmpty) ...[
                            _buildPendingInvitations(pendingInvites),
                            const SizedBox(height: 24),
                          ],
                          
                          // Active Users
                          _buildActiveUsers(),
                        ],
                      ),
                    ),
            ),
          ],
        ),
        
        // Invite Modal
        if (modalOpen) _buildInviteModal(),
        
        // Delete Modal
        if (deleteModalOpen && userToDelete != null) _buildDeleteModal(),
      ],
    );
  }

  Widget _buildPendingInvitations(List<Invitation> pending) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.yellow.withOpacity(0.1),
        border: Border.all(color: Colors.yellow.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Colors.yellow.withOpacity(0.3)),
              ),
            ),
            child: Row(
              children: [
                Text(
                  'Pending Invitations (${pending.length})',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Colors.yellow,
                  ),
                ),
              ],
            ),
          ),
          
          // Table
          ListView(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                ),
                child: const Row(
                  children: [
                    Expanded(flex: 2, child: Text('Name', style: TextStyle(color: Colors.white70, fontSize: 13))),
                    Expanded(flex: 3, child: Text('Email', style: TextStyle(color: Colors.white70, fontSize: 13))),
                    Expanded(flex: 3, child: Text('Invite Link', style: TextStyle(color: Colors.white70, fontSize: 13))),
                    SizedBox(width: 100, child: Text('Actions', style: TextStyle(color: Colors.white70, fontSize: 13))),
                  ],
                ),
              ),
              
              // Rows
              ...pending.map((invite) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: Colors.white.withOpacity(0.1)),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: Text(invite.inviteeName ?? '—'),
                    ),
                    Expanded(
                      flex: 3,
                      child: Text(
                        invite.inviteeEmail,
                        style: const TextStyle(color: Colors.white60),
                      ),
                    ),
                    Expanded(
                      flex: 3,
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '/invite/${invite.token.substring(0, 8)}...',
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 11,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: () => copyInviteLink(invite.token),
                            icon: Icon(
                              copiedToken == invite.token ? Icons.check : Icons.copy,
                              size: 16,
                              color: copiedToken == invite.token ? Colors.green : Colors.white60,
                            ),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(
                      width: 100,
                      child: TextButton(
                        onPressed: () => cancelInvitation(invite),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(color: Colors.red, fontSize: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              )),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActiveUsers() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Colors.white.withOpacity(0.1)),
              ),
            ),
            child: Row(
              children: [
                Text(
                  'Active Users (${users.length})',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          
          // Table
          ListView(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                ),
                child: const Row(
                  children: [
                    Expanded(flex: 2, child: Text('Name', style: TextStyle(color: Colors.white70, fontSize: 13))),
                    Expanded(flex: 3, child: Text('Email', style: TextStyle(color: Colors.white70, fontSize: 13))),
                    Expanded(flex: 2, child: Text('Headscale User', style: TextStyle(color: Colors.white70, fontSize: 13))),
                    SizedBox(width: 80, child: Text('Actions', style: TextStyle(color: Colors.white70, fontSize: 13))),
                  ],
                ),
              ),
              
              // Rows
              if (users.isEmpty)
                Container(
                  padding: const EdgeInsets.all(32),
                  child: Center(
                    child: Text(
                      'No users yet. Send your first invitation to get started.',
                      style: TextStyle(color: Colors.white.withOpacity(0.4)),
                    ),
                  ),
                )
              else
                ...users.map((user) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(color: Colors.white.withOpacity(0.1)),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: Text(
                          user.name,
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          user.email,
                          style: const TextStyle(color: Colors.white60),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            user.headscaleUser,
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                      SizedBox(
                        width: 80,
                        child: IconButton(
                          onPressed: () {
                            setState(() {
                              userToDelete = user;
                              deleteModalOpen = true;
                            });
                          },
                          icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                )),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInviteModal() {
    return Container(
      color: Colors.black.withOpacity(0.5),
      child: Center(
        child: Container(
          width: 500,
          margin: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Invite User to Network',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        setState(() {
                          modalOpen = false;
                          error = null;
                        });
                      },
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              
              // Info Banner
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 24),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  border: Border.all(color: Colors.blue.withOpacity(0.3)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Text(
                          'How it works:',
                          style: TextStyle(
                            color: Colors.blue,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '• If user exists: They\'ll join your network\n'
                      '• If user is new: They\'ll create an account first',
                      style: TextStyle(
                        color: Colors.blue.shade200,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Form
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (error != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.2),
                          border: Border.all(color: Colors.red.withOpacity(0.5)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          error!,
                          style: const TextStyle(color: Colors.red, fontSize: 13),
                        ),
                      ),
                    
                    const Text(
                      'Name (Optional)',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        hintText: 'John Doe',
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    const Text(
                      'Email *',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _emailController,
                      decoration: InputDecoration(
                        hintText: 'john@example.com',
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                        ),
                      ),
                      keyboardType: TextInputType.emailAddress,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Actions
              Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          setState(() {
                            modalOpen = false;
                            error = null;
                          });
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: BorderSide(color: Colors.white.withOpacity(0.1)),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: submitting ? null : sendInvitation,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.pink.shade600,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: submitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Send Invitation'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDeleteModal() {
    return Container(
      color: Colors.black.withOpacity(0.5),
      child: Center(
        child: Container(
          width: 450,
          margin: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Remove User',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              RichText(
                text: TextSpan(
                  style: const TextStyle(color: Colors.white60),
                  children: [
                    const TextSpan(text: 'Remove '),
                    TextSpan(
                      text: userToDelete!.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const TextSpan(
                      text: ' from your network? They will lose access to your network devices.',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          deleteModalOpen = false;
                          userToDelete = null;
                        });
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: BorderSide(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => deleteUser(userToDelete!),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.shade600,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('Remove User'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}