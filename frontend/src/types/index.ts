export interface User {
  id: string;
  email: string;
  role: 'owner' | 'subuser';
  full_name?: string;
  created_at: string;
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

export interface AttackStats {
  total_attacks: number;
  blocked_attacks: number;
  top_countries: Array<{ country_code: string; count: number }>;
  top_asns: Array<{ asn: string; count: number }>;
  top_ports: Array<{ port: number; count: number }>;
  top_protocols: Array<{ protocol: string; count: number }>;
}
