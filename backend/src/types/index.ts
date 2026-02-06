export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'owner' | 'subuser';
  full_name?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface IPAddress {
  id: string;
  ip_address: string;
  label?: string;
  owner_id: string;
  status: 'active' | 'inactive' | 'blocked';
  firewall_mode: 'accept' | 'filter' | 'drop';
  created_at: string;
  updated_at: string;
}

export interface AttackLog {
  id: string;
  ip_id: string;
  attack_type: string;
  source_ip: string;
  source_port?: number;
  destination_port?: number;
  protocol: string;
  packet_size?: number;
  country_code?: string;
  asn?: string;
  blocked: boolean;
  attack_time: string;
  created_at: string;
}

export interface GeoBlock {
  id: string;
  ip_id: string;
  country_code: string;
  action: 'block' | 'allow';
  created_at: string;
}

export interface FirewallRule {
  id: string;
  ip_id: string;
  port: number;
  protocol: 'tcp' | 'udp' | 'both';
  action: 'allow' | 'deny';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AttackAnalytics {
  id: string;
  ip_id: string;
  date: string;
  total_attacks: number;
  total_blocked: number;
  total_packets: number;
  total_bytes: number;
  unique_sources: number;
  top_country_code?: string;
  top_attack_type?: string;
  created_at: string;
  updated_at: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'owner' | 'subuser';
}

export interface AuthRequest extends Express.Request {
  user?: JWTPayload;
}
