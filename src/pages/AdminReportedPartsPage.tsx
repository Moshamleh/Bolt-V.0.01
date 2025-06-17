import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, Flag, Loader2, User, AlertTriangle, 
  ExternalLink, CheckCircle, Trash2, Search, Filter,
  ChevronDown, ChevronUp, Package, Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useProfile } from '../hooks/useProfile';
import { ReportedPart, getReportedParts, deleteReport, updatePart } from '../lib/supabase';

const AdminReportedPartsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: profileLoading } = useProfile();
  const [reports, setReports] = useState<ReportedPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<'all' | 'pending' | 'resolved'>('all');

  useEffect(() => {
    const loadReports = async () => {
      if (!isAdmin && !profileLoading) return;
      
      try {
        setLoading(true);
        const data = await getReportedParts();
        setReports(data);
      } catch (err) {
        console.error('Failed to load reported parts:', err);
        setError('Failed to load reported parts');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      loadReports();
    }
  }, [isAdmin, profileLoading]);

  const handleViewPart = (partId: string) => {
    window.open(`/parts/${partId}`, '_blank');
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    setProcessingId(reportId);
    try {
      await deleteReport(reportId);
      setReports(prev => prev.filter(report => report.id !== reportId));
      toast.success('Report deleted successfully');
    } catch (err) {
      console.error('Failed to delete report:', err);
      toast.error('Failed to delete report');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDisapprovePart = async (report: ReportedPart) => {
    if (!window.confirm('Are you sure you want to disapprove this part? It will be hidden from the marketplace.')) {
      return;
    }

    setProcessingId(report.id);
    try {
      // Update the part to be unapproved
      await updatePart(report.part_id, { approved: false });
      
      // Update the local state
      setReports(prev => prev.map(r => 
        r.id === report.id 
          ? { ...r, part: { ...r.part, approved: false } } 
          : r
      ));
      
      toast.success('Part has been disapproved and hidden from the marketplace');
    } catch (err) {
      console.error('Failed to disapprove part:', err);
      toast.error('Failed to disapprove part');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprovePart = async (report: ReportedPart) => {
    if (!window.confirm('Are you sure you want to approve this part? This will dismiss the report.')) {
      return;
    }

    setProcessingId(report.id);
    try {
      // Update the part to be approved
      await updatePart(report.part_id, { approved: true });
      
      // Delete the report
      await deleteReport(report.id);
      
      // Update the local state
      setReports(prev => prev.filter(r => r.id !== report.id));
      
      toast.success('Part has been approved and the report dismissed');
    } catch (err) {
      console.error('Failed to approve part:', err);
      toast.error('Failed to approve part');
    } finally {
      setProcessingId(null);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedReason('');
    setReportStatus('all');
  };

  const filteredReports = reports.filter(report => {
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        report.part.title.toLowerCase().includes(searchLower) ||
        report.part.description.toLowerCase().includes(searchLower) ||
        report.reason.toLowerCase().includes(searchLower) ||
        (report.message && report.message.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Apply reason filter
    if (selectedReason && report.reason !== selectedReason) {
      return false;
    }
    
    // Apply status filter
    if (reportStatus === 'pending' && report.part.approved === false) {
      return false;
    } else if (reportStatus === 'resolved' && report.part.approved !== false) {
      return false;
    }
    
    return true;
  });

  // Get unique reasons for filter dropdown
  const uniqueReasons = Array.from(new Set(reports.map(report => report.reason)));

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/admin')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <Flag className="h-8 w-8 text-red-600 dark:text-red-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reported Parts</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Review and manage reported marketplace listings
              </p>
            </div>
          </div>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {(showFilters || selectedReason || searchTerm || reportStatus !== 'all') && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reason
                      </label>
                      <select
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Reasons</option>
                        {uniqueReasons.map(reason => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={reportStatus}
                        onChange={(e) => setReportStatus(e.target.value as 'all' | 'pending' | 'resolved')}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Reports</option>
                        <option value="pending">Pending Action</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <Flag className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No reported parts found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || selectedReason || reportStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'There are no reported parts at this time'}
            </p>
            {(searchTerm || selectedReason || reportStatus !== 'all') && (
              <button
                onClick={handleClearFilters}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredReports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
                    report.part.approved === false 
                      ? 'border-red-200 dark:border-red-800' 
                      : 'border-gray-100 dark:border-gray-700'
                  } overflow-hidden`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {report.part.image_url ? (
                          <img
                            src={report.part.image_url}
                            alt={report.part.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {report.part.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium rounded-full">
                              {report.reason}
                            </span>
                            
                            {report.part.approved === false && (
                              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium rounded-full">
                                Disapproved
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <Car className="h-4 w-4 mr-1" />
                          <span>
                            {report.part.year} {report.part.make} {report.part.model}
                            {report.part.trim && ` ${report.part.trim}`}
                          </span>
                        </div>
                        
                        {report.message && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Additional details: </span>
                              {report.message}
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                              {report.reporter.avatar_url ? (
                                <img
                                  src={report.reporter.avatar_url}
                                  alt="Reporter"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {report.reporter.full_name || 'Anonymous User'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewPart(report.part.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Part
                            </button>
                            
                            {report.part.approved !== false && (
                              <button
                                onClick={() => handleDisapprovePart(report)}
                                disabled={processingId === report.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === report.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                                Disapprove Part
                              </button>
                            )}
                            
                            {report.part.approved === false && (
                              <button
                                onClick={() => handleApprovePart(report)}
                                disabled={processingId === report.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === report.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                                Approve Part
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              disabled={processingId === report.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingId === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Dismiss Report
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportedPartsPage;