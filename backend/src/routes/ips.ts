import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest, authenticateToken, requireOwner } from '../middleware/auth';
import { apiLimiter, writeLimiter } from '../middleware/rateLimit';

const router = Router();

// Get all IPs for current user
router.get('/', apiLimiter, authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    let query = supabase
      .from('ip_addresses')
      .select('*')
      .order('created_at', { ascending: false });

    if (req.user!.role === 'owner') {
      query = query.eq('owner_id', req.user!.userId);
    } else {
      // For subusers, get assigned IPs
      const { data: assignments } = await supabase
        .from('user_ip_assignments')
        .select('ip_id')
        .eq('user_id', req.user!.userId);

      const ipIds = assignments?.map(a => a.ip_id) || [];
      query = query.in('id', ipIds);
    }

    const { data: ips, error } = await query;

    if (error) throw error;

    res.json(ips || []);
  } catch (error) {
    console.error('Get IPs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single IP
router.get('/:id', apiLimiter, authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: ip, error } = await supabase
      .from('ip_addresses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !ip) {
      return res.status(404).json({ error: 'IP address not found' });
    }

    // Check access
    if (req.user!.role === 'owner' && ip.owner_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied' });
    } else if (req.user!.role === 'subuser') {
      const { data: assignment } = await supabase
        .from('user_ip_assignments')
        .select('*')
        .eq('user_id', req.user!.userId)
        .eq('ip_id', id)
        .single();

      if (!assignment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(ip);
  } catch (error) {
    console.error('Get IP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create IP (owner only)
router.post('/', writeLimiter, authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { ip_address, label, firewall_mode } = req.body;

    if (!ip_address) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    const { data: ip, error } = await supabase
      .from('ip_addresses')
      .insert([{
        ip_address,
        label,
        owner_id: req.user!.userId,
        firewall_mode: firewall_mode || 'accept',
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'IP address already exists' });
      }
      throw error;
    }

    res.status(201).json(ip);
  } catch (error) {
    console.error('Create IP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update IP
router.put('/:id', writeLimiter, authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { label, status, firewall_mode } = req.body;

    // Check ownership
    const { data: ip } = await supabase
      .from('ip_addresses')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!ip || ip.owner_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates: any = {};
    if (label !== undefined) updates.label = label;
    if (status !== undefined) updates.status = status;
    if (firewall_mode !== undefined) updates.firewall_mode = firewall_mode;

    const { data: updatedIp, error } = await supabase
      .from('ip_addresses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(updatedIp);
  } catch (error) {
    console.error('Update IP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete IP (owner only)
router.delete('/:id', writeLimiter, authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check ownership
    const { data: ip } = await supabase
      .from('ip_addresses')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!ip || ip.owner_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase.from('ip_addresses').delete().eq('id', id);

    if (error) throw error;

    res.json({ message: 'IP address deleted successfully' });
  } catch (error) {
    console.error('Delete IP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
