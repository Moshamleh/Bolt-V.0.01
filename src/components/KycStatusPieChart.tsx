import React from 'react';
import { Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js';
import { Loader2, AlertCircle } from 'lucide-react';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

interface KycStatusPieChartProps {
  kycData: {
    pending: number;
    approved: number;
    rejected: number;
  };
  loading?: boolean;
  error?: string | null;
}

const KycStatusPieChart: React.FC<KycStatusPieChartProps> = ({ 
  kycData, 
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
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const total = kycData.pending + kycData.approved + kycData.rejected;
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No KYC data available</p>
      </div>
    );
  }

  const data = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [kycData.pending, kycData.approved, kycData.rejected],
        backgroundColor: [
          'rgba(234, 179, 8, 0.7)',   // Amber for pending
          'rgba(34, 197, 94, 0.7)',   // Green for approved
          'rgba(239, 68, 68, 0.7)',   // Red for rejected
        ],
        borderColor: [
          'rgba(234, 179, 8, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Pie data={data} options={options} />
    </div>
  );
};

export default KycStatusPieChart;