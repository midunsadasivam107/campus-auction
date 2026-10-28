import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuctionCard from '../components/auction/AuctionCard';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineBookmark,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'textbooks', label: 'Textbooks' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'bicycles', label: 'Bicycles' },
  { value: 'calculators', label: 'Calculators' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'sports', label: 'Sports' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'other', label: 'Other' },
];

const CONDITIONS = [
  { value: '', label: 'All Conditions' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'worn', label: 'Worn' },
];

const SORT_OPTIONS = [
  { value: 'closing_soon', label: 'Closing Soonest' },
  { value: 'latest', label: 'Newly Listed' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter state synced with searchParams
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const condition = searchParams.get('condition') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const closingSoon = searchParams.get('closingSoon') === 'true';
  const sort = searchParams.get('sort') || 'closing_soon';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [localQuery, setLocalQuery] = useState(q);

  useEffect(() => {
    setLocalQuery(q);
  }, [q]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value !== '' && value !== false && value !== null && value !== undefined) {
      next.set(key, String(value));
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('q', localQuery.trim());
  };

  const clearFilters = () => {
    setLocalQuery('');
    setSearchParams({});
  };

  // Fetch listings on parameter change
  useEffect(() => {
    const fetchFilteredListings = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams(searchParams);
        if (!queryParams.has('limit')) queryParams.set('limit', '12');

        const res = await api.get(`/listings?${queryParams.toString()}`);
        setListings(res.data?.listings || []);
        setTotal(res.data?.pagination?.total || 0);
        setTotalPages(res.data?.pagination?.totalPages || 1);
      } catch (err) {
        toast.error('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredListings();
  }, [searchParams]);

  // Handle Save Search
  const handleSaveSearch = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save this search');
      return;
    }

    try {
      const label =
        localQuery.trim() ||
        (category ? `${category} items` : 'Current search filters');

      await api.post('/saved-searches', {
        label,
        filters: {
          query: localQuery.trim() || undefined,
          category: category || undefined,
          condition: condition || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
        },
      });

      toast.success('Search saved! You will receive notifications when matching items appear.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save search');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <HiOutlineSearch className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search by title, keywords, textbook name, model..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl text-sm shadow-xs transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden p-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 flex items-center gap-1.5 text-sm font-medium"
          >
            <HiOutlineFilter className="w-5 h-5" />
            Filters
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Filter Sidebar (Desktop + Mobile Drawer) (3 cols) */}
        <aside
          className={`md:col-span-3 space-y-6 ${
            showMobileFilters
              ? 'block fixed inset-0 z-50 bg-white p-6 overflow-y-auto'
              : 'hidden md:block'
          }`}
        >
          {showMobileFilters && (
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 md:hidden">
              <h2 className="text-lg font-bold text-slate-900">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1 text-slate-500"
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <HiOutlineFilter className="w-4 h-4 text-primary-600" />
                Refine Auctions
              </h3>
              {(category || condition || minPrice || maxPrice || closingSoon || q) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => updateParam('category', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => updateParam('condition', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Price Range (₹)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => updateParam('minPrice', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => updateParam('maxPrice', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Closing Soon Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={closingSoon}
                  onChange={(e) => updateParam('closingSoon', e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <span className="font-medium">Closing in 24 hours</span>
              </label>
            </div>

            {/* Save Search Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveSearch}
                className="w-full py-2 px-3 border border-slate-200 hover:border-primary-300 bg-slate-50 hover:bg-primary-50/40 text-slate-700 hover:text-primary-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <HiOutlineBookmark className="w-4 h-4" />
                Save This Search
              </button>
            </div>
          </div>

          {showMobileFilters && (
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium text-sm md:hidden"
            >
              Apply & Close
            </button>
          )}
        </aside>

        {/* Right Column: Results Grid (9 cols) */}
        <main className="md:col-span-9 space-y-5">
          {/* Top Sort and Results Count Bar */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <p className="text-sm text-slate-600 font-medium">
              Found <span className="font-bold text-slate-900">{total}</span> auctions
              {q && <span> for &ldquo;{q}&rdquo;</span>}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                Sort by:
              </span>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl h-80 border border-slate-200 animate-pulse"
                />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((listing) => (
                  <AuctionCard key={listing._id} listing={listing} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParam('page', page - 1)}
                    className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-slate-500 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateParam('page', page + 1)}
                    className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="text-3xl mb-2">🔍</div>
              <h3 className="text-base font-bold text-slate-800">No auctions match your filters</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try widening your price range, selecting all categories, or clearing search keywords.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-primary-50 text-primary-600 font-semibold rounded-lg text-xs hover:bg-primary-100 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default SearchResultsPage;
