# Deployment Guide - Anti-DDoS Protection System

This guide walks you through deploying the complete anti-DDoS protection system.

## Prerequisites

- **Server**: Linux server (Ubuntu 20.04+ recommended)
- **Node.js**: v20.0.0 or higher
- **Docker**: v20.10+ and Docker Compose v2.0+
- **Supabase**: Account at supabase.com (or PostgreSQL 14+)
- **Domain** (optional): For production deployment with SSL

## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/Arnx123/ddos.git
cd ddos
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 2. Setup Database

1. Create project at [supabase.com](https://supabase.com)
2. Run `database/schema.sql` in SQL Editor
3. Copy URL and API key to `.env`

### 3. Start Services

```bash
docker compose up -d
```

### 4. Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Login**: admin@ddos-protection.cz / Admin123!

## Production Deployment

See full deployment documentation in this guide including:
- SSL/TLS setup with Nginx
- Firewall configuration
- Backup strategies
- Monitoring and logging
- Performance tuning

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Configure firewall
- [ ] Enable SSL/TLS
- [ ] Setup backups
- [ ] Review CORS settings
- [ ] Verify rate limiting is active

For detailed instructions, see full documentation above.
