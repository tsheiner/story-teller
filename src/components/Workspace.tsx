import { useState, useEffect } from 'react';
import { Container, Alert } from 'react-bootstrap';
import { ChartComponent, ChartConfig } from './ChartComponent';

// Define a global event type for workspace updates
export interface WorkspaceUpdateEvent {
  type: 'add-chart' | 'clear-workspace';
  payload?: any;
}

interface WorkspaceProps {
  // Optional initial charts (for testing)
  initialCharts?: ChartConfig[];
}

export function Workspace({ initialCharts = [] }: WorkspaceProps) {
  const [charts, setCharts] = useState<ChartConfig[]>(initialCharts);
  const [error, setError] = useState<string | null>(null);

  // Listen for workspace update events
  useEffect(() => {
    const handleWorkspaceUpdate = (event: CustomEvent<WorkspaceUpdateEvent>) => {
      console.log('Workspace update event received:', event.detail);
      
      try {
        if (event.detail.type === 'add-chart') {
          const chartConfig = event.detail.payload as ChartConfig;
          
          // Validate the chart config
          if (!chartConfig.id || !chartConfig.type || !chartConfig.title) {
            throw new Error('Invalid chart configuration');
          }
          
          // Add the chart to our state
          setCharts(prevCharts => {
            // If chart with this ID already exists, replace it, otherwise add it
            const chartExists = prevCharts.some(chart => chart.id === chartConfig.id);
            if (chartExists) {
              return prevCharts.map(chart => 
                chart.id === chartConfig.id ? chartConfig : chart
              );
            } else {
              return [...prevCharts, chartConfig];
            }
          });
          setError(null);
        } else if (event.detail.type === 'clear-workspace') {
          setCharts([]);
          setError(null);
        }
      } catch (err) {
        console.error('Error handling workspace update:', err);
        setError('Failed to update workspace: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };

    // Register event listener
    window.addEventListener('workspace-update', 
      handleWorkspaceUpdate as EventListener);
      
    return () => {
      window.removeEventListener('workspace-update', 
        handleWorkspaceUpdate as EventListener);
    };
  }, []);

  return (
    <Container fluid className="h-100 bg-light p-3" style={{ minHeight: '100vh', overflowY: 'auto' }}>
      <div className="border rounded p-3 h-100 bg-white">
        <h4>Workspace</h4>
        
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}
        
        {charts.length === 0 ? (
          <p className="text-muted">
            This area will display dynamic content, visualizations, and interactive elements
            based on the conversation context.
          </p>
        ) : (
          <div className="charts-container">
            {charts.map(chart => (
              <div key={chart.id} style={{ marginBottom: '30px', maxWidth: '100%' }}>
                <ChartComponent key={chart.id} config={chart} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}