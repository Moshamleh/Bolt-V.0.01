import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Plus, ChevronDown, ChevronUp, Loader2, Menu, X, ShoppingBag, MessageSquare, Settings, Heart, AlertCircle, Package, ChevronLeft, ChevronRight, Mailbox as Toolbox, Wrench, ListFilter, MapPin, Wine as Engine, Disc, CarFront, CheckCircle, Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Part, getParts, getOrCreatePartChat, PaginatedResponse } from '../lib/supabase';
import PartCard from '../components/PartCard';
import MobilePageMenu from '../components/MobilePageMenu';
import PartCardSkeleton from '../components/PartCardSkeleton';

const ITEMS_PER_PAGE = 12;

// Define filter chips
const filterChips = [
  { id: 'all', label: 'All', icon: <ListFilter className="h-4 w-4" />, filters: {} },
  { id: 'nearby', label: 'Nearby', icon: <MapPin className="h-4 w-4" />, filters: {} },
  { id: 'engine', label: 'Engine', icon: <Engine className="h-4 w-4" />, filters: { category: 'engine' } },
  { id: 'interior', label: 'Interior', icon: <CarFront className="h-4 w-4" />, filters: { category: 'interior' } },
  { id: 'tires', label: 'Tires', icon: <Disc className="h-4 w-4" />, filters: { search: 'tire' } }
];

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [partNumber, setPartNumber] = useState<string>('');
  const [oemNumber, setOemNumber] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMessagingLoading, setIsMessagingLoading] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFilterChipId, setActiveFilterChipId] = useState('all');
  const [showTrustedSellersOnly, setShowTrustedSellersOnly] = useState(false);
  const [showBoostedOnly, setShowBoostedOnly] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [paginatedResponse, setPaginatedResponse] = useState<PaginatedResponse<Part> | null>(null);

  useEffect(() => {
    const loadParts = async () => {
      try {
        setLoading(true);
        
        // Get the active filter chip
        const activeChip = filterChips.find(chip => chip.id === activeFilterChipId) || filterChips[0];
        
        // Combine the chip filters with other filters
        const filters = {
          ...activeChip.filters,
          search: searchTerm || undefined,
          partNumber: partNumber || undefined,
          oemNumber: oemNumber || undefined,
          isTrustedSeller: showTrustedSellersOnly || undefined
        };
        
        const response = await getParts(filters, currentPage, ITEMS_PER_PAGE);
        
        // If showBoostedOnly is true, filter to only show boosted parts
        let filteredData = response.data;
        if (showBoostedOnly) {
          filteredData = response.data.filter(part => part.is_boosted);
        }
        
        setParts(filteredData);
        setTotalItems(response.total);
        setTotalPages(response.totalPages);
        setPaginatedResponse(response);
      } catch (err) {
        console.error('Failed to load parts:', err);
        setError('Failed to load marketplace listings');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(loadParts, 300);
    return () => clearTimeout(debounceTimeout);
  }, [
    searchTerm, 
    partNumber,
    oemNumber,
    currentPage,
    activeFilterChipId,
    showTrustedSellersOnly,
    showBoostedOnly
  ]);

  const handleSellPart = () => {
    navigate('/sell-part');
  };

  const handlePartClick = (partId: string) => {
    navigate(`/parts/${partId}`);
  };

  const handleMessageSeller = async (e: React.MouseEvent, partId: string, sellerId: string) => {
    e.stopPropagation();
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    setIsMessagingLoading(prev => ({ ...prev, [partId]: true }));
    try {
      const chatId = await getOrCreatePartChat(partId, sellerId);
      navigate(`/marketplace/messages/${chatId}`);
    } catch (err) {
      console.error('Failed to create chat:', err);
      setError('Failed to start chat');
    } finally {
      setIsMessagingLoading(prev => ({ ...prev, [partId]: false }));
    }
  };

  const handleClearFilters = () => {
    setActiveFilterChipId('all');
    setSearchTerm('');
    setPartNumber('');
    setOemNumber('');
    setShowTrustedSellersOnly(false);
    setShowBoostedOnly(false);
    setCurrentPage(1);
    setIsMobileMenuOpen(false);
  };

  const handleReportIssue = () => {
    window.location.href = 'mailto:support@boltauto.com?subject=Marketplace Issue Report';
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChipClick = (chipId: string) => {
    setActiveFilterChipId(chipId);
    setCurrentPage(1); // Reset to first page when changing filters
  };

  const EmptyState = () => {
    const hasFilters = searchTerm || partNumber || oemNumber || activeFilterChipId !== 'all' || showTrustedSellersOnly || showBoostedOnly;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Toolbox className="h-20 w-20 text-blue-500 dark:text-blue-400" />
            <Wrench className="h-10 w-10 text-amber-500 dark:text-amber-400 absolute -bottom-2 -right-2 transform rotate-45" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          It's quiet in here… Time to spark some life! 🧰
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {hasFilters 
            ? 'Try adjusting your filters or search terms'
            : 'Be the first to list a part in the marketplace'}
        </p>
        {hasFilters ? (
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
        ) : (
          <button
            onClick={handleSellPart}
            className="inline-flex items-center px-6 py-3 bg-glowing-gradient text-white rounded-lg font-medium hover:shadow-glow transition-all duration-300 animate-pulse-slow"
            title="Got something to sell? Let the community know!"
          >
            <Plus className="h-5 w-5 mr-2" />
            ⚡ List Your First Part
          </button>
        )}
      </motion.div>
    );
  };

  const PaginationControls = () => {
    if (!paginatedResponse || totalPages <= 1) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
      const delta = 1; // Number of pages to show on each side of current page
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex justify-center mt-8">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!paginatedResponse.hasPreviousPage || loading}
            className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum, index) => (
              <React.Fragment key={index}>
                {pageNum === '...' ? (
                  <span className="px-3 py-2 text-gray-500 dark:text-gray-400">...</span>
                ) : (
                  <button
                    onClick={() => handlePageChange(pageNum as number)}
                    disabled={loading}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      pageNum === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!paginatedResponse.hasNextPage || loading}
            className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Find and sell car parts</p>
          </div>

          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleSellPart}
            className="hidden md:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors animate-pulse-slow"
            title="Got something to sell? Let the community know!"
          >
            <Plus className="h-5 w-5 mr-2" />
            List a Part
          </motion.button>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => handleFilterChipClick(chip.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeFilterChipId === chip.id
                      ? 'bg-blue-600 text-white shadow-glow'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {chip.icon}
                  {chip.label}
                </button>
              ))}
              
              {/* Trusted Sellers Filter */}
              <button
                onClick={() => {
                  setShowTrustedSellersOnly(!showTrustedSellersOnly);
                  setCurrentPage(1); // Reset to first page when changing filters
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  showTrustedSellersOnly
                    ? 'bg-green-600 text-white shadow-glow'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                Verified Sellers
              </button>
              
              {/* Boosted Filter */}
              <button
                onClick={() => {
                  setShowBoostedOnly(!showBoostedOnly);
                  setCurrentPage(1); // Reset to first page when changing filters
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  showBoostedOnly
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-glow'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Zap className="h-4 w-4" />
                Boosted Only
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="hidden md:flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <Filter className="h-5 w-5" />
                  <span>Advanced Filters</span>
                  {showFilters ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <Menu className="h-5 w-5" />
                  <span>Menu</span>
                </button>
              </div>

              {(showFilters || searchTerm || partNumber || oemNumber || activeFilterChipId !== 'all' || showTrustedSellersOnly || showBoostedOnly) && (
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
                  className="overflow-hidden md:block hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {/* Part Number Search */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by Part Number"
                        value={partNumber}
                        onChange={(e) => {
                          setPartNumber(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by OEM Number"
                        value={oemNumber}
                        onChange={(e) => {
                          setOemNumber(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {loading && parts.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <PartCardSkeleton key={index} />
            ))}
          </div>
        ) : parts.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <AnimatePresence>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {parts.map((part, index) => (
                  <motion.div
                    key={part.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PartCard
                      id={part.id}
                      image={part.image_url}
                      title={part.title}
                      price={part.price}
                      condition={part.condition}
                      year={part.year}
                      make={part.make}
                      model={part.model}
                      location={part.location}
                      createdAt={part.created_at}
                      isTrustedSeller={part.seller_is_trusted}
                      isBoosted={part.is_boosted}
                      onClick={() => handlePartClick(part.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {/* Pagination Controls */}
            <PaginationControls />

            {/* Results Summary */}
            {paginatedResponse && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} results
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Menu */}
      <MobilePageMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Marketplace Options"
      >
        <div className="p-4 space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Filters</h3>
            
            <div className="space-y-3">
              {/* Filter Chips for Mobile */}
              <div className="flex flex-wrap gap-2 mb-4">
                {filterChips.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => {
                      handleFilterChipClick(chip.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeFilterChipId === chip.id
                        ? 'bg-blue-600 text-white shadow-glow'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {chip.icon}
                    {chip.label}
                  </button>
                ))}
              </div>
              
              {/* Trusted Sellers Toggle for Mobile */}
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">Verified Sellers Only</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTrustedSellersOnly}
                    onChange={() => setShowTrustedSellersOnly(!showTrustedSellersOnly)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
              
              {/* Boosted Only Toggle for Mobile */}
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-gray-700 dark:text-gray-300">Boosted Listings Only</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBoostedOnly}
                    onChange={() => setShowBoostedOnly(!showBoostedOnly)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-amber-500 to-orange-500"></div>
                </label>
              </div>
              
              {/* Part Number Search */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Part Number</label>
                <input
                  type="text"
                  placeholder="Search by part number"
                  value={partNumber}
                  onChange={(e) => {
                    setPartNumber(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">OEM Number</label>
                <input
                  type="text"
                  placeholder="Search by OEM number"
                  value={oemNumber}
                  onChange={(e) => {
                    setOemNumber(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Marketplace</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  navigate('/sell-part');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors animate-pulse-slow"
                title="Got something to sell? Let the community know!"
              >
                <Plus className="h-5 w-5" />
                <span>List a Part</span>
              </button>
              
              <button
                onClick={() => {
                  navigate('/marketplace/my-listings');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Package className="h-5 w-5" />
                <span>My Listings</span>
              </button>
              
              <button
                onClick={() => {
                  navigate('/marketplace/messages');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
              </button>
              
              <button
                onClick={() => {
                  navigate('/marketplace/saved');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Heart className="h-5 w-5" />
                <span>Saved Listings</span>
              </button>
              
              <button
                onClick={() => {
                  navigate('/marketplace/seller-dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Seller Dashboard</span>
              </button>
              
              <button
                onClick={() => {
                  navigate('/help');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <AlertCircle className="h-5 w-5" />
                <span>Help & FAQ</span>
              </button>
            </div>
          </div>
        </div>
      </MobilePageMenu>

      {/* Floating Action Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={handleSellPart}
        className="md:hidden fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 z-50 animate-pulse-slow"
        title="Got something to sell? Let the community know!"
      >
        <Plus className="h-5 w-5" />
        <span className="font-medium">Post a Part</span>
      </motion.button>
    </div>
  );
};

export default MarketplacePage;