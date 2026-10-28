import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  HiOutlineSearch,
  HiOutlineBell,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineShoppingBag,
  HiOutlineTag,
} from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      setIsProfileDropdownOpen(false);
      navigate('/');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
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
            <Link
              to="/ai"
              className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1"
            >
              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                AI
              </span>
              Assistant
            </Link>
          </div>

          {/* Right side: Search, Notifications, Auth */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/search"
              className="p-2 text-slate-500 hover:text-primary-600 transition-colors rounded-lg hover:bg-slate-100"
              title="Search"
            >
              <HiOutlineSearch className="w-5 h-5" />
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/notifications"
                  className="p-2 text-slate-500 hover:text-primary-600 transition-colors relative rounded-lg hover:bg-slate-100"
                  title="Notifications"
                >
                  <HiOutlineBell className="w-5 h-5" />
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-600 text-white font-semibold flex items-center justify-center text-sm shadow-xs">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 text-sm">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                      >
                        <HiOutlineUser className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>
                      <Link
                        to="/dashboard/selling"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                      >
                        <HiOutlineTag className="w-4 h-4 text-slate-400" />
                        My Listings (Seller)
                      </Link>
                      <Link
                        to="/dashboard/buying"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                      >
                        <HiOutlineShoppingBag className="w-4 h-4 text-slate-400" />
                        My Bids (Buyer)
                      </Link>
                      <hr className="my-1 border-slate-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-left"
                      >
                        <HiOutlineLogout className="w-4 h-4 text-red-500" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-500 rounded-lg"
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
          <div className="px-4 py-3 space-y-2">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-slate-700 font-medium"
            >
              Browse Auctions
            </Link>
            <Link
              to="/sell"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-slate-700 font-medium"
            >
              Sell An Item
            </Link>
            <Link
              to="/ai"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-slate-700 font-medium"
            >
              AI Assistant
            </Link>

            <hr className="border-slate-200 my-2" />

            {isAuthenticated ? (
              <>
                <div className="py-2">
                  <p className="font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 text-slate-600"
                >
                  My Profile
                </Link>
                <Link
                  to="/dashboard/selling"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 text-slate-600"
                >
                  My Listings
                </Link>
                <Link
                  to="/dashboard/buying"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 text-slate-600"
                >
                  My Bids
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left py-2 text-red-600 font-medium"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-center px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
