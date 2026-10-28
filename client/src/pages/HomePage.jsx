import { Link } from 'react-router-dom';
import {
  HiOutlineBookOpen,
  HiOutlineDesktopComputer,
  HiOutlineCalculator,
  HiOutlineCube,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { PiDesk } from 'react-icons/pi';

const CATEGORIES = [
  { name: 'Textbooks', icon: HiOutlineBookOpen, slug: 'textbooks' },
  { name: 'Electronics', icon: HiOutlineDesktopComputer, slug: 'electronics' },
  { name: 'Calculators', icon: HiOutlineCalculator, slug: 'calculators' },
  { name: 'Bicycles', icon: HiOutlineSparkles, slug: 'bicycles' },
  { name: 'Furniture', icon: PiDesk, slug: 'furniture' },
  { name: 'Other', icon: HiOutlineCube, slug: 'other' },
];

function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-accent-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Graduating? Sell your stuff
              <br />
              to juniors! 🎓
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto">
              The student-only auction marketplace. List your used textbooks,
              electronics, bicycles, and more — let competitive bidding get you
              the best price.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg shadow-lg hover:bg-primary-50 transition-colors w-full sm:w-auto"
              >
                Browse Auctions
              </Link>
              <Link
                to="/sell"
                className="px-8 py-3 bg-primary-700 text-white font-semibold rounded-lg shadow-lg hover:bg-primary-800 border border-primary-500 transition-colors w-full sm:w-auto"
              >
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <cat.icon className="w-8 h-8 text-slate-400 group-hover:text-primary-500 transition-colors" />
              <span className="text-sm font-medium text-slate-600 group-hover:text-primary-600">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Closing Soon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">🔥 Closing Soon</h2>
          <Link
            to="/?sort=closing_soon"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View all →
          </Link>
        </div>

        {/* Empty state — will be replaced with AuctionCard grid */}
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-lg">
            No active auctions yet. Be the first to list an item!
          </p>
          <Link
            to="/sell"
            className="inline-block mt-4 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create Listing
          </Link>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">📦 Latest Listings</h2>
          <Link
            to="/?sort=latest"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-lg">
            No listings yet. Check back soon!
          </p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
