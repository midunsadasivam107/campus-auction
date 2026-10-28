import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineBookOpen,
  HiOutlineDesktopComputer,
  HiOutlineCalculator,
  HiOutlineCube,
  HiOutlineSparkles,
  HiOutlineSearch,
} from 'react-icons/hi';
import { PiDesk } from 'react-icons/pi';
import AuctionCard from '../components/auction/AuctionCard';
import api from '../services/api';

const CATEGORIES = [
  { name: 'Textbooks', icon: HiOutlineBookOpen, slug: 'textbooks' },
  { name: 'Electronics', icon: HiOutlineDesktopComputer, slug: 'electronics' },
  { name: 'Calculators', icon: HiOutlineCalculator, slug: 'calculators' },
  { name: 'Bicycles', icon: HiOutlineSparkles, slug: 'bicycles' },
  { name: 'Furniture', icon: PiDesk, slug: 'furniture' },
  { name: 'Other', icon: HiOutlineCube, slug: 'other' },
];

function HomePage() {
  const [closingSoonListings, setClosingSoonListings] = useState([]);
  const [latestListings, setLatestListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomeListings = async () => {
      try {
        const [closingSoonRes, latestRes] = await Promise.all([
          api.get('/listings?closingSoon=true&sort=closing_soon&limit=4'),
          api.get('/listings?sort=latest&limit=8'),
        ]);
        setClosingSoonListings(closingSoonRes.data?.listings || []);
        setLatestListings(latestRes.data?.listings || []);
      } catch (err) {
        console.error('Failed to load home listings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeListings();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-white/15 text-white px-3 py-1 rounded-full mb-4">
              🎓 Student-to-Student Marketplace
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Graduating? Sell your stuff
              <br />
              to juniors!
            </h1>
            <p className="mt-4 text-base sm:text-lg text-primary-100 max-w-2xl mx-auto">
              Real-time auctions with anti-sniping protection, campus handover,
              and AI bidding assistance. Fair deals between campus peers.
            </p>

            {/* Hero Quick Search Bar */}
            <form onSubmit={handleSearchSubmit} className="mt-8 max-w-xl mx-auto">
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400">
                  <HiOutlineSearch className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bicycles, calculators, textbooks, monitors..."
                  className="w-full pl-12 pr-28 py-3.5 rounded-xl bg-white text-slate-900 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/search"
                className="px-6 py-2.5 bg-white text-primary-700 font-semibold rounded-lg shadow-sm hover:bg-primary-50 transition-colors text-sm"
              >
                Browse All Auctions
              </Link>
              <Link
                to="/sell"
                className="px-6 py-2.5 bg-primary-800 text-white font-semibold rounded-lg shadow-sm hover:bg-primary-900 border border-primary-500 transition-colors text-sm"
              >
                + List an Item for Sale
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-xl font-bold text-slate-900 mb-5">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/search?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-400 hover:shadow-md transition-all group"
            >
              <cat.icon className="w-7 h-7 text-slate-400 group-hover:text-primary-600 transition-colors" />
              <span className="text-xs font-semibold text-slate-700 group-hover:text-primary-600">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Closing Soon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">🔥 Closing Soon</h2>
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Urgent
            </span>
          </div>
          <Link
            to="/search?sort=closing_soon"
            className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-72 border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : closingSoonListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {closingSoonListings.map((listing) => (
              <AuctionCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500 text-sm">
              No auctions closing in the next 24 hours. Check out all listings below!
            </p>
          </div>
        )}
      </section>

      {/* Latest Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900">📦 Latest Listings</h2>
          <Link
            to="/search?sort=latest"
            className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
          >
            Explore all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-72 border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : latestListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {latestListings.map((listing) => (
              <AuctionCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400 text-base mb-3">
              No active auctions yet. Be the first to list an item on campus!
            </p>
            <Link
              to="/sell"
              className="inline-block px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
            >
              + Create First Listing
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
