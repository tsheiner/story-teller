# Medium Enterprise Network System

**Overview**: A mid-sized manufacturing company with 500 employees across a main campus and two satellite offices. The network supports both traditional office applications and industrial systems in the production environment. The infrastructure emphasizes security and segregation between corporate IT and operational technology (OT) networks.

## Core Infrastructure

### Data Center Equipment
- **Core Switches**: 2x Cisco Nexus 9372PX
  - 48x 1/10GbE SFP+ ports each
  - vPC for redundancy
  - Layer 3 routing capabilities

- **Distribution Switches**: 4x Cisco Catalyst 9400
  - Modular chassis with line cards
  - StackWise Virtual clustering
  - 384 access ports total

- **Border Routers**: 2x Cisco ASR 1001-X
  - Dual ISP connections (primary: 500Mbps, backup: 100Mbps)
  - BGP routing with load balancing
  - VPN termination for remote sites

### Wireless Infrastructure
- **Controller**: Cisco 9800-CL (virtual appliance)
- **Access Points**: 45x Cisco Aironet 2802i
  - Wave 2 802.11ac, dual-band
  - PoE+ powered from access switches
  - Coverage: Offices, warehouse, production floor

## Server Infrastructure

### Virtualization Platform
- **Hypervisor**: VMware vSphere 7.0 Enterprise Plus
- **Hosts**: 6x Dell PowerEdge R750xa
  - Intel Xeon Gold 6342 (24 cores each)
  - 512GB RAM per host
  - Dual 10GbE NICs

### Virtual Machine Inventory
- **Active Directory**: 3x Windows Server 2019 VMs (multi-master)
- **Exchange Server**: 2x Exchange 2019 (DAG configuration)
- **File Services**: 4x Windows Server 2019 (DFS-R replication)
- **SQL Server**: 3x SQL Server 2019 (Always On Availability)
- **Application Servers**: 12x various (ERP, MES, custom apps)
- **Linux Servers**: 8x CentOS/RHEL (web services, databases)

### Physical Servers
- **SAP HANA**: 2x HP Superdome Flex (mission-critical)
- **Backup Appliance**: 2x Dell EMC IDPA DP4400
- **Security Appliances**: Various physical security tools

## Storage Infrastructure
- **Primary SAN**: Dell EMC PowerMax 2000
  - 200TB effective capacity
  - All-flash arrays for performance
  - SRDF/Metro for synchronous replication

- **Secondary Storage**: Dell EMC Unity 650F
  - 150TB for backup and archive
  - Hybrid flash/spinning disk
  - Snap-to-vault for long-term retention

## Network Segmentation

### Corporate Network VLANs
- **VLAN 10**: Management (10.10.10.0/24)
- **VLAN 20**: Servers (10.10.20.0/23)
- **VLAN 30**: Workstations (10.10.30.0/22)
- **VLAN 40**: WiFi Corporate (10.10.40.0/22)
- **VLAN 50**: WiFi Guest (10.10.50.0/24)
- **VLAN 60**: Printers/Peripherals (10.10.60.0/24)

### OT/Industrial Network
- **VLAN 100**: Plant Floor PLCs (192.168.100.0/24)
- **VLAN 101**: SCADA Systems (192.168.101.0/24)
- **VLAN 102**: HMI Stations (192.168.102.0/24)
- **VLAN 103**: Industrial WiFi (192.168.103.0/24)
- **VLAN 104**: Safety Systems (192.168.104.0/24)

### DMZ Networks
- **VLAN 200**: Web Servers (172.16.200.0/24)
- **VLAN 201**: Mail Relays (172.16.201.0/24)
- **VLAN 202**: VPN Concentrators (172.16.202.0/24)

## Security Infrastructure

### Perimeter Security
- **Next-Gen Firewalls**: 2x Palo Alto PA-3220
  - Active/Passive clustering
  - Threat prevention and URL filtering
  - GlobalProtect VPN gateway

### Internal Security
- **Industrial DMZ**: Separate firewall for OT networks
- **Network Access Control**: Cisco ISE deployment
- **IDS/IPS**: Snort sensors on critical VLANs
- **Web Security**: Cisco Umbrella cloud filtering

### Endpoint Security
- **Antivirus**: CrowdStrike Falcon platform
- **Encryption**: BitLocker for workstations
- **Patch Management**: WSUS with SCCM deployment
- **Mobile Device Management**: Microsoft Intune

## Remote Connectivity

### Site-to-Site VPN
- **Satellite Office 1**: 50Mbps dedicated circuit + backup VPN
- **Satellite Office 2**: 25Mbps circuit + LTE backup
- **Remote Workers**: SSL VPN via GlobalProtect

### WAN Technologies
- **Primary**: MPLS network with QoS
- **Backup**: Site-to-site IPsec over Internet
- **Management**: Out-of-band cellular connections

## Management & Monitoring

### Network Management
- **NMS**: SolarWinds Network Performance Monitor
- **Configuration Management**: Cisco Prime Infrastructure
- **Flow Analysis**: SolarWinds NetFlow Traffic Analyzer

### Systems Management
- **Server Monitoring**: Microsoft SCOM
- **Application Performance**: New Relic
- **Log Management**: Splunk Enterprise
- **ITSM**: ServiceNow platform

### Industrial Systems Monitoring
- **SCADA**: Wonderware System Platform
- **Historian**: Wonderware Historian
- **Asset Performance**: OSIsoft PI System

## Backup & Disaster Recovery

### Backup Strategy
- **Virtual Machines**: Veeam Backup & Replication
- **Physical Servers**: Commvault Complete Backup
- **SAP HANA**: Native HANA backup tools
- **File Services**: DFS-R replication + backup

### Disaster Recovery
- **DR Site**: Co-location facility 50 miles away
- **Replication**: SAN-based async replication
- **RTO**: 8 hours for Tier 1 applications
- **RPO**: 15 minutes for critical databases

## Compliance & Governance

### Regulatory Compliance
- **ISO 27001**: Information security management
- **SOC 2 Type II**: Bi-annual audits
- **PCI DSS**: For payment card processing
- **GDPR**: Data privacy compliance for EU operations

### Change Management
- **Process**: ITIL-based change management
- **CAB**: Weekly Change Advisory Board
- **Testing**: Mandatory testing in dev/staging
- **Rollback**: Automated rollback procedures

## Performance Metrics

### Network Performance
- **Availability**: 99.95% target (measured monthly)
- **Core Link Utilization**: < 50% average
- **WAN Latency**: < 25ms between sites
- **WiFi Performance**: > 50Mbps per AP typical

### Application Performance
- **ERP Response Time**: < 2 seconds
- **Email Delivery**: < 30 seconds internal
- **File Server Access**: < 1 second for small files
- **Database Query Performance**: < 500ms average

## Operational Procedures

### Maintenance Windows
- **Network**: Second Sunday of month, 2-6 AM
- **Servers**: Third Sunday of month, 12-6 AM
- **Applications**: Scheduled per business requirements
- **Emergency Changes**: 24/7 approval process

### Incident Response
- **Severity 1**: 15-minute response, 4-hour resolution
- **Severity 2**: 1-hour response, 24-hour resolution
- **Communication**: Automated notifications via email/SMS
- **Escalation**: Clear escalation matrix with contacts