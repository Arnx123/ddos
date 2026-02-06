import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Helper function to check IP access
async function hasIpAccess(userId: string, role: string, ipId: string): Promise<boolean> {
  const { data: ip } = await supabase
    .from('ip_addresses')
    .select('owner_id')
    .eq('id', ipId)
    .single();

  if (!ip) return false;

  if (role === 'owner') {
    return ip.owner_id === userId;
  }

  // Check subuser assignment
  const { data: assignment } = await supabase
    .from('user_ip_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('ip_id', ipId)
    .single();

  return !!assignment;
}

// Get attack logs for IP
router.get('/:ipId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { ipId } = req.params;
    const { limit = '100', offset = '0', startDate, endDate } = req.query;

    // Check access
    const hasAccess = await hasIpAccess(req.user!.userId, req.user!.role, ipId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = supabase
      .from('attack_logs')
      .select('*', { count: 'exact' })
      .eq('ip_id', ipId)
      .order('attack_time', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (startDate) {
      query = query.gte('attack_time', startDate);
    }
    if (endDate) {
      query = query.lte('attack_time', endDate);
    }

    const { data: attacks, error, count } = await query;

    if (error) throw error;

    res.json({
      attacks: attacks || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Get attacks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attack statistics for IP
router.get('/:ipId/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { ipId } = req.params;
    const { days = '7' } = req.query;

    // Check access
    const hasAccess = await hasIpAccess(req.user!.userId, req.user!.role, ipId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    // Get total attacks
    const { count: totalAttacks } = await supabase
      .from('attack_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_id', ipId)
      .gte('attack_time', daysAgo.toISOString());

    // Get blocked attacks
    const { count: blockedAttacks } = await supabase
      .from('attack_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_id', ipId)
      .eq('blocked', true)
      .gte('attack_time', daysAgo.toISOString());

    // Get top countries
    const { data: topCountries } = await supabase
      .from('attack_logs')
      .select('country_code')
      .eq('ip_id', ipId)
      .gte('attack_time', daysAgo.toISOString())
      .not('country_code', 'is', null);

    const countryCounts: Record<string, number> = {};
    topCountries?.forEach(log => {
      const cc = log.country_code;
      countryCounts[cc] = (countryCounts[cc] || 0) + 1;
    });

    const topCountriesSorted = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({ country_code: code, count }));

    // Get top ASNs
    const { data: topAsns } = await supabase
      .from('attack_logs')
      .select('asn')
      .eq('ip_id', ipId)
      .gte('attack_time', daysAgo.toISOString())
      .not('asn', 'is', null);

    const asnCounts: Record<string, number> = {};
    topAsns?.forEach(log => {
      const asn = log.asn;
      asnCounts[asn] = (asnCounts[asn] || 0) + 1;
    });

    const topAsnsSorted = Object.entries(asnCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([asn, count]) => ({ asn, count }));

    // Get top ports
    const { data: topPorts } = await supabase
      .from('attack_logs')
      .select('destination_port')
      .eq('ip_id', ipId)
      .gte('attack_time', daysAgo.toISOString())
      .not('destination_port', 'is', null);

    const portCounts: Record<number, number> = {};
    topPorts?.forEach(log => {
      const port = log.destination_port;
      portCounts[port] = (portCounts[port] || 0) + 1;
    });

    const topPortsSorted = Object.entries(portCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([port, count]) => ({ port: parseInt(port), count }));

    // Get top protocols
    const { data: topProtocols } = await supabase
      .from('attack_logs')
      .select('protocol')
      .eq('ip_id', ipId)
      .gte('attack_time', daysAgo.toISOString());

    const protocolCounts: Record<string, number> = {};
    topProtocols?.forEach(log => {
      const protocol = log.protocol;
      protocolCounts[protocol] = (protocolCounts[protocol] || 0) + 1;
    });

    const topProtocolsSorted = Object.entries(protocolCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([protocol, count]) => ({ protocol, count }));

    res.json({
      total_attacks: totalAttacks || 0,
      blocked_attacks: blockedAttacks || 0,
      top_countries: topCountriesSorted,
      top_asns: topAsnsSorted,
      top_ports: topPortsSorted,
      top_protocols: topProtocolsSorted,
    });
  } catch (error) {
    console.error('Get attack stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create attack log (for testing/simulation)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      ip_id,
      attack_type,
      source_ip,
      source_port,
      destination_port,
      protocol,
      packet_size,
      country_code,
      asn,
      blocked,
    } = req.body;

    // Check access
    const hasAccess = await hasIpAccess(req.user!.userId, req.user!.role, ip_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: attack, error } = await supabase
      .from('attack_logs')
      .insert([{
        ip_id,
        attack_type,
        source_ip,
        source_port,
        destination_port,
        protocol,
        packet_size,
        country_code,
        asn,
        blocked: blocked || false,
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(attack);
  } catch (error) {
    console.error('Create attack log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
