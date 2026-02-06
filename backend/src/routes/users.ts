import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase';
import { AuthRequest, authenticateToken, requireOwner } from '../middleware/auth';
import { apiLimiter, writeLimiter } from '../middleware/rateLimit';

const router = Router();

// Get all users (owner only)
router.get('/', apiLimiter, authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, full_name, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(users || []);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (owner only)
router.post('/', writeLimiter, authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role, full_name } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    if (!['owner', 'subuser'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert([{ email, password_hash: passwordHash, role, full_name }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      throw error;
    }

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (owner only)
router.put('/:id', writeLimiter, authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, role, full_name } = req.body;

    const updates: any = {};
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (full_name) updates.full_name = full_name;
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (owner only)
router.delete('/:id', writeLimiter, authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user!.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign IP to user (owner only)
router.post('/:userId/ips/:ipId', writeLimiter, authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, ipId } = req.params;

    const { data, error } = await supabase
      .from('user_ip_assignments')
      .insert([{ user_id: userId, ip_id: ipId }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'IP already assigned to user' });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Assign IP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove IP from user (owner only)
router.delete('/:userId/ips/:ipId', writeLimiter, authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, ipId } = req.params;

    const { error } = await supabase
      .from('user_ip_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('ip_id', ipId);

    if (error) throw error;

    res.json({ message: 'IP assignment removed successfully' });
  } catch (error) {
    console.error('Remove IP assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
