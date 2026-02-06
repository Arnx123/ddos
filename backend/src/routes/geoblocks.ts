import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest, authenticateToken, requireOwner } from '../middleware/auth';

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

// Get geo-blocks for IP
router.get('/:ipId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { ipId } = req.params;

    // Check ownership
    if (req.user!.role === 'owner' && !await isIpOwner(req.user!.userId, ipId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: blocks, error } = await supabase
      .from('geo_blocks')
      .select('*')
      .eq('ip_id', ipId)
      .order('country_code');

    if (error) throw error;

    res.json(blocks || []);
  } catch (error) {
    console.error('Get geo-blocks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create geo-block (owner only)
router.post('/', authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { ip_id, country_code, action } = req.body;

    if (!ip_id || !country_code) {
      return res.status(400).json({ error: 'IP ID and country code are required' });
    }

    // Check ownership
    if (!await isIpOwner(req.user!.userId, ip_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: block, error } = await supabase
      .from('geo_blocks')
      .insert([{
        ip_id,
        country_code: country_code.toUpperCase(),
        action: action || 'block',
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Geo-block already exists for this country' });
      }
      throw error;
    }

    res.status(201).json(block);
  } catch (error) {
    console.error('Create geo-block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update geo-block (owner only)
router.put('/:id', authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    // Get block to check IP ownership
    const { data: block } = await supabase
      .from('geo_blocks')
      .select('ip_id')
      .eq('id', id)
      .single();

    if (!block || !await isIpOwner(req.user!.userId, block.ip_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: updatedBlock, error } = await supabase
      .from('geo_blocks')
      .update({ action })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(updatedBlock);
  } catch (error) {
    console.error('Update geo-block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete geo-block (owner only)
router.delete('/:id', authenticateToken, requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get block to check IP ownership
    const { data: block } = await supabase
      .from('geo_blocks')
      .select('ip_id')
      .eq('id', id)
      .single();

    if (!block || !await isIpOwner(req.user!.userId, block.ip_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase.from('geo_blocks').delete().eq('id', id);

    if (error) throw error;

    res.json({ message: 'Geo-block deleted successfully' });
  } catch (error) {
    console.error('Delete geo-block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
