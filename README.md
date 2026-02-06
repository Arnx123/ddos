# 🛡️ Anti-DDoS Protection System

Kompletní enterprise anti-DDoS systém s moderním admin panelem, podporující L3, L4, L7 ochranu, geoblokaci a real-time monitoring.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)

## ✨ Funkce

### 🔐 Ochrana DDoS
- **L3/L4 ochrana**: SYN flood, UDP flood, ICMP flood protection
- **L7 ochrana**: HTTP flood, Slowloris, aplikační útoky
- **eBPF/XDP**: Vysokovýkonné filtrování paketů na úrovni kernelu
- **Real-time blocking**: Okamžité blokování útočníků

### 👥 Správa uživatelů
- **Owner role**: Plná správa systému a všech IP adres
- **Subuser role**: Omezený přístup k přiděleným IP adresám
- **JWT autentizace**: Bezpečné přihlášení s tokeny
- **Správa oprávnění**: Flexibilní přiřazování IP k uživatelům

### 📊 Monitoring a analytika
- **Real-time grafy**: Donut a bar charts pomocí Recharts
- **Geografická analýza**: Top země původu útoků
- **ASN tracking**: Sledování útoků podle autonomních systémů
- **Port analýza**: Nejčastěji napadané porty
- **Protokol statistiky**: TCP/UDP/ICMP breakdowns

### 🌍 Geoblokace
- **Blokování zemí**: Blokování podle ISO country kódů
- **Whitelist/Blacklist**: Flexibilní allow/deny pravidla
- **15+ přednastavených zemí**: Rychlé přidání běžných zemí

### 🔥 Firewall
- **3 režimy**: Accept, Filter, Drop
- **Port pravidla**: TCP/UDP/Both port configuration
- **Popis pravidel**: Dokumentace každého pravidla
- **Hromadná správa**: Rychlá konfigurace portů

### 🎨 UI/UX
- **Tmavý moderní design**: Profesionální vzhled
- **Responsive layout**: Funguje na všech zařízeních
- **Real-time updates**: WebSocket komunikace
- **České UI**: Kompletně česky lokalizované

## 🏗️ Architektura

```
ddos/
├── backend/          # Express.js REST API + WebSocket
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── middleware/ # Auth, validation
│   │   ├── config/   # Configuration
│   │   └── server.ts # Main server
│   └── package.json
│
├── frontend/         # Next.js 14 App Router
│   ├── src/
│   │   ├── app/      # Pages (login, dashboard, attacks, etc.)
│   │   ├── components/ # React components
│   │   ├── lib/      # API client, store
│   │   └── types/    # TypeScript types
│   └── package.json
│
├── ddos-engine/      # eBPF/XDP packet filtering
│   ├── bpf/          # eBPF programs (C)
│   ├── pkg/          # Go control plane
│   └── README.md
│
├── database/         # Supabase SQL schema
│   └── schema.sql
│
└── docker-compose.yml
```

## 📦 Technologie

### Backend
- **Express.js** - REST API framework
- **TypeScript** - Type safety
- **Socket.io** - Real-time WebSocket communication
- **Supabase** - PostgreSQL database with RLS
- **JWT** - Secure authentication
- **bcrypt** - Password hashing

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Beautiful data visualization
- **Zustand** - State management
- **Socket.io-client** - Real-time updates

### DDoS Engine
- **eBPF/XDP** - Kernel-level packet filtering
- **Go** - Control plane
- **libbpf** - eBPF library
- **Cilium** - Advanced networking

### Database
- **Supabase** - PostgreSQL with built-in auth
- **Row Level Security** - Data isolation
- **Real-time subscriptions** - Live data updates

## 🚀 Rychlý start

### Předpoklady

- Node.js 20+
- Docker & Docker Compose
- Supabase account (nebo vlastní PostgreSQL)

### 1. Klonování repozitáře

