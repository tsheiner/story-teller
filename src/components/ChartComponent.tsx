import { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ChartData {
  name: string;
  values: number[];
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'column' | 'pie' | 'area' | 'scatter';
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
  const chartOptions: Highcharts.Options = {
    chart: {
      type: config.type,
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
      categories: config.xAxis.categories || undefined
    },
    yAxis: {
      title: {
        text: config.yAxis.title
      }
    },
    series: config.data.map(series => ({
      name: series.name,
      data: series.values,
      type: config.type
    })),
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