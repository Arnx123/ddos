-- Anti-DDoS Protection System Database Schema
-- This schema defines all tables and relationships for the DDoS protection platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'subuser')),
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- IP addresses table
CREATE TABLE ip_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET UNIQUE NOT NULL,
    label VARCHAR(255),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    firewall_mode VARCHAR(20) DEFAULT 'accept' CHECK (firewall_mode IN ('accept', 'filter', 'drop')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-IP assignments (for subusers)
CREATE TABLE user_ip_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_id UUID NOT NULL REFERENCES ip_addresses(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ip_id)
);

-- Attack logs
CREATE TABLE attack_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_id UUID NOT NULL REFERENCES ip_addresses(id) ON DELETE CASCADE,
    attack_type VARCHAR(50) NOT NULL,
    source_ip INET NOT NULL,
    source_port INTEGER,
    destination_port INTEGER,
    protocol VARCHAR(10) NOT NULL,
    packet_size INTEGER,
    country_code VARCHAR(2),
    asn VARCHAR(50),
    blocked BOOLEAN DEFAULT false,
    attack_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_attack_logs_ip_id ON attack_logs(ip_id);
CREATE INDEX idx_attack_logs_attack_time ON attack_logs(attack_time);
CREATE INDEX idx_attack_logs_country ON attack_logs(country_code);

-- Geo-blocking rules
CREATE TABLE geo_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_id UUID NOT NULL REFERENCES ip_addresses(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL,
    action VARCHAR(20) DEFAULT 'block' CHECK (action IN ('block', 'allow')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ip_id, country_code)
);

-- Firewall rules (port-based rules)
CREATE TABLE firewall_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_id UUID NOT NULL REFERENCES ip_addresses(id) ON DELETE CASCADE,
    port INTEGER NOT NULL CHECK (port >= 1 AND port <= 65535),
    protocol VARCHAR(10) NOT NULL CHECK (protocol IN ('tcp', 'udp', 'both')),
    action VARCHAR(20) DEFAULT 'allow' CHECK (action IN ('allow', 'deny')),
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ip_id, port, protocol)
);

-- Attack analytics (aggregated statistics)
CREATE TABLE attack_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_id UUID NOT NULL REFERENCES ip_addresses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_attacks INTEGER DEFAULT 0,
    total_blocked INTEGER DEFAULT 0,
    total_packets BIGINT DEFAULT 0,
    total_bytes BIGINT DEFAULT 0,
    unique_sources INTEGER DEFAULT 0,
    top_country_code VARCHAR(2),
    top_attack_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ip_id, date)
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ip_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attack_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE firewall_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attack_analytics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- IP addresses policies
CREATE POLICY "Owners can view their IPs" ON ip_addresses
    FOR SELECT USING (
        owner_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM user_ip_assignments 
            WHERE user_id = auth.uid() AND ip_id = id
        )
    );

CREATE POLICY "Owners can manage their IPs" ON ip_addresses
    FOR ALL USING (owner_id = auth.uid());

-- Attack logs policies
CREATE POLICY "Users can view attack logs for their IPs" ON attack_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ip_addresses 
            WHERE id = ip_id 
            AND (
                owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_ip_assignments 
                    WHERE user_id = auth.uid() AND ip_id = ip_addresses.id
                )
            )
        )
    );

-- Geo-blocks policies
CREATE POLICY "Users can view geo-blocks for their IPs" ON geo_blocks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ip_addresses 
            WHERE id = ip_id 
            AND (
                owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_ip_assignments 
                    WHERE user_id = auth.uid() AND ip_id = ip_addresses.id
                )
            )
        )
    );

CREATE POLICY "Owners can manage geo-blocks" ON geo_blocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ip_addresses 
            WHERE id = ip_id AND owner_id = auth.uid()
        )
    );

-- Firewall rules policies
CREATE POLICY "Users can view firewall rules for their IPs" ON firewall_rules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ip_addresses 
            WHERE id = ip_id 
            AND (
                owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_ip_assignments 
                    WHERE user_id = auth.uid() AND ip_id = ip_addresses.id
                )
            )
        )
    );

CREATE POLICY "Owners can manage firewall rules" ON firewall_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ip_addresses 
            WHERE id = ip_id AND owner_id = auth.uid()
        )
    );

-- Attack analytics policies
CREATE POLICY "Users can view analytics for their IPs" ON attack_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ip_addresses 
            WHERE id = ip_id 
            AND (
                owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_ip_assignments 
                    WHERE user_id = auth.uid() AND ip_id = ip_addresses.id
                )
            )
        )
    );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_addresses_updated_at BEFORE UPDATE ON ip_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_firewall_rules_updated_at BEFORE UPDATE ON firewall_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attack_analytics_updated_at BEFORE UPDATE ON attack_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default owner user (password: Admin123!)
-- Password hash is bcrypt hash of 'Admin123!'
INSERT INTO users (email, password_hash, role, full_name)
VALUES ('admin@ddos-protection.cz', '$2b$10$xQnQfzqEHBqKRY5f5.5j1.uI7jGzKqGvJXL8xBFvRvXGmCqKqBKOK', 'owner', 'System Administrator')
ON CONFLICT (email) DO NOTHING;
