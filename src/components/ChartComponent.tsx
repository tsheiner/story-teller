import { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Log for debugging configuration issues
const debugCharts = true;

interface ChartData {
  name: string;
  values: number[];
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'column' | 'pie' | 'area' | 'scatter' | 'timeseries';
  title: string;
  xAxis: {
    title: string;
    categories?: string[];
  };
  yAxis: {
    title: string;
  };
  data: ChartData[];
}

interface ChartComponentProps {
  config: ChartConfig;
}

export function ChartComponent({ config }: ChartComponentProps) {
  const chartRef = useRef<HighchartsReact.RefObject>(null);

  // Log chart configuration for debugging if needed
  if (debugCharts) {
    console.log('Chart config:', config);
    if (config.type === 'timeseries') {
      console.log('Time series categories:', config.xAxis.categories);
    }
  }

  useEffect(() => {
    // Resize chart when window changes
    const handleResize = () => {
      if (chartRef.current && chartRef.current.chart) {
        chartRef.current.chart.reflow();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Convert our simplified config format to Highcharts options
  // const chartOptions: Highcharts.Options = {
  //   chart: {
  //     // If it's a timeseries type, use 'line' type for Highcharts but with special time configuration
  //     type: config.type === 'timeseries' ? 'line' : config.type,
  //     animation: true,
  //     className: 'chart-container'
  //   },
  //   title: {
  //     text: config.title
  //   },
  //   xAxis: {
  //     title: {
  //       text: config.xAxis.title
  //     },
  //     categories: config.xAxis.categories || undefined,
  //     // For timeseries charts, ensure we use category type and properly display the time labels
  //     type: config.type === 'timeseries' ? 'category' : undefined,
  //     // Add explicit label formatting for better time display
  //     labels: config.type === 'timeseries' ? {
  //       style: {
  //         fontSize: '12px'
  //       }
  //     } : undefined
  //   },
  // Convert our simplified config format to Highcharts options
  const chartOptions: Highcharts.Options = {
    chart: {
      // If it's a timeseries type, use 'line' type for Highcharts but with special time configuration
      type: config.type === 'timeseries' ? 'line' : config.type,
      animation: true,
      className: 'chart-container'
    },
    title: {
      text: config.title
    },
    xAxis: {
      title: {
        text: config.xAxis.title
      },
      // Ensure categories are always used when provided
      categories: config.xAxis.categories,
      // For timeseries charts, use category type to display custom labels
      type: (config.type === 'timeseries' && config.xAxis.categories) ? 'category' : undefined,
      // Add explicit label formatting for time display
      labels: config.type === 'timeseries' ? {
        style: {
          fontSize: '12px'
        },
        rotation: 0, 
        align: 'right'
      } : undefined
    },
    yAxis: {
      title: {
        text: config.yAxis.title
      }
    },
    series: config.data.map(series => {
      // For normal series types, use the standard format
      if (config.type !== 'timeseries') {
        return {
          name: series.name,
          data: series.values,
          type: config.type
        };
      }

      // For timeseries, create a more explicit configuration
      return {
        name: series.name,
        data: series.values,
        type: 'line',
        // Add specific marker and line settings for time series
        marker: {
          enabled: true,
          radius: 4
        },
        lineWidth: 2
      };
    }),
    credits: {
      enabled: false
    },
    plotOptions: {
      series: {
        animation: true,
        marker: {
          enabled: true
        }
      }
    }
  };

  // Log the final Highcharts options for debugging
  if (debugCharts && config.type === 'timeseries') {
    console.log('Final Highcharts options for timeseries:', chartOptions);
    console.log('Categories in options:', chartOptions.xAxis &&
      (chartOptions.xAxis as Highcharts.XAxisOptions).categories);
  }

  return (
    <div id={`chart-${config.id}`} className="chart-wrapper my-3">
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
        ref={chartRef}
      />
    </div>
  );
}