import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from '../components/auction/CountdownTimer';
import StudentProfileModal from '../components/profile/StudentProfileModal';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePlus,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineUser,
} from 'react-icons/hi';

function SellerDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchMyListings = async () => {
    try {
      const res = await api.get('/listings/my/selling');
      setListings(res.data.listings || []);
    } catch {
      toast.error('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMyListings();
  }, [isAuthenticated]);

  const handleApprove = async (listingId) => {
    try {
      await api.post(`/listings/${listingId}/approve`);
      toast.success('Sale approved! Item is reserved.');
      fetchMyListings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (listingId) => {
    if (!window.confirm('Are you sure you want to reject this winning bid?')) return;
    try {
      await api.post(`/listings/${listingId}/reject`);
      toast.success('Winning bid rejected.');
      fetchMyListings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    }
  };

  const handleConfirmPickup = async (listingId) => {
    try {
      await api.post(`/listings/${listingId}/confirm-pickup`);
      toast.success('Campus handover confirmed! 🎉');
      fetchMyListings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to confirm handover');
    }
  };

  const filteredListings = listings.filter((l) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return l.status === 'active';
    if (activeFilter === 'pending')
      return l.status === 'pending_approval' || (l.status === 'closed' && l.bidCount > 0);
    if (activeFilter === 'sold') return l.status === 'sold';
    if (activeFilter === 'completed') return l.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Seller Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your campus auction listings, approve final bids, and confirm handovers
          </p>
        </div>
        <Link
          to="/sell"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl text-sm shadow-xs transition-colors self-start sm:self-auto"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Create New Listing
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto py-4 border-b border-slate-100">
        {[
          { key: 'all', label: `All (${listings.length})` },
          { key: 'active', label: 'Active Auctions' },
          { key: 'pending', label: 'Pending Approval' },
          { key: 'sold', label: 'Awaiting Handover' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listings Table / Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading your listings...</div>
      ) : filteredListings.length > 0 ? (
        <div className="mt-6 space-y-4">
          {filteredListings.map((l) => (
            <div
              key={l._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={
                    l.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=60'
                  }
                  alt={l.title}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {l.category}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                        l.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : l.status === 'sold'
                          ? 'bg-blue-100 text-blue-700'
                          : l.status === 'completed'
                          ? 'bg-purple-100 text-purple-700'
                          : l.status === 'pending_approval'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {l.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <Link
                    to={`/auction/${l._id}`}
                    className="block font-bold text-slate-900 hover:text-primary-600 text-base mt-1 line-clamp-1"
                  >
                    {l.title}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Starting: ₹{l.startingPrice} • {l.bidCount} {l.bidCount === 1 ? 'bid' : 'bids'}
                  </p>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 justify-between md:justify-end">
                <div className="text-left md:text-right">
                  <span className="text-xs text-slate-400 block uppercase font-medium">
                    {l.bidCount > 0 ? 'Leading / Final' : 'Starting'}
                  </span>
                  <span className="text-xl font-extrabold text-slate-900">
                    ₹{l.currentPrice ?? l.startingPrice}
                  </span>
                  {l.currentWinner && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedStudent({
                          user: l.currentWinner,
                          role: 'Winning Buyer Profile',
                        })
                      }
                      className="mt-1 flex items-center md:justify-end gap-1 text-xs text-red-400 hover:text-red-300 font-semibold group cursor-pointer transition-colors"
                      title="View winning student profile"
                    >
                      <HiOutlineUser className="w-3.5 h-3.5" />
                      <span>Winner: {l.currentWinner?.name || 'Buyer'}</span>
                      <span className="text-[10px] text-zinc-400 group-hover:text-red-400 underline ml-0.5">
                        (View Profile)
                      </span>
                    </button>
                  )}
                </div>

                {/* Status specific actions */}
                <div className="flex items-center gap-2">
                  {l.currentWinner && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedStudent({
                          user: l.currentWinner,
                          role: 'Winning Buyer Profile',
                        })
                      }
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      title="View buyer profile & verification"
                    >
                      <HiOutlineUser className="w-3.5 h-3.5 text-red-400" />
                      Buyer Profile
                    </button>
                  )}

                  {(l.status === 'pending_approval' || (l.status === 'closed' && l.bidCount > 0)) && (
                    <>
                      <button
                        onClick={() => handleApprove(l._id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                      >
                        <HiOutlineCheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(l._id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                      >
                        <HiOutlineXCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}

                  {l.status === 'sold' && (
                    <button
                      onClick={() => handleConfirmPickup(l._id)}
                      className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                    >
                      <HiOutlineCheckCircle className="w-4 h-4" /> Confirm Handover
                    </button>
                  )}

                  <Link
                    to={`/auction/${l._id}`}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm mb-3">No listings match this filter.</p>
          <Link
            to="/sell"
            className="inline-block px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg"
          >
            Create New Listing
          </Link>
        </div>
      )}

      {/* Reusable Student Profile Modal */}
      <StudentProfileModal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        initialUser={selectedStudent?.user}
        userId={selectedStudent?.user?._id || selectedStudent?.user?.id}
        roleLabel={selectedStudent?.role || 'Student Profile'}
      />
    </div>
  );
}

export default SellerDashboardPage;
