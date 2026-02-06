import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest, authenticateToken, requireOwner } from '../middleware/auth';
import { apiLimiter, writeLimiter } from '../middleware/rateLimit';

const router = Router();

// Helper function to check IP ownership
async function isIpOwner(userId: string, ipId: string): Promise<boolean> {
  const { data: ip } = await supabase
    .from('ip_addresses')
    .select('owner_id')
    .eq('id', ipId)
    .single();

  return ip?.owner_id === userId;
}

// Get firewall rules for IP
router.get('/:ipId', apiLimiter, authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { ipId } = req.params;

    // Check ownership for owner role
    if (req.user!.role === 'owner' && !await isIpOwner(req.user!.userId, ipId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: rules, error } = await supabase
      .from('firewall_rules')
      .select('*')
      .eq('ip_id', ipId)
      .order('port');

    if (error) throw error;

    res.json(rules || []);
  } catch (error) {
    console.error('Get firewall rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create firewall rule (owner only)
router.post('/', writeLimiter, authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { ip_id, port, protocol, action, description } = req.body;

    if (!ip_id || !port || !protocol) {
      return res.status(400).json({ error: 'IP ID, port, and protocol are required' });
    }

    if (port < 1 || port > 65535) {
      return res.status(400).json({ error: 'Port must be between 1 and 65535' });
    }

    // Check ownership
    if (!await isIpOwner(req.user!.userId, ip_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: rule, error } = await supabase
      .from('firewall_rules')
      .insert([{
        ip_id,
        port,
        protocol,
        action: action || 'allow',
        description,
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Firewall rule already exists for this port and protocol' });
      }
      throw error;
    }

    res.status(201).json(rule);
  } catch (error) {
    console.error('Create firewall rule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update firewall rule (owner only)
router.put('/:id', writeLimiter, authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, description } = req.body;

    // Get rule to check IP ownership
    const { data: rule } = await supabase
      .from('firewall_rules')
      .select('ip_id')
      .eq('id', id)
      .single();

    if (!rule || !await isIpOwner(req.user!.userId, rule.ip_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates: any = {};
    if (action !== undefined) updates.action = action;
    if (description !== undefined) updates.description = description;

    const { data: updatedRule, error } = await supabase
      .from('firewall_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(updatedRule);
  } catch (error) {
    console.error('Update firewall rule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete firewall rule (owner only)
router.delete('/:id', writeLimiter, authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get rule to check IP ownership
    const { data: rule } = await supabase
      .from('firewall_rules')
      .select('ip_id')
      .eq('id', id)
      .single();

    if (!rule || !await isIpOwner(req.user!.userId, rule.ip_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase.from('firewall_rules').delete().eq('id', id);

    if (error) throw error;

    res.json({ message: 'Firewall rule deleted successfully' });
  } catch (error) {
    console.error('Delete firewall rule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
