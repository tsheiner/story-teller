# High CPU Load Incident

The system is currently experiencing unusually high CPU load across multiple service nodes. Initial monitoring shows:

- Web service nodes running at 85-95% CPU utilization (normally 40-50%)
- Database replicas showing increased latency
- Cache hit rates dropping below typical thresholds
- Multiple customer reports of slow response times

No recent deployments or configuration changes have been made. The incident started approximately 30 minutes ago and is ongoing.

Load balancer logs indicate a normal request pattern, suggesting this might not be traffic-related.