import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Plus, ChevronDown, ChevronUp, Loader2, Menu, X, ShoppingBag, MessageSquare, Settings, Heart, AlertCircle, Package, ChevronLeft, ChevronRight, Mailbox as Toolbox, Wrench, ListFilter, MapPin, Wine as Engine, Disc, CarFront, CheckCircle, Zap, DollarSign, SlidersHorizontal, ArrowDownUp, ArrowUp, ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Part, getParts, getOrCreatePartChat, PaginatedResponse, getAvailableMakes, getModelsForMake, getAvailableCategories, getPartsPriceRange, getPartsYearRange } from '../lib/supabase';
import PartCard from '../components/PartCard';
import MobilePageMenu from '../components/MobilePageMenu';
import PartCardSkeleton from '../components/PartCardSkeleton';
import MultiSelect from '../components/MultiSelect';
import PriceRangeSlider from '../components/PriceRangeSlider';
import YearRangeSlider from '../components/YearRangeSlider';
import { debounce } from '../lib/utils';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ActiveFilterTags from '../components/ActiveFilterTags';

const ITEMS_PER_PAGE = 12;

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTrustedSellersOnly, setShowTrustedSellersOnly] = useState(false);
  const [showBoostedOnly, setShowBoostedOnly] = useState(false);
  
  // Advanced filtering state
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [yearRange, setYearRange] = useState<[number, number]>([1990, new Date().getFullYear()]);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Available options for filters
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [priceRangeLimits, setPriceRangeLimits] = useState<{min: number, max: number}>({min: 0, max: 10000});
  const [yearRangeLimits, setYearRangeLimits] = useState<{min: number, max: number}>({min: 1990, max: new Date().getFullYear()});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [paginatedResponse, setPaginatedResponse] = useState<PaginatedResponse<Part> | null>(null);

  // Load available filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [makes, categories, priceRange, yearRange] = await Promise.all([
          getAvailableMakes(),
          getAvailableCategories(),
          getPartsPriceRange(),
          getPartsYearRange()
        ]);
        
        setAvailableMakes(makes);
        setAvailableCategories(categories);
        setPriceRangeLimits(priceRange);
        setPriceRange([priceRange.min, priceRange.max]);
        setYearRangeLimits(yearRange);
        setYearRange([yearRange.min, yearRange.max]);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    
    loadFilterOptions();
  }, []);

  // Load models when make changes
  useEffect(() => {
    const loadModels = async () => {
      if (selectedMakes.length === 1) {
        try {
          const models = await getModelsForMake(selectedMakes[0]);
          setAvailableModels(models);
        } catch (err) {
          console.error('Failed to load models:', err);
        }
      } else {
        setAvailableModels([]);
        setSelectedModels([]);
      }
    };
    
    loadModels();
  }, [selectedMakes]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      setCurrentPage(1);
      loadParts();
    }, 500),
    [searchTerm, partNumber, oemNumber, showTrustedSellersOnly, showBoostedOnly, selectedMakes, selectedModels, selectedCategories, selectedConditions, priceRange, yearRange, sortBy, sortDirection]
  );

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm, partNumber, oemNumber, showTrustedSellersOnly, showBoostedOnly, selectedMakes, selectedModels, selectedCategories, selectedConditions, priceRange, yearRange, sortBy, sortDirection, currentPage, debouncedSearch]);

  const loadParts = async () => {
    try {
      setLoading(true);
      
      // Combine all filters
      const filters = {
        search: searchTerm || undefined,
        partNumber: partNumber || undefined,
        oemNumber: oemNumber || undefined,
        isTrustedSeller: showTrustedSellersOnly || undefined,
        boostedOnly: showBoostedOnly || undefined,
        make: selectedMakes.length > 0 ? selectedMakes : undefined,
        model: selectedModels.length > 0 ? selectedModels : undefined,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
        condition: selectedConditions.length > 0 ? selectedConditions : undefined,
        minPrice: priceRange[0] > priceRangeLimits.min ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < priceRangeLimits.max ? priceRange[1] : undefined,
        minYear: yearRange[0] > yearRangeLimits.min ? yearRange[0] : undefined,
        maxYear: yearRange[1] < yearRangeLimits.max ? yearRange[1] : undefined,
        sortBy: sortBy || undefined,
        sortDirection: sortDirection || undefined
      };
      
      const response = await getParts(filters, currentPage, ITEMS_PER_PAGE);
      
      setParts(response.data);
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
    setSearchTerm('');
    setPartNumber('');
    setOemNumber('');
    setShowTrustedSellersOnly(false);
    setShowBoostedOnly(false);
    setSelectedMakes([]);
    setSelectedModels([]);
    setSelectedCategories([]);
    setSelectedConditions([]);
    setPriceRange([priceRangeLimits.min, priceRangeLimits.max]);
    setYearRange([yearRangeLimits.min, yearRangeLimits.max]);
    setSortBy('created_at');
    setSortDirection('desc');
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

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const handleRemoveFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case 'searchTerm':
        setSearchTerm('');
        break;
      case 'partNumber':
        setPartNumber('');
        break;
      case 'oemNumber':
        setOemNumber('');
        break;
      case 'selectedMakes':
        if (value) {
          setSelectedMakes(prev => prev.filter(make => make !== value));
        } else {
          setSelectedMakes([]);
        }
        break;
      case 'selectedModels':
        if (value) {
          setSelectedModels(prev => prev.filter(model => model !== value));
        } else {
          setSelectedModels([]);
        }
        break;
      case 'selectedCategories':
        if (value) {
          setSelectedCategories(prev => prev.filter(category => category !== value));
        } else {
          setSelectedCategories([]);
        }
        break;
      case 'selectedConditions':
        if (value) {
          setSelectedConditions(prev => prev.filter(condition => condition !== value));
        } else {
          setSelectedConditions([]);
        }
        break;
      case 'priceRange':
        setPriceRange([priceRangeLimits.min, priceRangeLimits.max]);
        break;
      case 'yearRange':
        setYearRange([yearRangeLimits.min, yearRangeLimits.max]);
        break;
      case 'showTrustedSellersOnly':
        setShowTrustedSellersOnly(false);
        break;
      case 'showBoostedOnly':
        setShowBoostedOnly(false);
        break;
      default:
        break;
    }
  };

  const SortingOptions = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => handleSortChange('created_at')}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
          sortBy === 'created_at'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        Date
        {sortBy === 'created_at' && (
          sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
        )}
      </button>
      
      <button
        onClick={() => handleSortChange('price')}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
          sortBy === 'price'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        Price
        {sortBy === 'price' && (
          sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
        )}
      </button>
      
      <button
        onClick={() => handleSortChange('year')}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
          sortBy === 'year'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        Year
        {sortBy === 'year' && (
          sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
        )}
      </button>
    </div>
  );

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
            className="hidden md:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
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

            {/* Active Filter Tags */}
            <ActiveFilterTags 
              filters={{
                searchTerm,
                partNumber,
                oemNumber,
                selectedMakes,
                selectedModels,
                selectedCategories,
                selectedConditions,
                priceRange,
                priceRangeLimits,
                yearRange,
                yearRangeLimits,
                showTrustedSellersOnly,
                showBoostedOnly,
                sortBy,
                sortDirection
              }}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearFilters}
            />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
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

                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white ml-4"
                >
                  <Menu className="h-5 w-5" />
                  <span>Menu</span>
                </button>
              </div>
            </div>

            {/* Sorting Options */}
            <SortingOptions />

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {/* Make Filter - Multi-select */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Make
                      </label>
                      <MultiSelect
                        options={availableMakes.map(make => ({ value: make, label: make }))}
                        selectedValues={selectedMakes}
                        onChange={setSelectedMakes}
                        placeholder="Select makes"
                      />
                    </div>
                    
                    {/* Model Filter - Multi-select (only enabled if one make is selected) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Model
                      </label>
                      <MultiSelect
                        options={availableModels.map(model => ({ value: model, label: model }))}
                        selectedValues={selectedModels}
                        onChange={setSelectedModels}
                        placeholder="Select models"
                        disabled={selectedMakes.length !== 1}
                        className={selectedMakes.length !== 1 ? "opacity-50 cursor-not-allowed" : ""}
                      />
                      {selectedMakes.length !== 1 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Select exactly one make to filter by model
                        </p>
                      )}
                    </div>
                    
                    {/* Category Filter - Multi-select */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <MultiSelect
                        options={availableCategories.map(category => ({ value: category, label: category }))}
                        selectedValues={selectedCategories}
                        onChange={setSelectedCategories}
                        placeholder="Select categories"
                      />
                    </div>
                    
                    {/* Condition Filter - Multi-select */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Condition
                      </label>
                      <MultiSelect
                        options={[
                          { value: 'new', label: 'New' },
                          { value: 'used', label: 'Used' },
                          { value: 'refurbished', label: 'Refurbished' }
                        ]}
                        selectedValues={selectedConditions}
                        onChange={setSelectedConditions}
                        placeholder="Select conditions"
                      />
                    </div>
                    
                    {/* Part Number Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Part Number
                      </label>
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
                    
                    {/* OEM Number Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        OEM Number
                      </label>
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
                    
                    {/* Price Range Slider */}
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price Range
                      </label>
                      <PriceRangeSlider
                        min={priceRangeLimits.min}
                        max={priceRangeLimits.max}
                        value={priceRange}
                        onChange={setPriceRange}
                        step={10}
                      />
                    </div>
                    
                    {/* Year Range Slider */}
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Year Range
                      </label>
                      <YearRangeSlider
                        min={yearRangeLimits.min}
                        max={yearRangeLimits.max}
                        value={yearRange}
                        onChange={setYearRange}
                      />
                    </div>
                    
                    {/* Filter Toggles */}
                    <div className="md:col-span-3 space-y-3">
                      {/* Trusted Sellers Toggle */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="text-gray-700 dark:text-gray-300">Verified Sellers Only</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showTrustedSellersOnly}
                            onChange={() => {
                              setShowTrustedSellersOnly(!showTrustedSellersOnly);
                              setCurrentPage(1);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                      
                      {/* Boosted Only Toggle */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          <span className="text-gray-700 dark:text-gray-300">Boosted Listings Only</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showBoostedOnly}
                            onChange={() => {
                              setShowBoostedOnly(!showBoostedOnly);
                              setCurrentPage(1);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-amber-500 to-orange-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {loading && parts.length === 0 ? (
          <LoadingSkeleton type="card" count={8} containerClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" />
        ) : parts.length === 0 ? (
          <EmptyState 
            icon={<div className="relative">
              <Toolbox className="h-20 w-20 text-blue-500 dark:text-blue-400" />
              <Wrench className="h-10 w-10 text-amber-500 dark:text-amber-400 absolute -bottom-2 -right-2 transform rotate-45" />
            </div>}
            title="It's quiet in here… Time to spark some life! 🧰"
            description={
              searchTerm || partNumber || oemNumber || showTrustedSellersOnly || showBoostedOnly || 
              selectedMakes.length > 0 || selectedModels.length > 0 || selectedCategories.length > 0 || 
              selectedConditions.length > 0 || 
              priceRange[0] > priceRangeLimits.min || priceRange[1] < priceRangeLimits.max ||
              yearRange[0] > yearRangeLimits.min || yearRange[1] < yearRangeLimits.max
                ? 'Try adjusting your filters or search terms'
                : 'Be the first to list a part in the marketplace'
            }
            actionButton={
              searchTerm || partNumber || oemNumber || showTrustedSellersOnly || showBoostedOnly || 
              selectedMakes.length > 0 || selectedModels.length > 0 || selectedCategories.length > 0 || 
              selectedConditions.length > 0 || 
              priceRange[0] > priceRangeLimits.min || priceRange[1] < priceRangeLimits.max ||
              yearRange[0] > yearRangeLimits.min || yearRange[1] < yearRangeLimits.max ? (
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
              )
            }
          />
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
            {paginatedResponse && totalPages > 1 && (
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

                  <div className="hidden sm:flex items-center gap-1">
                    {(() => {
                      const delta = 2; // Number of pages to show on each side of current page
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

                      return rangeWithDots.map((pageNum, index) => (
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
                      ));
                    })()}
                  </div>
                  
                  <span className="sm:hidden text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  
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
            )}

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
              {/* Make Filter */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Make</label>
                <MultiSelect
                  options={availableMakes.map(make => ({ value: make, label: make }))}
                  selectedValues={selectedMakes}
                  onChange={(values) => {
                    setSelectedMakes(values);
                    setCurrentPage(1);
                  }}
                  placeholder="Select makes"
                />
              </div>
              
              {/* Model Filter */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Model</label>
                <MultiSelect
                  options={availableModels.map(model => ({ value: model, label: model }))}
                  selectedValues={selectedModels}
                  onChange={(values) => {
                    setSelectedModels(values);
                    setCurrentPage(1);
                  }}
                  placeholder="Select models"
                  disabled={selectedMakes.length !== 1}
                  className={selectedMakes.length !== 1 ? "opacity-50 cursor-not-allowed" : ""}
                />
              </div>
              
              {/* Category Filter */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Category</label>
                <MultiSelect
                  options={availableCategories.map(category => ({ value: category, label: category }))}
                  selectedValues={selectedCategories}
                  onChange={(values) => {
                    setSelectedCategories(values);
                    setCurrentPage(1);
                  }}
                  placeholder="Select categories"
                />
              </div>
              
              {/* Condition Filter */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Condition</label>
                <MultiSelect
                  options={[
                    { value: 'new', label: 'New' },
                    { value: 'used', label: 'Used' },
                    { value: 'refurbished', label: 'Refurbished' }
                  ]}
                  selectedValues={selectedConditions}
                  onChange={(values) => {
                    setSelectedConditions(values);
                    setCurrentPage(1);
                  }}
                  placeholder="Select conditions"
                />
              </div>
              
              {/* Price Range */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Price Range</label>
                <PriceRangeSlider
                  min={priceRangeLimits.min}
                  max={priceRangeLimits.max}
                  value={priceRange}
                  onChange={(values) => {
                    setPriceRange(values);
                    setCurrentPage(1);
                  }}
                  step={10}
                />
              </div>
              
              {/* Year Range */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Year Range</label>
                <YearRangeSlider
                  min={yearRangeLimits.min}
                  max={yearRangeLimits.max}
                  value={yearRange}
                  onChange={(values) => {
                    setYearRange(values);
                    setCurrentPage(1);
                  }}
                />
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
              
              {/* Sorting Options */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Sort By</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSortChange('created_at')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg ${
                      sortBy === 'created_at'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Date
                    {sortBy === 'created_at' && (
                      sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleSortChange('price')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg ${
                      sortBy === 'price'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Price
                    {sortBy === 'price' && (
                      sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                    )}
                  </button>
                </div>
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
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
    </div>
  );
};

export default MarketplacePage;