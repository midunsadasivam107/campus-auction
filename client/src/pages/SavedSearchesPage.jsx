import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineBookmark,
  HiOutlineTrash,
  HiOutlineArrowNarrowRight,
  HiOutlineSearch,
} from 'react-icons/hi';

function SavedSearchesPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedSearches = async () => {
    try {
      const res = await api.get('/saved-searches');
      setSavedSearches(res.data.savedSearches || []);
    } catch {
      toast.error('Failed to load saved searches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchSavedSearches();
  }, [isAuthenticated]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/saved-searches/${id}`);
      setSavedSearches((prev) => prev.filter((s) => s._id !== id));
      toast.success('Saved search removed');
    } catch {
      toast.error('Failed to delete saved search');
    }
  };

  const buildSearchUrl = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.condition) params.set('condition', filters.condition);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    return `/search?${params.toString()}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Saved Searches</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Get notified automatically whenever a student lists an item matching your criteria
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading saved searches...</div>
      ) : savedSearches.length > 0 ? (
        <div className="mt-6 space-y-3">
          {savedSearches.map((s) => {
            const f = s.filters || {};
            const searchUrl = buildSearchUrl(f);

            return (
              <div
                key={s._id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <HiOutlineBookmark className="w-5 h-5 text-primary-600" />
                    <h3 className="font-bold text-slate-900 text-base">{s.label}</h3>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {f.category && (
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium capitalize">
                        Category: {f.category}
                      </span>
                    )}
                    {f.condition && (
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium capitalize">
                        Condition: {f.condition?.replace('_', ' ')}
                      </span>
                    )}
                    {(f.minPrice !== undefined || f.maxPrice !== undefined) && (
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium">
                        Price: {f.minPrice ? `₹${f.minPrice}` : '₹0'} – {f.maxPrice ? `₹${f.maxPrice}` : 'Any'}
                      </span>
                    )}
                    {f.query && (
                      <span className="bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-md font-medium">
                        &ldquo;{f.query}&rdquo;
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <Link
                    to={searchUrl}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                  >
                    Run Search <HiOutlineArrowNarrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete saved search"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center text-xl mx-auto mb-3">
            🎯
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No saved searches</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
            Looking for something specific? Search on the browse page and click &ldquo;Save This Search&rdquo; to get notified when items are listed.
          </p>
          <Link
            to="/search"
            className="inline-block px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Go to Search
          </Link>
        </div>
      )}
    </div>
  );
}

export default SavedSearchesPage;