```bash
git clone https://github.com/yourusername/ddos.git
cd ddos
```

### 2. Konfigurace prostředí

```bash
# Zkopírujte example config
cp .env.example .env

# Upravte .env s vašimi Supabase credentials
nano .env
```

### 3. Nastavení databáze

1. Vytvořte nový projekt na [Supabase](https://supabase.com)
2. V SQL editoru spusťte `database/schema.sql`
3. Zkopírujte URL a anon key do `.env`

### 4. Spuštění s Docker Compose

```bash
# Build a spuštění všech služeb
docker-compose up -d

# Sledování logů
docker-compose logs -f
```

### 5. Nebo lokální vývoj

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔑 Výchozí přihlášení

- **Email**: `admin@ddos-protection.cz`
- **Heslo**: `Admin123!`

⚠️ **Důležité**: Změňte heslo po prvním přihlášení!

## 📖 API Dokumentace

### Autentizace

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ddos-protection.cz",
  "password": "Admin123!"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "admin@ddos-protection.cz",
    "role": "owner"
  }
}
```

### IP Adresy

```bash
# Získat všechny IP
GET /api/ips
Authorization: Bearer <token>

# Přidat IP (owner only)
POST /api/ips
Authorization: Bearer <token>
Content-Type: application/json

{
  "ip_address": "192.168.1.100",
  "label": "Web Server",
  "firewall_mode": "filter"
}
```

### Statistiky útoků

```bash
GET /api/attacks/:ipId/stats?days=7
Authorization: Bearer <token>

Response:
{
  "total_attacks": 1234,
  "blocked_attacks": 1200,
  "top_countries": [...],
  "top_ports": [...],
  "top_protocols": [...]
}
```

Více v [API dokumentaci](docs/API.md)

## 🎨 Barevné schéma

```css
--primary-bg: #0a0e1a       /* Hlavní pozadí */
--card-bg: #1e2535          /* Karty a panely */
--primary-blue: #3b82f6     /* Primární modrá */
--success: #10b981          /* Zelená (úspěch) */
--danger: #ef4444           /* Červená (nebezpečí) */
--warning: #f59e0b          /* Oranžová (varování) */
```

## 📊 Screenshots

### Dashboard
Grid zobrazení IP adres s real-time statusem

### Analýza útoků
Grafy s breakdown podle zemí, ASN, portů a protokolů

### Firewall
3 režimy s vizuální indikací aktivního režimu

### Geoblokace
Tabulka blokovaných zemí s možností přidání/odebrání

## 🔒 Bezpečnost

- **JWT tokens** s 24h expirací
- **bcrypt** hash hesel (10 rounds)
- **Row Level Security** v Supabase
- **CORS** omezení na definované origins
- **Input validation** na všech endpointech
- **Role-based access control**

## 🧪 Testování

```bash
# Backend testy
cd backend
npm test

# Frontend testy
cd frontend
npm test

# E2E testy
npm run test:e2e
```

## 📈 Výkon

- **API Response time**: < 100ms (avg)
- **WebSocket latency**: < 50ms
- **Dashboard load**: < 2s
- **XDP throughput**: 10+ Gbps per core

## 🤝 Přispívání

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork repozitář
2. Vytvořte feature branch (`git checkout -b feature/amazing`)
3. Commit změny (`git commit -m 'Add amazing feature'`)
4. Push do branch (`git push origin feature/amazing`)
5. Otevřete Pull Request

## 📝 License

MIT License - viz [LICENSE](LICENSE) soubor

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) za skvělou databázi
- [Next.js](https://nextjs.org) za moderní React framework
- [Recharts](https://recharts.org) za krásné grafy
- [Tailwind CSS](https://tailwindcss.com) za styling system

## 📞 Kontakt

- **Email**: support@ddos-protection.cz
- **Discord**: [Join our server](https://discord.gg/example)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ddos/issues)

---

Vytvořeno s ❤️ pro bezpečnější internet