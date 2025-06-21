import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Wrench, DollarSign, FileText, 
  Loader2, Plus, Download, Trash2, Car, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  ServiceRecord, 
  getVehicleServiceRecords, 
  deleteServiceRecord, 
  Vehicle, 
  getUserVehicles 
} from '../lib/supabase';
import ServiceRecordSkeleton from '../components/ServiceRecordSkeleton';

const ServiceHistoryPage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!vehicleId) return;
      
      try {
        setLoading(true);
        
        // Load vehicle and service records in parallel
        const [vehicles, serviceRecords] = await Promise.all([
          getUserVehicles(),
          getVehicleServiceRecords(vehicleId)
        ]);
        
        const foundVehicle = vehicles.find(v => v.id === vehicleId);
        if (!foundVehicle) {
          setError('Vehicle not found');
          setTimeout(() => navigate('/vehicles'), 3000);
          return;
        }
        
        setVehicle(foundVehicle);
        setRecords(serviceRecords);
      } catch (err) {
        console.error('Failed to load service history:', err);
        setError('Failed to load service history');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [vehicleId, navigate]);

  const handleAddServiceRecord = () => {
    if (vehicleId) {
      navigate(`/vehicles/${vehicleId}/add-service`);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this service record? This action cannot be undone.')) {
      return;
    }

    setDeletingId(recordId);
    try {
      await deleteServiceRecord(recordId);
      setRecords(prev => prev.filter(record => record.id !== recordId));
      toast.success('Service record deleted successfully');
    } catch (err) {
      console.error('Failed to delete service record:', err);
      toast.error('Failed to delete service record');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadInvoice = (url: string, serviceName: string) => {
    // Create a safe filename
    const safeServiceName = serviceName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `invoice_${safeServiceName}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getVehicleDisplayName = () => {
    if (!vehicle) return 'Loading...';
    
    if (vehicle.other_vehicle_description) {
      return vehicle.other_vehicle_description;
    }
    
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
  };

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center"
    >
      <div className="flex justify-center mb-4">
        <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No service records yet
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Start tracking maintenance and repairs for your vehicle
      </p>
      <button
        onClick={handleAddServiceRecord}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Service Record
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/vehicles')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Vehicles
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Service History
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {getVehicleDisplayName()}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Maintenance Records
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {records.length} {records.length === 1 ? 'record' : 'records'} found
            </p>
          </div>
          <button
            onClick={handleAddServiceRecord}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Record
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <ServiceRecordSkeleton key={index} />
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-6">
              {records.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          {record.service_type}
                        </h3>
                        <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{format(new Date(record.service_date), 'MMMM d, yyyy')}</span>
                          <span className="mx-2">•</span>
                          <span>{record.mileage.toLocaleString()} miles</span>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(record.cost)}
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {record.description}
                    </p>

                    {(record.service_provider || record.notes) && (
                      <div className="mb-4 space-y-2">
                        {record.service_provider && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium mr-2">Service Provider:</span>
                            {record.service_provider}
                          </div>
                        )}
                        {record.notes && (
                          <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium mr-2">Notes:</span>
                            <span>{record.notes}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                      {record.invoice_url && (
                        <button
                          onClick={() => handleDownloadInvoice(record.invoice_url!, record.service_type)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Invoice
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        disabled={deletingId === record.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === record.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ServiceHistoryPage;