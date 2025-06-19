import React from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
);

interface DailyDiagnosis {
  date: string;
  count: number;
}

interface DailyDiagnosesChartProps {
  data: DailyDiagnosis[];
  loading?: boolean;
  error?: string | null;
}

const DailyDiagnosesChart: React.FC<DailyDiagnosesChartProps> = ({ 
  data, 
  loading = false,
  error = null
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Format dates for display
  const labels = sortedData.map(item => format(parseISO(item.date), 'MMM d'));
  const counts = sortedData.map(item => item.count);

  // Calculate max value for y-axis
  const maxCount = Math.max(...counts, 5); // Ensure at least 5 for scale

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Diagnoses',
        data: counts,
        borderColor: 'rgba(59, 130, 246, 1)', // blue-600
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)', // gray-900 with opacity
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (tooltipItems: any) => {
            const index = tooltipItems[0].dataIndex;
            return format(parseISO(sortedData[index].date), 'MMMM d, yyyy');
          },
          label: (context: any) => {
            return `${context.parsed.y} diagnoses`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(107, 114, 128, 1)', // gray-500
          font: {
            size: 10
          }
        }
      },
      y: {
        beginAtZero: true,
        max: maxCount + Math.ceil(maxCount * 0.2), // Add 20% padding to the top
        grid: {
          color: 'rgba(243, 244, 246, 0.2)', // gray-100 with opacity
        },
        ticks: {
          color: 'rgba(107, 114, 128, 1)', // gray-500
          font: {
            size: 10
          },
          stepSize: 1,
          precision: 0
        }
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default DailyDiagnosesChart;