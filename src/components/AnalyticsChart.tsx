import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ChartDataPoint } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsChartProps {
  type: 'line' | 'bar' | 'doughnut';
  title: string;
  data: ChartDataPoint[];
  color?: string;
  height?: number;
  loading?: boolean;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  type,
  title,
  data,
  color = '#3b82f6',
  height = 300,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <div className="skeleton h-6 w-32 mb-4"></div>
        <div className={`skeleton w-full`} style={{ height: `${height}px` }}></div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: type === 'doughnut',
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: color,
        borderWidth: 1,
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        border: {
          display: false,
        },
        beginAtZero: true,
      },
    } : undefined,
  };

  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: title,
        data: data.map(item => item.value),
        backgroundColor: type === 'doughnut' 
          ? [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(139, 92, 246, 0.8)',
            ]
          : type === 'bar'
          ? `${color}80`
          : 'transparent',
        borderColor: color,
        borderWidth: 2,
        fill: type === 'line',
        tension: type === 'line' ? 0.4 : 0,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: type === 'line' ? 4 : 0,
        pointHoverRadius: type === 'line' ? 6 : 0,
      },
    ],
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} />;
      default:
        return <Line data={chartData} options={chartOptions} />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg animate-fade-in">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        {title}
      </h3>
      <div className="chart-container" style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </div>
  );
};