import { useState, useEffect } from 'react';
import { Container, Alert } from 'react-bootstrap';
import { ChartComponent, ChartConfig } from './ChartComponent';
import { TableComponent, TableConfig } from './TableComponent';

// Define a global event type for workspace updates
export interface WorkspaceUpdateEvent {
  type: 'add-chart' | 'add-table' | 'clear-workspace';
  payload?: any;
}

interface WorkspaceProps {
  // Optional initial visualizations (for testing)
  initialCharts?: ChartConfig[];
  initialTables?: TableConfig[];
}

export function Workspace({ initialCharts = [], initialTables = [] }: WorkspaceProps) {
  const [charts, setCharts] = useState<ChartConfig[]>(initialCharts);
  const [tables, setTables] = useState<TableConfig[]>(initialTables);
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
        } else if (event.detail.type === 'add-table') {
          const tableConfig = event.detail.payload as TableConfig;
          
          // Validate the table config
          if (!tableConfig.id || !tableConfig.type || !tableConfig.title) {
            throw new Error('Invalid table configuration');
          }
          
          // Add the table to our state
          setTables(prevTables => {
            // If table with this ID already exists, replace it, otherwise add it
            const tableExists = prevTables.some(table => table.id === tableConfig.id);
            if (tableExists) {
              return prevTables.map(table => 
                table.id === tableConfig.id ? tableConfig : table
              );
            } else {
              return [...prevTables, tableConfig];
            }
          });
          setError(null);
        } else if (event.detail.type === 'clear-workspace') {
          setCharts([]);
          setTables([]);
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

  const hasContent = charts.length > 0 || tables.length > 0;

  return (
    <Container fluid className="h-100 bg-light p-3" style={{ minHeight: '100vh', overflowY: 'auto' }}>
      <div className="border rounded p-3 h-100 bg-white">
        <h4>Workspace</h4>
        
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}
        
        {!hasContent ? (
          <p className="text-muted">
            This area will display dynamic content, visualizations, and interactive elements
            based on the conversation context.
          </p>
        ) : (
          <div className="visualizations-container">
            {/* Render charts */}
            {charts.map(chart => (
              <div key={chart.id} style={{ marginBottom: '30px', maxWidth: '100%' }}>
                <ChartComponent config={chart} />
              </div>
            ))}
            
            {/* Render tables */}
            {tables.map(table => (
              <div key={table.id} style={{ marginBottom: '30px', maxWidth: '100%' }}>
                <TableComponent config={table} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}