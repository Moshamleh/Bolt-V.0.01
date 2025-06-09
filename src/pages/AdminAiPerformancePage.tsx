import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BarChart2, Download, Loader2, ThumbsUp, ThumbsDown,
  Car, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AiMetrics {
  totalResponses: number;
  helpfulCount: number;
  unhelpfulCount: number;
  byVehicle: {
    make: string;
    model: string;
    year: number;
    helpfulCount: number;
    unhelpfulCount: number;
  }[];
}

const AdminAiPerformancePage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AiMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        // Call the secure edge function to get metrics
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-metrics`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch metrics');
        
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load metrics:', err);
        setError('Failed to load AI performance metrics');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [navigate]);

  const handleExportCsv = () => {
    if (!metrics) return;

    // Create CSV content
    const headers = ['Make', 'Model', 'Year', 'Helpful', 'Unhelpful', 'Total', 'Success Rate'];
    const rows = metrics.byVehicle.map(vehicle => [
      vehicle.make,
      vehicle.model,
      vehicle.year,
      vehicle.helpfulCount,
      vehicle.unhelpfulCount,
      vehicle.helpfulCount + vehicle.unhelpfulCount,
      `${((vehicle.helpfulCount / (vehicle.helpfulCount + vehicle.unhelpfulCount)) * 100).toFixed(1)}%`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-performance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
      <div className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error}
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <BarChart2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Performance</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitor and analyze AI diagnostic effectiveness
              </p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : metrics ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Responses
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.totalResponses.toLocaleString()}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Helpful Responses
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {((metrics.helpfulCount / metrics.totalResponses) * 100).toFixed(1)}%
                  </p>
                  <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Needs Improvement
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {((metrics.unhelpfulCount / metrics.totalResponses) * 100).toFixed(1)}%
                  </p>
                  <ThumbsDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Vehicle Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Performance by Vehicle
                    </h2>
                  </div>
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Helpful
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Needs Improvement
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Success Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {metrics.byVehicle.map((vehicle, index) => {
                      const total = vehicle.helpfulCount + vehicle.unhelpfulCount;
                      const successRate = (vehicle.helpfulCount / total) * 100;
                      
                      return (
                        <tr 
                          key={`${vehicle.make}-${vehicle.model}-${vehicle.year}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {vehicle.year}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            {total}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-green-600 dark:text-green-400">
                            {vehicle.helpfulCount}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-red-600 dark:text-red-400">
                            {vehicle.unhelpfulCount}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="absolute top-0 left-0 h-full bg-blue-600 dark:bg-blue-400"
                                style={{ width: `${successRate}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {successRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminAiPerformancePage;