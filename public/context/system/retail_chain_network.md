# Multi-Location Retail Chain Network System

**Overview**: A regional retail clothing chain operating 50 identical stores across three states, supporting approximately 2,000 total users (1,500 employees + 500 concurrent point-of-sale systems). The network employs a standardized hub-and-spoke architecture with centralized services and management. Each store follows identical configurations to simplify support and maintenance operations.

## Store-Level Infrastructure (Per Location)

### Edge Networking Equipment
- **Primary Router**: Cisco ISR 4321
  - Primary WAN: 50Mbps dedicated fiber
  - Backup WAN: 25Mbps cellular (Verizon)
  - 2x Gigabit Ethernet modules
  - VPN capabilities to headquarters

- **Access Switch Stack**: 
  - 1x Cisco Catalyst 2960X-24TS-L (data network)
  - 1x Cisco Catalyst 2960X-24PD-L (PoE for phones/cameras)
  - Stacked for single management point

- **Wireless Infrastructure**:
  - 2x Cisco Aironet 2802i access points
  - Employee network (WPA2-Enterprise)
  - Customer WiFi (captive portal)
  - Coverage: Sales floor and back office

### Store Systems
- **Point of Sale**: 
  - 10x NCR Aloha terminals per store
  - Dedicated POS VLAN
  - Connection to central payment processing

- **Security Systems**:
  - Hikvision DS-7732NI-K4 NVR (32 channels)
  - 20x IP cameras (mix of dome and bullet)
  - Motion detection and scheduled recording

- **Office Equipment**:
  - 2x workstations (manager office)
  - 1x multifunction printer/scanner
  - Time clock integration (ADP)

## Headquarters Infrastructure

### Core Network
- **Core Routers**: 
  - 2x Cisco ISR 4451-X (active/standby HSRP)
  - Redundant Internet: 1Gbps fiber + 500Mbps backup
  - BGP routing with dual providers

- **Distribution Layer**:
  - 2x Cisco Catalyst 9500-40X
  - 40x 10Gb SFP+ ports each
  - Virtual StackWise for redundancy

- **Access Layer**:
  - 8x Cisco Catalyst 9300-24T switches
  - 1Gb access ports for workstations
  - PoE+ for phones and access points

### Data Center Infrastructure
- **Servers**: Virtualized on VMware vSphere 7.0
  - 3x Dell PowerEdge R750 hosts (vSAN cluster)
  - Total resources: 288 CPU cores, 1.5TB RAM
  - 45TB all-flash storage

- **Virtual Machines**:
  - Domain Controllers (2x Windows Server 2019)
  - SQL Server cluster (retail database)
  - File servers (2x with DFS replication)
  - SCCM server (patch management)
  - SCOM monitoring server

### Storage & Backup
- **Primary Storage**: Dell PowerStore 1000T
  - 100TB raw capacity
  - Automatic tiering
  - Snapshot capabilities

- **Backup Systems**:
  - Veeam Backup & Replication
  - Nightly incremental backups
  - Weekly synthetic fulls
  - Off-site replication to cloud

## Network Design & Addressing

### VLAN Architecture (Per Store)
- **VLAN 10**: Management (192.168.10.0/24)
- **VLAN 20**: Point of Sale (192.168.20.0/24)
- **VLAN 30**: Employee WiFi (192.168.30.0/24)
- **VLAN 40**: Cameras/Security (192.168.40.0/24)
- **VLAN 50**: Customer WiFi (192.168.50.0/24)

### WAN Addressing
- Store networks: 10.100.x.0/24 (where x = store number)
- Headquarters: 10.0.0.0/16
- MPLS VPN with QoS priorities

### Routing Protocol
- EIGRP within each site
- BGP between sites
- Route summarization at store edges

## Security Infrastructure

### Perimeter Security
- **Headquarters**: Palo Alto PA-5220 firewall cluster
- **Stores**: Integrated firewall on ISR 4321
- **IPS**: Snort-based detection on all WAN links

### Network Security
- **NAC**: Cisco ISE for device authentication
- **802.1X**: Wired and wireless authentication
- **Segmentation**: VLANs with inter-VLAN ACLs

### Endpoint Security
- **Antivirus**: Symantec Endpoint Protection
- **Patch Management**: WSUS for Windows, SCCM for deployment
- **Device Control**: USB port restrictions via GPO

## Management & Operations

### Monitoring Systems
- **Network**: SolarWinds NPM
- **Servers**: SCOM 2019
- **Applications**: New Relic APM
- **Security**: Splunk SIEM

### Automation & Orchestration
- **Configuration Management**: Cisco Prime Infrastructure
- **Deployment**: Ansible playbooks for standard configs
- **Monitoring**: SNMP with custom OIDs

### Service Desk Operations
- **Platform**: ServiceNow
- **Escalation**: Tier 1 (stores) → Tier 2 (regional) → Tier 3 (HQ)
- **SLA**: 4-hour response for critical issues

## Compliance & Governance

### PCI DSS Compliance
- Network segmentation for card processing
- Regular vulnerability scans (Nessus)
- Quarterly penetration testing
- Encrypted data in transit and at rest

### Change Management
- RFC process through ServiceNow
- Change Advisory Board (weekly meetings)
- Emergency change procedures
- Rollback plans for all changes

## Business Continuity

### Redundancy Measures
- Dual ISP connections at HQ
- Cellular backup at all stores
- Redundant power (UPS + generator)
- Geographic data replication

### Disaster Recovery
- **RTO**: 4 hours for critical systems
- **RPO**: 15 minutes for transactional data
- **Hot site**: Colo facility with pre-staged equipment
- **Testing**: Quarterly DR drills

## Performance Metrics

### Network KPIs
- Link utilization: < 70% typical
- Latency HQ to stores: < 50ms
- Packet loss: < 0.1%
- Availability: 99.9% target (measured monthly)

### Application Performance
- POS transaction time: < 3 seconds
- File server response: < 500ms
- WiFi throughput: 25Mbps minimum per AP
- VPN tunnel establishment: < 10 seconds