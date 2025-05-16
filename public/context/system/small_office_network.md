# Small Office Network System

**Overview**: A single-location professional services firm with 20 employees supporting accounting, legal, and consulting operations. The network provides basic business connectivity with shared resources, internet access, and simple security measures. Managed by a part-time IT contractor with minimal on-site technical staff.

## Network Infrastructure

### Core Equipment
- **Router**: Cisco ISR 1111-8P
  - WAN: Single 100Mbps fiber connection (Comcast Business)
  - LAN: 8x Gigabit Ethernet ports
  - Integrated firewall and VPN capabilities
  - Model: ISR1111-8P

- **Main Switch**: Cisco Catalyst 2960-24TC-L
  - 24x Gigabit Ethernet ports
  - 2x Gigabit SFP uplinks
  - Layer 2 switching only
  - PoE budget: 370W

- **Wireless Access Points**: 
  - Cisco Aironet 1815i (2 units)
  - 802.11ac Wave 2
  - Dual-band 2.4/5GHz
  - Ceiling mounted in office areas

### Server Infrastructure
- **File Server**: Dell PowerEdge T140
  - CPU: Intel Xeon E-2124 3.3GHz
  - RAM: 16GB DDR4
  - Storage: 4TB RAID 1 (2x 4TB SATA drives)
  - OS: Windows Server 2019 Standard
  - Services: Active Directory, DNS, DHCP, File Shares

- **Backup System**: Synology DS418 NAS
  - 4-bay NAS enclosure
  - 8TB usable storage (RAID 5)
  - Automated daily backups of server data

## Network Configuration

### IP Addressing
- **LAN Subnet**: 192.168.1.0/24
- **Gateway/Router**: 192.168.1.1
- **DNS Servers**: 192.168.1.10 (internal), 8.8.8.8 (backup)
- **DHCP Pool**: 192.168.1.100 - 192.168.1.200

### Static IP Assignments
- Router/Gateway: 192.168.1.1
- File Server: 192.168.1.10
- NAS Backup: 192.168.1.11
- Printer 1: 192.168.1.15
- Printer 2: 192.168.1.16
- Access Point 1: 192.168.1.20
- Access Point 2: 192.168.1.21

### VLAN Structure
- **VLAN 1 (Default)**: All devices on single broadcast domain
- **Management VLAN**: None configured
- **Guest VLAN**: None configured (guest access via time-limited passwords)

## Security Infrastructure

### Firewall Rules
- Default deny all from WAN to LAN
- Allow established/related connections
- HTTP/HTTPS outbound permitted
- Email (POP3/IMAP/SMTP) outbound permitted
- Block P2P traffic
- Basic IDS enabled

### Wireless Security
- **Employee SSID**: "CompanyWiFi"
  - WPA3-Personal encryption
  - Shared passphrase (rotated quarterly)
- **Guest SSID**: "Guest-WiFi"
  - WPA2-Personal encryption
  - Daily password rotation
  - Bandwidth limited to 10Mbps per client

### Access Control
- Local user accounts on Windows Server
- File share permissions by user groups
- No centralized patch management
- Manual security updates

## Management & Monitoring

### Administrative Access
- **Router Management**: Cisco ASDM web interface
- **Switch Management**: Telnet/SSH and web interface
- **Server Management**: Remote Desktop Protocol
- **Wireless Management**: Cisco Express GUI

### Monitoring Systems
- Basic SNMP enabled on all devices
- No centralized monitoring platform
- Router logs stored locally (7 days retention)
- Manual monitoring via device interfaces

### Backup & Recovery
- **Daily Incremental**: File server to NAS (automatic)
- **Weekly Full**: Complete server backup to NAS
- **Monthly Offsite**: Manual rotation of portable drives
- **Recovery RTO**: 4-8 hours for full system restore

## Physical Infrastructure

### Rack Equipment
- 12U wall-mounted rack in IT closet
- Basic cable management
- Single UPS (APC Smart-UPS 1500VA)
- Environmental monitoring: None

### Cabling
- Cat6 structured cabling to all workstations
- Fiber uplink from ISP to router
- No redundant pathways
- Cable testing performed at installation only

## End User Devices

### Workstations
- 20x Dell OptiPlex desktops
- Windows 10 Professional
- Office 365 subscriptions
- Antivirus: Windows Defender

### Shared Resources
- 2x HP LaserJet Pro network printers
- 1x HP OfficeJet multifunction device
- Shared file storage on Windows Server
- Email: Office 365 cloud-hosted

## Support & Maintenance

### Service Contracts
- ISP SLA: 4-hour response, 99.5% uptime
- Hardware warranty: 3-year standard on all equipment
- No professional monitoring services
- Part-time IT support: 4 hours/month

### Change Management
- Informal change process
- Changes documented in shared spreadsheet
- No testing environment
- Updates applied during business hours