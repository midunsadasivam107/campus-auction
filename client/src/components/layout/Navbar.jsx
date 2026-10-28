import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineBell, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { useState } from 'react';

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="text-xl font-bold text-primary-600">
              Campus Auction
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-slate-600 hover:text-primary-600 font-medium transition-colors"
            >
              Browse
            </Link>
            <Link
              to="/sell"
              className="text-slate-600 hover:text-primary-600 font-medium transition-colors"
            >
              Sell
            </Link>
          </div>

          {/* Right side: Search, Notifications, Auth */}
          <div className="hidden md:flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-primary-600 transition-colors">
              <HiOutlineSearch className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-500 hover:text-primary-600 transition-colors relative">
              <HiOutlineBell className="w-5 h-5" />
            </button>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <HiOutlineX className="w-6 h-6" />
            ) : (
              <HiOutlineMenu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            <Link
              to="/"
              className="block text-slate-600 hover:text-primary-600 font-medium"
            >
              Browse
            </Link>
            <Link
              to="/sell"
              className="block text-slate-600 hover:text-primary-600 font-medium"
            >
              Sell
            </Link>
            <hr className="border-slate-200" />
            <Link
              to="/login"
              className="block text-center px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="block text-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
