# DDoS Engine - eBPF/XDP Packet Filtering

This module implements the core DDoS protection engine using eBPF (Extended Berkeley Packet Filter) and XDP (eXpress Data Path) for high-performance packet filtering at the kernel level.

## 🚀 Features

### L3/L4 Protection
- **SYN Flood Protection**: Rate limiting and SYN cookies
- **UDP Flood Protection**: Per-source rate limiting
- **ICMP Flood Protection**: ICMP packet rate control
- **Connection Rate Limiting**: Per-IP connection tracking
- **Packet Size Filtering**: Drop abnormally sized packets

### L7 Protection (Application Layer)
- **HTTP Flood Protection**: Request rate limiting
- **Slowloris Protection**: Timeout-based connection tracking
- **HTTP Method Filtering**: Block suspicious HTTP methods
- **User-Agent Filtering**: Block known bot user agents
- **Geographic Filtering**: Country-based blocking using GeoIP

## 🔧 Technology Stack

- **eBPF/XDP**: Kernel-level packet filtering
- **libbpf**: User-space library for eBPF programs
- **Cilium**: Advanced eBPF networking
- **Go**: Control plane and API integration
- **C**: eBPF programs

## 📁 Structure

```
ddos-engine/
├── bpf/              # eBPF programs (C)
│   ├── xdp_filter.c
│   ├── connection_tracker.c
│   └── rate_limiter.c
├── cmd/              # Main application
│   └── main.go
├── pkg/              # Go packages
│   ├── bpf/         # eBPF loader
│   ├── config/      # Configuration
│   ├── rules/       # Rule engine
│   └── stats/       # Statistics collector
└── Dockerfile
```

## 🛠️ Implementation Plan

### Phase 1: Basic XDP Filter
- XDP program to drop packets based on IP blacklist
- Simple connection tracking
- Basic statistics collection

### Phase 2: Advanced L3/L4
- SYN flood detection and mitigation
- UDP amplification protection
- Connection rate limiting per IP

### Phase 3: L7 Protection
- HTTP request inspection
- URL filtering
- SSL/TLS inspection support

### Phase 4: Integration
- Real-time stats to backend API
- WebSocket updates for dashboard
- Rule synchronization from database

## 📊 Performance Expectations

- **Throughput**: 10+ Gbps per CPU core
- **Latency**: < 10 microseconds packet processing
- **Scalability**: Linear scaling with CPU cores
- **Memory**: < 100 MB for tracking 1M connections

## 🚦 Getting Started

### Prerequisites

```bash
# Install dependencies (Ubuntu/Debian)
apt-get update
apt-get install -y \
    clang \
    llvm \
    libbpf-dev \
    linux-headers-$(uname -r) \
    golang-go
```

### Build

```bash
# Compile eBPF programs
make bpf

# Build Go application
make build
```

### Run

```bash
# Load XDP program on interface
./ddos-engine --interface eth0 --config config.yaml
```

## 📝 Configuration Example

```yaml
interfaces:
  - eth0

protection:
  l3_l4:
    syn_flood:
      enabled: true
      threshold: 1000  # packets per second
    udp_flood:
      enabled: true
      threshold: 5000
  
  l7:
    http_flood:
      enabled: true
      threshold: 100  # requests per second
    
geoblocking:
  enabled: true
  blocked_countries:
    - CN
    - RU

rules:
  - type: ip_blacklist
    ips:
      - 192.168.1.100
      - 10.0.0.5
  
  - type: port_allow
    ports:
      - 80
      - 443
      - 22
```

## 🔐 Security Considerations

- Runs with CAP_NET_ADMIN capability
- Uses seccomp for syscall filtering
- Regular security audits recommended
- Log all dropped packets for analysis

## 📈 Monitoring

The engine exports metrics in Prometheus format:

- `ddos_packets_received_total`
- `ddos_packets_dropped_total`
- `ddos_connections_tracked`
- `ddos_attacks_detected_total`

## 🤝 Integration with Backend

The engine communicates with the backend API via:

1. **REST API**: Fetch rules and configuration
2. **WebSocket**: Push real-time attack data
3. **Database**: Log attack events to Supabase

## 📚 References

- [XDP Tutorial](https://github.com/xdp-project/xdp-tutorial)
- [eBPF Documentation](https://ebpf.io/)
- [Cilium eBPF Library](https://github.com/cilium/ebpf)
- [libbpf](https://github.com/libbpf/libbpf)

## 🔄 Development Status

**Status**: Architecture & Placeholder

This is currently a placeholder structure. The actual eBPF/XDP implementation requires:
1. C programs for XDP packet filtering
2. Go control plane for rule management
3. Integration with the backend API
4. Extensive testing in production-like environment

---

**Note**: Full eBPF/XDP implementation is complex and requires kernel expertise. This module outlines the architecture and can be implemented incrementally based on requirements.
